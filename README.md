# JanWatch — working civic-tech prototype

JanWatch is an end-to-end prototype for reporting and tracking civic infrastructure complaints. It follows the attached `janwatch_application_specification.md` and includes citizen, officer, administrator and public-facing workflows.

## What works in this prototype

- Citizen registration plus demo authentication with signed, HTTP-only session cookies and three role types.
- Citizen complaint creation with text, optional JPEG/PNG/WebP image (5 MB limit), coordinates, ward and public/private visibility.
- Complaint is persisted before AI analysis runs. AI errors do not discard the report.
- Optional Gemini multimodal analysis using `@google/genai`; if no key is configured or Gemini fails, a clearly labelled rule-based classifier runs.
- Zod validation of Gemini structured output; backend maps category to a fixed department ID.
- Unique ticket codes, complaint timelines and analysis states.
- Location/category/date-based duplicate candidates (100 m / previous 30 days); no automatic merging.
- Citizen dashboard, complaint details, status tracking, resolution confirmation and reopening requests.
- Officer queue scoped to seeded department/ward permissions; status updates, resolution evidence uploads and in-app notifications.
- Administrator city-wide dashboard, assignment override and reopening-request review.
- In-app notifications for assignment, status and reopening events.
- Public accountability dashboard with filters, charts and Leaflet/OpenStreetMap pins. Only public complaints are returned; coordinates are rounded before public display.
- Demo City seeded with five wards, eight departments, sample citizens/officers/admin and fictional complaints.

## Important implementation boundary

**The current runnable prototype uses a local JSON file as its demo persistence layer** (`data/janwatch.json`) and private local files in `data/uploads/`, served through an authorization-checked API route. This makes the prototype runnable without an external account or credentials. It is suitable for a single local demo instance, not for concurrent production deployment or serverless hosting with ephemeral filesystems.

The `supabase/migrations/202611010001_initial_schema.sql` file provides the PostgreSQL/Supabase schema, indexes, helper functions and initial RLS policies for the production direction described in the specification. The current API routes are not yet wired to Supabase Auth/PostgreSQL/Storage. Likewise, Supabase keys in `.env.example` are placeholders for that integration, not active switches. Do not deploy the JSON demo backend as a production municipal service.

Gemini is optional. To enable it, set `GEMINI_API_KEY` and optionally `GEMINI_MODEL`. Without a key, the app remains functional using the explicit rule-based fallback.

## Requirements

- Node.js 22 or later (recommended for the Gemini SDK)
- npm 10+

## Run locally

```bash
cd janwatch-prototype
npm install
cp .env.example .env.local
# Optional: add GEMINI_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

All demo accounts use password **`janwatch123`**.

| Role | Email | Scope |
|---|---|---|
| Citizen | `citizen@janwatch.demo` | Create and track own complaints |
| Citizen | `citizen2@janwatch.demo` | Second citizen account |
| Roads officer | `roads@janwatch.demo` | Public Works · Ward 3 |
| Sanitation officer | `sanitation@janwatch.demo` | Waste Management · Ward 1 |
| Water officer | `water@janwatch.demo` | Water Supply · Ward 2 |
| Administrator | `admin@janwatch.demo` | City-wide access |

These accounts and sample reports are fictional. The first run creates `data/janwatch.json` from the seed data. To reset the demo, stop the server and delete `data/janwatch.json`; the next request re-seeds the store. Uploaded images are in `data/uploads/` and can be removed separately.

## Environment variables

See `.env.example`. `JANWATCH_SESSION_SECRET` should be replaced with a long random value before sharing the prototype beyond a local machine. Gemini credentials are server-side only.

## Implemented API routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create a citizen account |
| POST | `/api/auth/login` | Sign-in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Current demo session |
| GET | `/api/wards` | Wards and departments |
| POST | `/api/complaints` | Citizen complaint submission (multipart) |
| GET | `/api/complaints` | Role-scoped complaint list, filters and pagination |
| GET | `/api/complaints/:id` | Complaint detail and timeline |
| PATCH | `/api/complaints/:id/status` | Officer/admin status transition |
| POST | `/api/complaints/:id/assign` | Administrator assignment override |
| POST | `/api/complaints/:id/verify` | Verify, request reopening, approve/decline reopening |
| POST | `/api/complaints/:id/evidence` | Upload resolution evidence |
| GET | `/api/public/complaints` | Privacy-filtered public map data and filters |
| GET | `/api/public/summary` | Public aggregate statistics |
| GET | `/api/authority/summary` | Role-scoped authority analytics |
| GET | `/api/notifications` | Current user notifications |
| PATCH | `/api/notifications/:id` | Mark a notification read |
| GET | `/api/files/:filename` | Authorization-checked private evidence delivery |

Successful and error responses use a consistent `{ success, data, message }` / `{ success, error }` envelope.

## Main workflow to demonstrate

1. Sign in as `citizen@janwatch.demo`.
2. Submit a pothole or garbage complaint with coordinates. Keep it private or explicitly mark it public.
3. Observe the ticket code and AI/fallback analysis. When Gemini is configured, the image is sent server-side along with the text.
4. Sign out and sign in as the matching officer, or as the administrator.
5. Review the complaint, update status, and upload resolution evidence. Admin can change the department/officer assignment.
6. Sign back in as the reporting citizen to verify resolution or request reopening.
7. Open the public dashboard to review only explicitly public reports and aggregate analytics.

## Build and checks

```bash
npm run typecheck
npm run build
```

The browser map uses the OpenStreetMap standard tile service. Respect its tile usage policy; production deployments with significant traffic should use an appropriate tile provider.

## Known limitations / next engineering steps

1. Replace local JSON storage with Supabase repository calls and Supabase Auth; apply the SQL migration and RLS policies, and move uploads to private Supabase Storage with signed URLs.
2. Move Gemini analysis into a durable background job/queue. In this single-process demo the complaint is persisted first, but the request waits for analysis to finish.
3. Add automated unit/integration tests, rate limiting, MIME content-signature validation and audit log retention.
4. Add city-specific ward boundaries and geocoding. Demo City coordinates are synthetic and are not municipal coordinates.
5. Expand officer membership management and seed additional officer accounts for every department/ward combination.
6. Add explicit duplicate relation approval/management; the current prototype shows potential candidates but does not merge or link them.
7. Add a production-tested status transition transaction. The local JSON store is single-process demo storage and is not concurrency safe for multi-instance deployments.

AI output is advisory only. Critical reports require human review and this prototype does not independently declare emergencies or verify reported incidents.
