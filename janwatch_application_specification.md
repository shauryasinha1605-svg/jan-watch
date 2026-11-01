# JanWatch – AI-Powered Civic Grievance & Infrastructure Monitoring Platform

> Application specification generated for JanWatch. Treat this document as the source of truth for planning and implementation.

## Instructions for the implementation team or AI coding assistant

Build a working, end-to-end civic grievance management application. Implement a functional frontend, backend, database, AI integration, maps, authority dashboard, and public accountability dashboard.

Do not stop at static mockups or simulated interactions. All major user workflows must be connected to real application logic and persistent data.

Use Next.js, TypeScript, Supabase, PostgreSQL, and Google's Gemini API. Keep the application modular, maintainable, responsive, and suitable for demonstration within a 12-hour hackathon.

Use the assumptions and constraints documented below whenever requirements are not specified. Never hardcode credentials or expose API keys in frontend code.

If external services are unavailable, provide a graceful fallback mode where feasible. AI analysis must never prevent a citizen's complaint from being saved.

---

## 1. Project name and overview

### Project name

**JanWatch**

### Tagline

Making Every Civic Issue Visible, Actionable and Accountable.

### Overview

JanWatch is an AI-powered civic grievance and infrastructure monitoring platform that connects citizens, municipal authorities, and public administrators through intelligent complaint processing and transparent resolution tracking.

The platform enables citizens to report infrastructure problems such as potholes, damaged roads, garbage accumulation, water leakage, blocked drainage systems, damaged streetlights, pollution, and other civic issues.

Citizens can submit complaints using photographs, descriptions, and geographical locations.

The application uses Google's Gemini multimodal AI to analyze submitted evidence and generate structured recommendations, including:

- Issue classification.
- Issue type identification.
- Complaint summarization.
- Severity recommendation.
- Recommended municipal department.
- Suggested corrective action.
- Human-review requirements.

The backend validates AI-generated information, identifies potentially related complaints, and associates reports with appropriate municipal departments.

Municipal officers receive a dashboard where they can review, prioritize, assign, update, and resolve complaints.

Citizens can track their individual complaints, while public visitors can access an accountability dashboard showing public complaints, infrastructure hotspots, and resolution statistics.

The initial demonstration will use a fictional city named **Demo City**, containing five wards and seven municipal departments, plus a control-room fallback department.

### Primary objective

Transform unstructured citizen reports into structured, actionable, trackable civic complaints.

### Core value proposition

JanWatch goes beyond traditional complaint registration systems by combining:

1. Multimodal AI-based complaint analysis.
2. Location-aware complaint management.
3. Intelligent department recommendations.
4. Potential duplicate complaint detection.
5. Transparent authority workflows.
6. Public infrastructure accountability analytics.

---

## 2. Problem statement

### Problem

Citizens frequently encounter civic infrastructure problems but face difficulties reporting them, identifying the appropriate authorities, and tracking whether corrective action has been taken.

Traditional grievance systems often have the following limitations:

### 2.1 Fragmented reporting channels

Citizens may need to use separate websites, phone numbers, municipal offices, or other communication channels to report different types of problems.

### 2.2 Incorrect complaint classification

Complaints may be submitted without sufficient information about the issue type or the department responsible for resolving it.

### 2.3 Lack of intelligent prioritization

Serious infrastructure problems may be mixed with minor maintenance complaints without systematic prioritization.

### 2.4 Duplicate complaints

Multiple citizens may independently report the same infrastructure problem, resulting in redundant records and unnecessary administrative work.

### 2.5 Limited transparency

Citizens frequently lack clear information about complaint status, assigned departments, actions taken, and expected next steps.

### 2.6 Lack of public accountability

There is limited consolidated visibility into complaint distribution, unresolved issues, ward-wise infrastructure problems, and department performance.

### JanWatch solution

JanWatch provides a centralized reporting and monitoring platform that automatically organizes incoming complaints, recommends their priority and responsible departments, and provides transparent status tracking.

The platform aims to make civic problem reporting easier for citizens and grievance management more organized for municipal authorities.

---

## 3. Target users and user tasks

The application must support four user types.

### 3.1 Citizen

Citizens are the primary users of the reporting system.

Their tasks include:

- Registering and logging into the application.
- Submitting civic complaints.
- Uploading photographs of infrastructure problems.
- Providing issue descriptions.
- Selecting or detecting geographical locations.
- Viewing AI-generated complaint analysis.
- Tracking complaint status.
- Viewing activity timelines.
- Receiving resolution updates.
- Requesting complaint reopening when an issue has not been adequately resolved.

### 3.2 Municipal officer

Municipal officers are responsible for reviewing and resolving assigned complaints.

Their tasks include:

- Logging into the authority dashboard.
- Viewing complaints assigned to their department and authorized wards.
- Filtering complaints by category, severity, date, and status.
- Reviewing submitted photographs and descriptions.
- Reviewing AI-generated recommendations.
- Accepting or overriding AI recommendations.
- Updating complaint status.
- Recording actions taken.
- Uploading resolution evidence.
- Reviewing potentially duplicate complaints.

Officers must not access complaints outside their assigned permissions.

### 3.3 City administrator

Administrators oversee the complete city-wide grievance management system.

Their tasks include:

- Viewing all city complaints.
- Assigning officers and departments.
- Managing complaint routing.
- Reviewing unresolved and escalated issues.
- Monitoring ward-wise and department-wise statistics.
- Managing demonstration data.
- Reviewing complaint history.
- Overriding assignments when necessary.

### 3.4 Public visitor

Public visitors may access public information without registering.

Their tasks include:

- Viewing publicly shared complaints.
- Exploring the city complaint map.
- Filtering complaints by category and status.
- Viewing aggregate city statistics.
- Viewing ward-wise complaint distribution.
- Monitoring aggregate resolution performance.

Public visitors must not access private citizen details, internal authority records, or private complaint attachments.

---

## 4. Core features

### 4.1 Citizen authentication and profile management

Implement authentication using Supabase Auth.

Features:

- Citizen registration.
- Login and logout.
- Session management.
- Role-based access.
- Profile management.
- Protected routes.

Supported user roles:

- `citizen`
- `officer`
- `admin`

Public visitors do not need accounts.

User profiles must be stored in the PostgreSQL database and linked to Supabase authentication identities.

### 4.2 Citizen complaint submission

Provide a user-friendly reporting form.

The form must support:

- Complaint description.
- Image upload.
- Geographical coordinates.
- Location description.
- Ward selection or identification.
- Public visibility preference.

Supported image formats:

- JPEG
- PNG
- WebP

Maximum image size: 5 MB.

Image submission is optional. Text-only complaints must also be supported.

A citizen must be able to submit a complaint even when AI analysis is unavailable.

Each complaint must receive a unique ticket code, such as:

`JW-A83F19B2`

### 4.3 AI-powered complaint analysis

Integrate Google's Gemini multimodal API using the official `@google/genai` JavaScript SDK.

The AI service must analyze both the citizen's description and uploaded photograph when available.

#### Supported complaint categories

| Category | Supported issues |
|---|---|
| Roads | Potholes, damaged roads, broken bridges |
| Sanitation | Garbage accumulation, overflowing bins |
| Water | Pipeline leakage, water wastage |
| Drainage | Blocked drains, flooding |
| Electricity | Damaged streetlights, exposed wiring |
| Pollution | Smoke, noise, waste dumping |
| Public infrastructure | Damaged parks, public buildings and facilities |
| Other | Unclassified or unsupported civic issues |

#### Expected AI output

The AI service must return structured JSON.

Example:

```json
{
  "title": "Large pothole near main junction",
  "summary": "A damaged road section with a large pothole.",
  "category": "roads",
  "issue_type": "pothole",
  "severity": "high",
  "recommended_action": "Inspect and arrange road repairs.",
  "confidence": 0.90,
  "needs_human_review": false,
  "uncertainty_reason": ""
}
```

The confidence value is an uncalibrated model estimate and must not be presented as verified accuracy.

#### AI responsibilities

- Identify the civic issue category.
- Determine the likely issue type.
- Generate a concise complaint summary.
- Recommend an urgency level.
- Suggest a corrective action.
- Indicate whether human review is necessary.

The AI must use only the supplied evidence. It must not invent incident details, geographical information, or claims of independent verification.

AI output is advisory and must never automatically constitute an official finding.

### 4.4 Severity assessment

The system must support four severity levels.

| Severity | Meaning |
|---|---|
| Critical | Potentially immediate public safety concern requiring urgent human attention |
| High | Serious infrastructure problem |
| Medium | Significant inconvenience or service disruption |
| Low | Minor maintenance issue |

Severity recommendations may consider:

- AI analysis.
- Citizen-provided description.
- Visual evidence.
- Number of potentially related reports.
- Proximity to sensitive public locations where verified location information is available.

Critical reports must be flagged for immediate human review.

The system must not independently declare a medical, public safety, or other emergency based solely on an AI recommendation.

### 4.5 Department recommendation and routing

Use deterministic backend mappings rather than allowing Gemini to invent department names.

Initial department mapping:

| Category | Department |
|---|---|
| Roads | Public Works Department |
| Sanitation | Waste Management Department |
| Water | Water Supply Department |
| Drainage | Drainage Department |
| Electricity | Electrical Department |
| Pollution | Environmental Department |
| Public infrastructure | Municipal Engineering Department |
| Other | Municipal Control Room |

Officers and administrators must be able to override the recommended assignment.

### 4.6 Duplicate complaint detection

Implement an initial location-based and category-based duplicate detection system.

For each new complaint:

1. Retrieve recent complaints from the previous 30 days.
2. Filter complaints belonging to the same category.
3. Calculate geographic distance.
4. Identify potential matches within approximately 100 metres.
5. Display matching complaints to authorized officers.
6. Allow authorized officers to mark reports as related.

Description similarity may be used as an additional matching factor.

Image embeddings are an optional enhancement.

Duplicate detection must only identify potential relationships. It must not automatically delete, merge, or suppress independent citizen reports.

Every submitted complaint must retain its original ticket code and history.

### 4.7 Citizen complaint dashboard

Citizens must be able to:

- View all their complaints.
- Search by ticket code.
- Filter by complaint status.
- Open complaint details.
- View AI analysis.
- View current assignment information where appropriate.
- Track status changes.
- View officer remarks that are safe to share.
- View resolution evidence when published.
- Request complaint reopening.

### 4.8 Municipal authority dashboard

Provide a dashboard containing:

- Total complaints.
- Pending complaints.
- Complaints under review.
- Complaints in progress.
- Resolved complaints.
- Critical and high-priority complaints.
- Category distribution.
- Ward-wise distribution.

The complaint management section must support:

- Search.
- Filtering.
- Sorting.
- Pagination.
- Department assignment.
- Officer assignment.
- Status updates.
- Activity history.
- Resolution evidence upload.

### 4.9 Complaint status tracking

Supported statuses:

| Status | Description |
|---|---|
| `submitted` | Complaint has been registered |
| `under_review` | Authority is reviewing the complaint |
| `assigned` | Complaint has been assigned |
| `in_progress` | Corrective action has started |
| `resolved` | Authority has reported completion |
| `verified` | Resolution has been confirmed |
| `reopened` | Complaint has been reopened for further action |
| `rejected` | Complaint has been rejected with a recorded reason |

Status changes must follow valid transitions.

Every change must create a new entry in the complaint activity history.

A suggested workflow:

`submitted → under_review → assigned → in_progress → resolved → verified`

A citizen may request reopening after resolution. The application must record the request and reason and allow an authorized administrator to review it.

### 4.10 Resolution verification

When an officer marks a complaint as resolved, the officer should provide:

- Resolution remarks.
- Optional resolution photograph.
- Resolution timestamp.

Citizens must have the ability to confirm resolution or request reopening.

Resolution evidence must be stored separately from the original complaint image.

### 4.11 Public accountability dashboard

Create a publicly accessible dashboard containing:

- Total public complaints.
- Pending public complaints.
- Resolved public complaints.
- Ward-wise complaint statistics.
- Category-wise complaint statistics.
- Department-wise aggregate performance.
- An interactive city complaint map.

Only complaints explicitly marked public may be displayed.

Public statistics must use the actual database state, not hardcoded demonstration numbers.

### 4.12 Interactive city map

Use Leaflet with OpenStreetMap.

The map must display:

- Public complaint markers.
- Complaint category.
- Complaint severity.
- Current status.
- Ward information.

Provide filters for:

- Category.
- Severity.
- Status.
- Ward.

Public complaint locations should use appropriately generalized coordinates where needed to protect privacy.

### 4.13 Demo City support

The initial application must use a fictional city called Demo City.

Create five sample wards:

1. Ward 1 – North Zone
2. Ward 2 – South Zone
3. Ward 3 – Central Zone
4. Ward 4 – East Zone
5. Ward 5 – West Zone

Create seven municipal departments corresponding to the main civic categories, plus a control-room fallback.

Seed realistic demonstration records covering all major complaint categories.

Clearly identify fictional records as demo data.

---

## 5. Inputs and data sources

### 5.1 Citizen inputs

| Input | Data type | Required |
|---|---|---|
| Description | Text | Yes |
| Image | Image file | No |
| Latitude | Number | Yes |
| Longitude | Number | Yes |
| Location description | Text | No |
| Ward | UUID | No |
| Public visibility | Boolean | No |

Coordinates must be valid geographical values:

- Latitude between -90 and 90.
- Longitude between -180 and 180.

### 5.2 Officer inputs

- Complaint status.
- Assignment information.
- Officer remarks.
- Resolution description.
- Resolution photograph.
- Verification information.

### 5.3 Administrator inputs

- Officer assignment.
- Department assignment.
- Ward mapping.
- Complaint review decisions.
- Demonstration data configuration.

### 5.4 External data sources

#### Google Gemini API

Used for multimodal complaint classification and structured analysis.

#### Supabase

Used for:

- PostgreSQL database.
- User authentication.
- File storage.
- Persistent complaint records.

#### OpenStreetMap

Used as the geographical map data source through Leaflet.

#### System-generated information

The application must additionally generate:

- Unique complaint ticket IDs.
- Submission timestamps.
- Activity history entries.
- Department recommendations.
- Duplicate candidate records.
- Dashboard aggregates.

---

## 6. Processing rules and business logic

### 6.1 Complaint submission workflow

When a citizen submits a complaint:

1. Validate the user's authentication.
2. Validate all submitted fields.
3. Validate image type and size.
4. Upload the image to private Supabase Storage if present.
5. Create a complaint record with status `submitted`.
6. Set AI analysis state to `processing`.
7. Send the description and uploaded image to Gemini.
8. Validate the AI response against the required schema.
9. Map the category to a valid database department.
10. Search for potentially related recent complaints.
11. Save AI results and department recommendations.
12. Mark analysis as `completed`, `needs_review`, or `failed`.
13. Return the complaint ID and ticket code.

Crucially, the complaint must be persisted before calling Gemini.

If Gemini times out, fails, or produces invalid output, preserve the complaint and flag it for manual review.

### 6.2 AI processing rules

The application must validate every AI response on the backend using Zod or an equivalent validation library.

Allowed categories:

- roads
- sanitation
- water
- drainage
- electricity
- pollution
- public_infrastructure
- other

Allowed severity values:

- low
- medium
- high
- critical

Invalid AI output must never be stored as authoritative classification data.

When AI analysis is unavailable, use a deterministic fallback classifier where feasible. Fallback results must be explicitly identified as rule-based recommendations and must require human review.

The Gemini API key must remain server-side.

### 6.3 Department routing rules

Use the category-to-department mapping in Section 4.5.

Department routing must occur on the backend.

An AI-provided department name must not directly determine the department database ID.

The selected department should be linked to the complaint through a foreign key.

### 6.4 Duplicate detection rules

Potential duplicate detection should initially use:

- Same complaint category.
- Geographic distance of approximately 100 metres or less.
- Complaints created during the previous 30 days.
- Optional description similarity.

Display candidates to officers as possible related reports.

Do not automatically merge duplicate records.

### 6.5 Authorization rules

#### Citizens

- Can submit complaints.
- Can view their own private complaints.
- Can view public complaints.
- Can request reopening of eligible resolved complaints.
- Cannot change official complaint statuses directly.
- Cannot assign departments or officers.

#### Officers

- Can view complaints within their authorized department and ward assignments.
- Can update authorized complaint statuses.
- Can upload resolution evidence.
- Can add activity remarks.
- Can review potential duplicates.
- Cannot change administrator roles.

#### Administrators

- Can access city-wide complaint management.
- Can assign officers.
- Can change department assignments.
- Can review complaints.
- Can manage demonstration data.
- Can view city-wide analytics.

### 6.6 Activity history rules

Every important complaint action must generate a history record.

Examples:

- Complaint created.
- AI analysis completed.
- Complaint reviewed.
- Department assigned.
- Officer assigned.
- Status changed.
- Resolution evidence uploaded.
- Complaint verified.
- Complaint reopened.

History records should include:

- Complaint ID.
- Acting user ID.
- Previous status.
- New status.
- Remarks.
- Timestamp.

Activity history must not be editable by ordinary citizens.

### 6.7 Public visibility rules

Set complaint visibility to private by default.

Only explicitly public complaints may appear on the public map.

Public APIs must return a restricted set of fields and must never expose private user details, email addresses, internal identifiers, or unapproved images.

---

## 7. Expected outputs and user experience

### 7.1 Application pages

#### Page 1 – Landing page

Display:

- JanWatch branding.
- Project introduction.
- Report an issue call-to-action.
- City statistics.
- Public complaint map preview.
- How the platform works.
- Login and registration links.

#### Page 2 – Citizen reporting page

Display:

- Issue description field.
- Image upload component.
- Location selector.
- Map location picker.
- Ward selector.
- Public visibility checkbox.
- Complaint submission button.

After submission, show the AI analysis result when available.

#### Page 3 – Citizen dashboard

Display:

- Total personal complaints.
- Pending complaints.
- Resolved complaints.
- Complaint cards.
- Status badges.
- Ticket codes.
- Filters and search.

#### Page 4 – Complaint details

Display:

- Ticket ID.
- Complaint description.
- Original photograph.
- Location.
- AI analysis.
- Severity recommendation.
- Department information.
- Status.
- Activity timeline.
- Officer remarks.
- Resolution evidence.
- Reopening or verification controls where appropriate.

#### Page 5 – Authority dashboard

Display:

- City or department statistics according to permissions.
- New complaints.
- Critical and high-priority reports.
- Complaint table.
- Filters.
- Department assignment.
- Officer assignment.
- Status management.

#### Page 6 – Authority complaint details

Display:

- Complaint details.
- Submitted image.
- AI analysis.
- Potential duplicates.
- Department information.
- Review controls.
- Status update form.
- Resolution evidence upload.
- Activity history.

#### Page 7 – Public accountability dashboard

Display:

- City-wide public complaint statistics.
- Ward-wise statistics.
- Category distribution.
- Resolution rate.
- Interactive complaint map.
- Filters for category, status, severity and ward.

### 7.2 Design requirements

Use a modern, professional civic-technology design.

Suggested design direction:

- Primary colour: Deep blue.
- Secondary colour: Teal.
- Background: Light neutral.
- Typography: Clean and readable.
- Buttons: Clear and accessible.
- Cards: Simple and consistent.
- Status badges: Colour-coded.
- Charts: Clear labels and legends.

The application must be responsive across desktop, tablet and mobile devices.

Use a consistent navigation system for each role.

### 7.3 User feedback

Provide:

- Loading indicators during AI analysis.
- Submission success messages.
- Clear validation messages.
- Error notifications.
- Empty states.
- Image previews.
- Complaint timeline.
- Processing status indicators.

A citizen must be informed when AI analysis is unavailable rather than being shown invented results.

---

## 8. Error handling and edge cases

The application must handle the following conditions.

### 8.1 Image errors

- Unsupported file type.
- File exceeding the 5 MB limit.
- Corrupt image.
- Storage upload failure.
- Missing image.

Text-only complaint submission must remain available.

### 8.2 AI errors

- Gemini API unavailable.
- Invalid API key.
- API rate limit exceeded.
- Request timeout.
- Malformed JSON.
- Invalid classification.
- Uncertain visual evidence.
- Text and image describing different issues.

In these cases, preserve the complaint and set its AI analysis state appropriately.

Uncertain classifications must be marked for human review.

### 8.3 Authentication errors

- Invalid credentials.
- Expired session.
- Missing authentication.
- Unauthorized role.
- Access to another citizen's private complaint.

Return appropriate HTTP status codes.

### 8.4 Database errors

- Connection failure.
- Invalid foreign key.
- Duplicate ticket ID.
- Invalid status transition.
- Missing ward or department.
- Failed status history insertion.

Status changes and their activity history entries should be performed transactionally.

### 8.5 Location errors

- Invalid latitude.
- Invalid longitude.
- Missing location.
- Unsupported ward.
- No nearby duplicate candidates.

If automatic location access is denied, permit manual map selection.

### 8.6 Complaint workflow errors

- Unauthorized status change.
- Reopening an ineligible complaint.
- Assigning an officer to the wrong department.
- Attempting to resolve a complaint without the required remarks.
- Missing resolution evidence where the workflow requires it.

Provide useful error messages without exposing database internals.

### 8.7 Network and deployment errors

Display a clear retry option for recoverable network failures.

Never display raw API keys, internal stack traces, or database credentials.

---

## 9. Safety, privacy, constraints, and integrations

### 9.1 Technology stack

| Layer | Technology |
|---|---|
| Frontend | Next.js with React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI components | shadcn/ui |
| Backend | Next.js Route Handlers |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| File storage | Supabase Storage |
| AI | Google Gemini API |
| AI SDK | `@google/genai` |
| Validation | Zod |
| Mapping | Leaflet |
| Map data | OpenStreetMap |
| Charts | Recharts |
| Deployment | Vercel |

### 9.2 Database schema

Use the following primary tables.

#### profiles

Stores user information and roles.

Columns:

- id
- name
- email
- role
- ward_id
- created_at
- updated_at

#### wards

Stores city wards.

Columns:

- id
- name
- city
- created_at

#### departments

Stores municipal departments.

Columns:

- id
- name
- category
- created_at

#### department_members

Maps officers to authorized departments and wards.

Columns:

- id
- user_id
- department_id
- ward_id
- created_at

#### complaints

Stores primary complaint records.

Columns:

- id
- ticket_code
- user_id
- title
- description
- category
- issue_type
- severity
- status
- latitude
- longitude
- location_text
- ward_id
- department_id
- assigned_officer_id
- image_path
- resolution_image_path
- is_public
- ai_analysis
- analysis_state
- created_at
- updated_at

#### complaint_updates

Stores complaint activity history.

Columns:

- id
- complaint_id
- updated_by
- old_status
- new_status
- remarks
- evidence_path
- created_at

Use UUID primary keys, appropriate foreign keys, indexes, database constraints and timestamps.

Store AI responses as PostgreSQL JSONB.

### 9.3 API endpoint specifications

All routes must be implemented using Next.js App Router Route Handlers.

Use consistent JSON response formats.

Successful response:

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid complaint data"
  }
}
```

#### Endpoint 1 – Submit complaint

`POST /api/complaints`

Content type: `multipart/form-data`

Inputs:

- description
- image (optional)
- latitude
- longitude
- locationText (optional)
- wardId (optional)
- isPublic (optional)

Requires citizen authentication.

Returns:

- Complaint ID.
- Ticket code.
- Complaint status.
- AI category and severity recommendation, when available.
- Department recommendation.
- Analysis state.
- Potential duplicate information.

Use HTTP 201 for successful creation.

#### Endpoint 2 – Fetch complaints

`GET /api/complaints`

Optional query parameters:

- status
- category
- severity
- page
- limit

Citizens receive only their own complaints.

Officers receive only authorized department and ward complaints.

Administrators receive city-wide records.

#### Endpoint 3 – Complaint details

`GET /api/complaints/:id`

Returns:

- Complaint information.
- AI analysis.
- Department assignment.
- Status.
- Activity timeline.
- Authorized evidence URLs.

#### Endpoint 4 – Update complaint status

`PATCH /api/complaints/:id/status`

Example request:

```json
{
  "status": "in_progress",
  "note": "Repair work has started."
}
```

Requires officer or administrator authorization.

The request must validate the status transition and create an activity record.

#### Endpoint 5 – Assign complaint

`POST /api/complaints/:id/assign`

Example request:

```json
{
  "departmentId": "department-uuid",
  "officerId": "officer-uuid",
  "note": "Assigned for inspection."
}
```

Requires administrator authorization.

Validate department and officer membership.

#### Endpoint 6 – Verify or reopen complaint

`POST /api/complaints/:id/verify`

Example request:

```json
{
  "decision": "reopen",
  "note": "The issue has not been fully resolved."
}
```

Allowed decisions:

- verify
- reopen

The original reporter or an authorized administrator may initiate the applicable action.

#### Endpoint 7 – Public complaints

`GET /api/public/complaints`

Optional filters:

- category
- severity
- status
- ward
- geographic bounding box

Returns only publicly visible and privacy-filtered complaints.

#### Endpoint 8 – Authority analytics

`GET /api/authority/summary`

Returns:

- Total complaints.
- Pending complaints.
- In-progress complaints.
- Resolved complaints.
- Category distribution.
- Ward distribution.
- Department statistics.

Access must be restricted to authorized officers and administrators.

### 9.4 Authentication and security

Use Supabase Auth and Row Level Security.

Security requirements:

- Validate authenticated users on server-side routes.
- Verify permissions before sensitive operations.
- Never trust client-submitted roles.
- Protect all private complaint records.
- Restrict officer access according to department and ward.
- Use private storage buckets for original and resolution images.
- Use short-lived signed URLs for authorized image access.
- Never expose Supabase secret keys or Gemini API keys to the frontend.
- Validate uploads on the server.
- Apply rate limiting to complaint creation and AI analysis.
- Sanitize text and validate all request bodies.
- Log important administrative actions.

Supabase service-role or secret credentials must only be used server-side with explicit authorization checks.

### 9.5 Privacy requirements

Protect the identity of citizens.

The public interface must not expose:

- Email addresses.
- Phone numbers.
- Internal user IDs.
- Private attachments.
- Confidential remarks.
- Authentication information.

Set public visibility to false by default.

Use appropriately generalized public map coordinates when exact locations could expose private residences or sensitive information.

### 9.6 AI limitations

AI must act as an assistant rather than an autonomous authority.

It must not:

- Claim an issue has been independently verified.
- Invent location information.
- Make legally binding decisions.
- Automatically reject complaints.
- Automatically declare emergencies.
- Automatically merge or delete complaints.

Human officers remain responsible for official decisions.

### 9.7 External service requirements

#### Supabase

Required for persistent database, authentication and storage.

Provide:

- Project creation instructions.
- SQL migration.
- Storage configuration.
- Environment variable setup.

#### Google Gemini

Required for multimodal AI analysis.

Provide:

- API key setup instructions.
- Model configuration through environment variables.
- Error handling.
- Structured response validation.
- Fallback analysis behaviour.

If Gemini is unavailable, preserve submitted complaints and use a clearly labelled rule-based fallback or manual-review state.

#### OpenStreetMap

Used for map visualization.

The implementation must respect the applicable tile usage policy.

### 9.8 Hackathon constraints

The development period is 12 hours.

The initial application must prioritize:

1. Authentication.
2. Complaint creation.
3. Image upload.
4. Gemini classification.
5. Department recommendation.
6. Citizen complaint tracking.
7. Authority complaint management.
8. Public map.
9. Basic analytics.
10. Deployment.

Advanced predictive analytics, voice reporting, complex embeddings, external municipal integrations, and automated escalation systems should be treated as future enhancements.

---

## 10. Acceptance criteria and test examples

The application must satisfy the following acceptance criteria.

### AC01 – Citizen authentication

A citizen must be able to register and log in.

Unauthorized users must not access protected citizen or authority pages.

### AC02 – Complaint submission

A citizen must be able to submit a valid complaint with a description and location.

The application must generate a unique ticket code.

### AC03 – Image upload

A valid photograph must be uploaded to storage and associated with the complaint.

Invalid or oversized files must be rejected with a useful error message.

### AC04 – AI classification

Gemini must analyze the available evidence and return a valid structured result.

The result must be validated before storage.

### AC05 – AI failure recovery

When Gemini is unavailable, the complaint must still be stored.

The application must indicate that AI processing failed or requires manual review.

### AC06 – Severity recommendation

The system must support low, medium, high and critical severity recommendations.

Uncertain reports must be flagged for human review.

### AC07 – Department routing

The system must map each supported category to a valid municipal department.

### AC08 – Citizen dashboard

Citizens must only see their own private complaint records.

### AC09 – Authority dashboard

Authorized officers must be able to view and manage complaints within their permitted department and ward.

### AC10 – Status history

Every status update must create a corresponding activity history entry.

### AC11 – Resolution workflow

Officers must be able to mark complaints resolved and provide resolution remarks and evidence.

### AC12 – Complaint reopening

Citizens must be able to request reopening of eligible resolved complaints.

The application must retain the original complaint history.

### AC13 – Duplicate detection

Similar nearby complaints must be identified as potential duplicates.

The system must preserve all independent complaint records.

### AC14 – Public map

Only explicitly public complaints may appear on the public map.

Private citizen information must never be exposed.

### AC15 – Analytics

Dashboard figures must be calculated from the actual complaint records.

The dashboard must not rely on hardcoded statistics.

### AC16 – Responsive experience

All essential application workflows must work on desktop and mobile screens.

### AC17 – Local installation

The application must start by following the README instructions.

All required environment variables must be documented.

### Test scenarios

| Test input or situation | Expected result |
|---|---|
| Upload pothole photograph and description | Category recommended as roads |
| Submit garbage accumulation report | Category recommended as sanitation |
| Submit water leakage report | Category recommended as water |
| Submit blocked drain report | Category recommended as drainage |
| Submit damaged streetlight report | Category recommended as electricity |
| Submit pollution complaint | Category recommended as pollution |
| Submit unclear photograph | Human review recommended |
| Submit complaint without image | Text-based analysis attempted |
| Submit image larger than 5 MB | Validation error |
| Gemini API unavailable | Complaint saved with analysis failure state |
| Two similar reports within 100 metres | Potential duplicate candidates displayed |
| Citizen accesses another citizen's private complaint | Access denied |
| Citizen attempts to update official status | Access denied |
| Unauthorized officer accesses unrelated complaint | Access denied |
| Officer updates complaint status | New activity record created |
| Officer submits resolution evidence | Evidence stored and linked |
| Citizen requests reopening | Reopening request recorded |
| Private complaint is queried through public API | Complaint excluded |
| Dashboard statistics are requested | Values derived from database |

---

## Implementation deliverables

The completed project must include:

### 1. Functional frontend

A responsive Next.js application containing:

- Landing page.
- Authentication screens.
- Citizen reporting portal.
- Citizen dashboard.
- Complaint details page.
- Authority dashboard.
- Authority complaint management.
- Public accountability dashboard.
- Interactive complaint map.

Every primary button and form must perform a real action.

Provide loading, empty, error and success states.

### 2. Functional backend

Implement:

- Authentication validation.
- Role-based authorization.
- Complaint management APIs.
- File upload handling.
- Gemini integration.
- Department mapping.
- Duplicate candidate detection.
- Status management.
- Activity history.
- Analytics endpoints.

### 3. Database

Provide:

- SQL migrations.
- Tables and relationships.
- Indexes and constraints.
- Row Level Security policies.
- Demo City seed data.
- Storage bucket configuration.

### 4. AI integration

Provide:

- Gemini client configuration.
- Multimodal image and text analysis.
- Structured JSON schema.
- Output validation.
- Department recommendation logic.
- Fallback analysis behaviour.

### 5. Demo data

Include a realistic fictional Demo City dataset with:

- Five wards.
- Seven civic departments and an additional control-room fallback.
- Several citizens.
- Multiple officer accounts.
- Complaints from all major categories.
- Different severity levels.
- Different workflow statuses.

Clearly distinguish fictional data from real civic reports.

### 6. Documentation

Provide a README covering:

- Project overview.
- Technology stack.
- Prerequisites.
- Repository installation.
- Environment configuration.
- Supabase configuration.
- Gemini API setup.
- Database migration instructions.
- Demo data setup.
- Development commands.
- Build commands.
- Test commands.
- Deployment instructions.
- Known limitations.
- Troubleshooting.

Include `.env.example` with variable names only and no real credentials.

Suggested environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

GEMINI_API_KEY=
GEMINI_MODEL=

NEXT_PUBLIC_APP_URL=
```

### 7. Testing

Include tests for:

- Request validation.
- Category mapping.
- Severity validation.
- AI failure recovery.
- Duplicate detection.
- Authentication.
- Role permissions.
- Complaint status transitions.
- Public API privacy filtering.

Provide reproducible test commands.

---

## Development team and schedule

### Team size

3–4 developers.

### Member 1 – Frontend

Owns the citizen-facing UI, reporting form, authentication screens and complaint tracking.

### Member 2 – Backend and database

Owns Supabase, PostgreSQL, APIs, authentication, authorization and file storage.

### Member 3 – AI integration

Owns Gemini integration, image classification, structured outputs, severity recommendations and duplicate detection.

### Member 4 – Dashboard and integration

Owns authority dashboard, maps, analytics, deployment and end-to-end integration.

For a three-member team, combine the fourth member's responsibilities with the frontend and AI work.

### 12-hour schedule

| Time | Priority |
|---|---|
| Hour 0–1 | Repository and project setup |
| Hour 1–3 | Database, authentication and frontend foundations |
| Hour 3–5 | Complaint submission, storage and APIs |
| Hour 5–7 | Gemini integration and duplicate detection |
| Hour 7–9 | Authority dashboard, maps and analytics |
| Hour 9–10 | End-to-end testing and deployment |
| Hour 10–11 | Bug fixes and security checks |
| Hour 11–12 | Demo preparation and presentation |

Build the core complaint lifecycle before implementing advanced features.

---

## Definition of done

JanWatch is considered complete when:

1. Citizens can register and log in.
2. Citizens can submit photographs, descriptions and locations.
3. Complaints are saved in persistent storage.
4. Gemini can analyze submitted evidence when configured.
5. AI outputs are validated and stored.
6. The system recommends appropriate departments.
7. Citizens can track their complaints.
8. Authorized officers can manage and resolve complaints.
9. Every important status change is recorded.
10. Publicly visible complaints appear on an interactive map.
11. Dashboard analytics use real database data.
12. Private citizen information is protected.
13. The application can be installed and started using README instructions.
14. Demo City sample data is available.
15. Critical workflows have reproducible tests.
16. Limitations and future enhancements are documented.

The final demonstration must show the complete journey:

**Citizen submits a civic issue → Gemini analyzes it → JanWatch recommends a department and priority → an authorized officer reviews and updates the complaint → resolution evidence is uploaded → citizens can track the outcome and view public accountability statistics.**

The application must be a functional end-to-end system, not merely a visual prototype.
