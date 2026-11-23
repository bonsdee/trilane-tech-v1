# Database design

PostgreSQL 16. The schema is created and versioned by Flyway; the SQL lives in `backend/src/main/resources/db/migration/`.

| Migration | Contents |
| --- | --- |
| `V1__create_schema.sql` | All 13 tables, constraints and indexes |
| `V2__seed_content.sql` | 8 services with 43 inclusions/exclusions, the pilot offer settings, 3 team profiles (names only) and 12 FAQ entries |
| `V3__team_bios.sql` | Full names, roles and bios for the three team profiles (skipped for any profile already edited in the dashboard) |
| `V4__revisions_concepts_booking_location.sql` | Website revisions 1.0: `portfolio_projects.is_concept`, the `booking.url` setting, the pilot offer switched off with its FAQ hidden, and a FAQ on location and hours |
| `V5__timelines_exclusions_payment_faqs.sql` | Website revisions 1.1: Foundation Website timeline counted from when all content arrives (about 3–5 weeks from kickoff), "Not included" lists for the Landing Page and Website Optimization Sprint, FAQs on payment terms and cancelling retainers, and the Skyline GT-R project marked as a concept |

Flyway runs automatically when the backend starts. To change the schema later, add a new file such as `V5__add_testimonials.sql`; never edit a migration that has already run in production.

All primary keys are `BIGINT GENERATED ALWAYS AS IDENTITY`. Every table has `created_at` and `updated_at` (`TIMESTAMPTZ`, stored in UTC). Hibernate validates the schema on startup (`ddl-auto: validate`) and never changes it.

## Relationships

```
users ─┬─< password_tokens            (cascade delete)
       ├─< refresh_tokens             (cascade delete)
       ├─< leads.assigned_to          (set null)
       ├─< lead_notes.author_id       (set null)
       └─< stored_files.uploaded_by   (set null)

services ─┬─< service_items               (cascade delete)
          ├─< leads.service_id            (set null)
          └─< portfolio_projects.service_id (set null)

leads ──< lead_notes                     (cascade delete)

portfolio_projects ──< portfolio_images  (cascade delete)

stored_files ─┬─< portfolio_images.file_id          (cascade delete)
              ├─< portfolio_projects.cover_file_id  (set null)
              └─< team_members.photo_file_id        (set null)
```

Users are deactivated, never deleted, so leads keep their assignee and notes keep their author.

`team_members` and `users` are deliberately separate: a public bio is content, an account is a login.

## Tables

### users

| Column | Type | Notes |
| --- | --- | --- |
| full_name | varchar(120) | required |
| email | varchar(254) | required; unique index on `lower(email)`; stored lower-case |
| password_hash | varchar(100) | BCrypt (cost 12); null until an invite is accepted |
| role | varchar(20) | `ADMIN` (only role today; stored per user so others can be added) |
| active | boolean | default true |
| failed_login_attempts | integer | resets on success and when an account locks |
| locked_until | timestamptz | set for 15 minutes after 5 failures |
| last_login_at | timestamptz | |

### password_tokens

Invite and reset links. Only a SHA-256 hash of the token is stored.

| Column | Type | Notes |
| --- | --- | --- |
| user_id | bigint → users | cascade delete |
| token_hash | varchar(64) | unique |
| purpose | varchar(10) | `INVITE` (72 hours) or `RESET` (1 hour) |
| expires_at | timestamptz | |
| used_at | timestamptz | set when used, or when a newer link replaces it |

### refresh_tokens

Signed-in sessions (7 days). Only the hash is stored; rotated on every refresh.

| Column | Type | Notes |
| --- | --- | --- |
| user_id | bigint → users | cascade delete |
| token_hash | varchar(64) | unique |
| expires_at | timestamptz | rows expired for more than a day are purged nightly |
| revoked_at | timestamptz | set on rotation, logout, password change or deactivation |

### services

| Column | Type | Notes |
| --- | --- | --- |
| slug | varchar(80) | unique; stable identifier for links and future payments |
| name | varchar(120) | |
| category | varchar(20) | `ONE_TIME`, `RETAINER`, `BUNDLE` |
| price | numeric(10,2) | ≥ 0, US dollars |
| billing_period | varchar(10) | `ONCE`, `MONTHLY` |
| regular_price | numeric(10,2) | bundles: price of the parts bought separately |
| timeline | varchar(80) | e.g. "10–14 business days" |
| hours | integer | monthly hour cap for retainers |
| summary | text | |
| ideal_for | varchar(255) | |
| display_order | integer | lower first |
| published | boolean | hidden from the website when false |

### service_items

| Column | Type | Notes |
| --- | --- | --- |
| service_id | bigint → services | cascade delete |
| kind | varchar(15) | `INCLUDED`, `NOT_INCLUDED` |
| text | varchar(300) | |
| display_order | integer | |

### team_members

`full_name` (varchar 120), `position` (varchar 120, nullable), `bio` (text, nullable), `photo_file_id` (→ stored_files, set null), `display_order`, `published`.

### portfolio_projects

| Column | Type | Notes |
| --- | --- | --- |
| slug | varchar(80) | unique; page address `/portfolio/{slug}` |
| title | varchar(160) | |
| client_name | varchar(160) | |
| summary | varchar(500) | |
| description | text | |
| service_id | bigint → services | set null |
| project_url | varchar(500) | http(s) only |
| cover_file_id | bigint → stored_files | set null |
| completed_on | date | |
| display_order | integer | |
| published | boolean | default false; the public Portfolio page appears once any project is published |
| is_concept | boolean | default false; concept work (not for a client), labelled "Concept" on the site (V4) |

### portfolio_images

`project_id` (→ portfolio_projects, cascade), `file_id` (→ stored_files, cascade), `alt_text` (varchar 255), `display_order`.

### faqs

`question` (varchar 300), `answer` (text), `display_order`, `published`.

### stored_files

| Column | Type | Notes |
| --- | --- | --- |
| storage_key | varchar(100) | unique; generated name such as `3f2c…-….png`, the file name inside `UPLOAD_DIR` |
| original_name | varchar(255) | as uploaded, for reference |
| content_type | varchar(50) | `image/jpeg`, `image/png`, `image/webp` (detected from the bytes) |
| size_bytes | bigint | ≤ 5 MB |
| uploaded_by | bigint → users | set null |

### site_settings

Key/value switches. Seeded keys:

| key | Seed value | Meaning |
| --- | --- | --- |
| `pilot.enabled` | `true` | Pilot offer switched on |
| `pilot.price` | `2900.00` | Pilot price for the Launch Bundle |
| `pilot.spots_remaining` | `5` | Offer disappears at 0 |
| `booking.url` | empty | Shared booking page for the "Book a call" buttons; empty hides them (V4) |

V4 sets `pilot.enabled` to `false`: the pilot price is now offered only in outreach and proposals. Switch it back on in **Settings** if needed, and republish the "What is the pilot price?" FAQ.

### leads

| Column | Type | Notes |
| --- | --- | --- |
| full_name | varchar(120) | |
| email | varchar(254) | stored lower-case |
| phone | varchar(40) | |
| company | varchar(160) | |
| website_url | varchar(255) | |
| service_id | bigint → services | set null |
| message | text | |
| status | varchar(20) | `NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `WON`, `LOST` |
| source_page | varchar(255) | page the visitor came from |
| source_cta | varchar(120) | button that opened the form |
| referrer | varchar(500) | external site that sent the visitor |
| utm_source / utm_medium / utm_campaign | varchar(120) | campaign tags from the first page of the visit |
| assigned_to | bigint → users | set null |
| follow_up_on | date | overdue when in the past and status is not Won or Lost |

Indexes: `status`, `created_at`, `follow_up_on`, `assigned_to`.

"Source" in the dashboard is derived, not stored: the UTM source if present, otherwise the referrer's domain without `www.`, otherwise `direct`.

### lead_notes

`lead_id` (→ leads, cascade), `author_id` (→ users, set null), `body` (text).

## Backups

Use your database host's automatic backups. For a manual copy:

```bash
pg_dump --format=custom --no-owner "$DATABASE_URL" > trilane-$(date +%F).dump
pg_restore --clean --no-owner --dbname "$DATABASE_URL" trilane-2026-11-17.dump
```

Uploaded images live on disk in `UPLOAD_DIR`, not in the database, so back up that folder (or the persistent disk) as well.
