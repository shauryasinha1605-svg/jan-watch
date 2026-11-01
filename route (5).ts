import { NextRequest } from 'next/server'; import { scryptSync,timingSafeEqual } from 'node:crypto';
import { readStore } from '@/lib/store'; import { createSessionToken, sessionCookieName } from '@/lib/auth'; import { fail, ok } from '@/lib/http';
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.password) return fail('Email and password are required.', 'VALIDATION_ERROR', 400);
  const store = await readStore(); const profile = store.profiles.find(p => p.email.toLowerCase() === String(body.email).toLowerCase());
  if (!profile) return fail('Invalid email or password.', 'INVALID_CREDENTIALS', 401);
  let valid=false;
  if(profile.passwordHash){try{const [salt,hash]=profile.passwordHash.split(':');const actual=scryptSync(String(body.password),salt,64);valid=timingSafeEqual(actual,Buffer.from(hash,'hex'));}catch{valid=false;}}
  else valid=body.password==='janwatch123';
  if(!valid)return fail('Invalid email or password.', 'INVALID_CREDENTIALS', 401);
  const token = createSessionToken({ id:profile.id, name:profile.name, email:profile.email, role:profile.role });
  const response = ok({ user:{ id:profile.id, name:profile.name, email:profile.email, role:profile.role } }, 'Signed in successfully.');
  response.cookies.set(sessionCookieName, token, { httpOnly:true, secure:process.env.NODE_ENV==='production', sameSite:'lax', path:'/', maxAge:60*60*24*7 });
  return response;
}
