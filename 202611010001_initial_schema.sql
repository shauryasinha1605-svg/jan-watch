-- JanWatch production Supabase schema starter.
-- The downloadable prototype currently runs in local JSON demo mode; see README before connecting Supabase.
create extension if not exists pgcrypto;
create extension if not exists postgis;

do $$ begin
  create type public.user_role as enum ('citizen','officer','admin');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.complaint_category as enum ('roads','sanitation','water','drainage','electricity','pollution','public_infrastructure','other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.complaint_severity as enum ('low','medium','high','critical');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.complaint_status as enum ('submitted','under_review','assigned','in_progress','resolved','verified','reopened','rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.wards (
  id uuid primary key default gen_random_uuid(), name text not null, city text not null default 'Demo City', created_at timestamptz not null default now()
);
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(), name text not null unique, category public.complaint_category not null unique, created_at timestamptz not null default now()
);
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade, name text not null, email text not null unique,
  role public.user_role not null default 'citizen', ward_id uuid references public.wards(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.department_members (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  department_id uuid not null references public.departments(id), ward_id uuid not null references public.wards(id), created_at timestamptz not null default now(),
  unique(user_id,department_id,ward_id)
);
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(), ticket_code text not null unique, user_id uuid not null references public.profiles(id),
  title text not null, description text not null, category public.complaint_category not null default 'other', issue_type text not null default 'unclassified',
  severity public.complaint_severity not null default 'medium', status public.complaint_status not null default 'submitted',
  latitude double precision not null check(latitude between -90 and 90), longitude double precision not null check(longitude between -180 and 180),
  location_text text, ward_id uuid not null references public.wards(id), department_id uuid references public.departments(id),
  assigned_officer_id uuid references public.profiles(id), image_path text, resolution_image_path text, is_public boolean not null default false,
  ai_analysis jsonb, analysis_state text not null default 'processing' check(analysis_state in ('processing','completed','needs_review','failed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists complaints_created_at_idx on public.complaints(created_at desc);
create index if not exists complaints_status_idx on public.complaints(status);
create index if not exists complaints_category_idx on public.complaints(category);
create index if not exists complaints_department_ward_idx on public.complaints(department_id,ward_id);
create index if not exists complaints_public_idx on public.complaints(is_public) where is_public=true;
create index if not exists complaints_geo_idx on public.complaints using gist (geography(st_setsrid(st_makepoint(longitude,latitude),4326)));

create table if not exists public.complaint_updates (
  id uuid primary key default gen_random_uuid(), complaint_id uuid not null references public.complaints(id) on delete cascade,
  updated_by uuid references public.profiles(id), old_status public.complaint_status, new_status public.complaint_status,
  remarks text not null default '', evidence_path text, event_type text not null default 'update', created_at timestamptz not null default now()
);
create index if not exists complaint_updates_complaint_created_idx on public.complaint_updates(complaint_id,created_at);

create table if not exists public.complaint_relations (
  id uuid primary key default gen_random_uuid(), complaint_id uuid not null references public.complaints(id) on delete cascade,
  related_complaint_id uuid not null references public.complaints(id) on delete cascade, relation_type text not null default 'potential_duplicate',
  distance_metres integer, created_by uuid references public.profiles(id), created_at timestamptz not null default now(),
  check(complaint_id <> related_complaint_id), unique(complaint_id,related_complaint_id)
);
create table if not exists public.reopening_requests (
  id uuid primary key default gen_random_uuid(), complaint_id uuid not null references public.complaints(id) on delete cascade,
  requested_by uuid not null references public.profiles(id), reason text not null, state text not null default 'pending' check(state in ('pending','approved','declined')),
  reviewed_by uuid references public.profiles(id), review_note text, created_at timestamptz not null default now(), reviewed_at timestamptz
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  complaint_id uuid references public.complaints(id) on delete cascade, title text not null, body text not null,
  read_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.ai_analysis_logs (
  id uuid primary key default gen_random_uuid(), complaint_id uuid not null references public.complaints(id) on delete cascade,
  provider text not null, model text, state text not null, error_code text, error_message text,
  response jsonb, created_at timestamptz not null default now()
);

create or replace function public.is_city_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin');
$$;
create or replace function public.is_assigned_officer(p_department uuid,p_ward uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.department_members dm where dm.user_id=auth.uid() and dm.department_id=p_department and dm.ward_id=p_ward);
$$;
create or replace function public.can_read_complaint(p_complaint uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.complaints c where c.id=p_complaint and (c.user_id=auth.uid() or public.is_city_admin() or public.is_assigned_officer(c.department_id,c.ward_id)));
$$;

alter table public.profiles enable row level security;
alter table public.wards enable row level security;
alter table public.departments enable row level security;
alter table public.department_members enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_updates enable row level security;
alter table public.complaint_relations enable row level security;
alter table public.reopening_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_analysis_logs enable row level security;

drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles for select using (id=auth.uid() or public.is_city_admin() or exists(select 1 from public.department_members dm where dm.user_id=profiles.id and dm.department_id in (select department_id from public.department_members where user_id=auth.uid())));
drop policy if exists "profiles update own basic fields" on public.profiles;
create policy "profiles update own basic fields" on public.profiles for update using (id=auth.uid()) with check (id=auth.uid());
drop policy if exists "wards readable by authenticated" on public.wards;
create policy "wards readable by authenticated" on public.wards for select to authenticated using (true);
drop policy if exists "departments readable by authenticated" on public.departments;
create policy "departments readable by authenticated" on public.departments for select to authenticated using (true);
drop policy if exists "members visible to self or admin" on public.department_members;
create policy "members visible to self or admin" on public.department_members for select using (user_id=auth.uid() or public.is_city_admin());
drop policy if exists "admins manage department members" on public.department_members;
create policy "admins manage department members" on public.department_members for all using (public.is_city_admin()) with check (public.is_city_admin());
drop policy if exists "complaint read scoped" on public.complaints;
create policy "complaint read scoped" on public.complaints for select to authenticated using (user_id=auth.uid() or public.is_city_admin() or public.is_assigned_officer(department_id,ward_id));
drop policy if exists "citizens create own complaints" on public.complaints;
create policy "citizens create own complaints" on public.complaints for insert to authenticated with check (user_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='citizen'));
drop policy if exists "authority updates scoped complaints" on public.complaints;
create policy "authority updates scoped complaints" on public.complaints for update using (public.is_city_admin() or public.is_assigned_officer(department_id,ward_id)) with check (public.is_city_admin() or public.is_assigned_officer(department_id,ward_id));
drop policy if exists "updates readable with complaint" on public.complaint_updates;
create policy "updates readable with complaint" on public.complaint_updates for select using (public.can_read_complaint(complaint_id));
drop policy if exists "authority inserts updates" on public.complaint_updates;
create policy "authority inserts updates" on public.complaint_updates for insert to authenticated with check (updated_by=auth.uid() and (public.is_city_admin() or exists(select 1 from public.complaints c where c.id=complaint_id and public.is_assigned_officer(c.department_id,c.ward_id))));
drop policy if exists "relations visible to authority" on public.complaint_relations;
create policy "relations visible to authority" on public.complaint_relations for select using (public.is_city_admin() or exists(select 1 from public.complaints c where c.id=complaint_id and public.is_assigned_officer(c.department_id,c.ward_id)));
drop policy if exists "authority manages relations" on public.complaint_relations;
create policy "authority manages relations" on public.complaint_relations for all using (public.is_city_admin() or exists(select 1 from public.complaints c where c.id=complaint_id and public.is_assigned_officer(c.department_id,c.ward_id))) with check (public.is_city_admin() or exists(select 1 from public.complaints c where c.id=complaint_id and public.is_assigned_officer(c.department_id,c.ward_id)));
drop policy if exists "reporter reads reopening requests" on public.reopening_requests;
create policy "reporter reads reopening requests" on public.reopening_requests for select using (requested_by=auth.uid() or public.is_city_admin());
drop policy if exists "reporter creates reopening request" on public.reopening_requests;
create policy "reporter creates reopening request" on public.reopening_requests for insert with check (requested_by=auth.uid() and exists(select 1 from public.complaints c where c.id=complaint_id and c.user_id=auth.uid() and c.status in ('resolved','verified')));
drop policy if exists "admin reviews reopening requests" on public.reopening_requests;
create policy "admin reviews reopening requests" on public.reopening_requests for update using (public.is_city_admin()) with check (public.is_city_admin());
drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications" on public.notifications for select using (user_id=auth.uid());
drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications" on public.notifications for update using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "admins read AI logs" on public.ai_analysis_logs;
create policy "admins read AI logs" on public.ai_analysis_logs for select using (public.is_city_admin());

-- Seed fictional Demo City wards and departments. IDs are generated; look them up by name/category.
insert into public.wards(name,city) values
 ('Ward 1 – North Zone','Demo City'),('Ward 2 – South Zone','Demo City'),('Ward 3 – Central Zone','Demo City'),('Ward 4 – East Zone','Demo City'),('Ward 5 – West Zone','Demo City') on conflict do nothing;
insert into public.departments(name,category) values
 ('Public Works Department','roads'),('Waste Management Department','sanitation'),('Water Supply Department','water'),('Drainage Department','drainage'),('Electrical Department','electricity'),('Environmental Department','pollution'),('Municipal Engineering Department','public_infrastructure'),('Municipal Control Room','other') on conflict do nothing;

-- Prevent users from promoting themselves to officer/admin through profile updates.
create or replace function public.protect_profile_privileged_fields() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if (new.role is distinct from old.role or new.ward_id is distinct from old.ward_id)
     and auth.role() <> 'service_role' and not public.is_city_admin() then
    raise exception 'Only a city administrator can change profile role or ward assignment';
  end if;
  return new;
end;
$$;
drop trigger if exists protect_profile_privileged_fields on public.profiles;
create trigger protect_profile_privileged_fields before update on public.profiles
for each row execute function public.protect_profile_privileged_fields();


-- Supabase Auth signup creates a citizen profile. Officer/admin profiles must be provisioned by trusted administrators.
create or replace function public.handle_new_citizen_profile() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,name,email,role)
  values(new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.email, 'citizen')
  on conflict(id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_janwatch on auth.users;
create trigger on_auth_user_created_janwatch after insert on auth.users
for each row execute function public.handle_new_citizen_profile();
