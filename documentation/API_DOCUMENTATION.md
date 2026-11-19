# Trilane Tech API

Base address: `http://localhost:8080/api/v1` in development, `https://api.trilanetech.com/api/v1` in production.

All request and response bodies are JSON unless noted. Dates are `YYYY-MM-DD`; timestamps are ISO 8601 in UTC (for example `2026-11-17T10:19:23.805Z`). Prices are US dollars as numbers with up to two decimals.

## Conventions

### Success

```json
{ "data": { ... } }
```

Lists that are paged also carry `meta`:

```json
{
  "data": [ ... ],
  "meta": { "page": 0, "size": 20, "totalElements": 57, "totalPages": 3 }
}
```

`page` starts at 0.

### Errors

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields need attention.",
    "fields": { "email": "Enter a valid email address." }
  }
}
```

`fields` appears only for validation errors, keyed by the request field name (nested items use `items[0].text`).

| Status | `code` | When |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | One or more fields are invalid |
| 400 | `BAD_REQUEST` | The body could not be read |
| 400 | `INVALID_TOKEN` | An invite or reset link is invalid, used or expired |
| 401 | `UNAUTHORIZED` | No valid access token |
| 401 | `INVALID_CREDENTIALS` | Sign-in failed (same answer for every reason) |
| 401 | `SESSION_EXPIRED` | The refresh cookie is missing, expired or revoked |
| 403 | `FORBIDDEN` | Signed in but not allowed |
| 404 | `NOT_FOUND` | No such record |
| 405 | `METHOD_NOT_ALLOWED` | Wrong HTTP method |
| 409 | `CONFLICT` | For example a duplicate email or a blocked deactivation |
| 413/400 | `VALIDATION_ERROR` on `file` | Upload over 5 MB |
| 429 | `RATE_LIMITED` | More than 5 contact form submissions from one address in an hour |
| 500 | `INTERNAL_ERROR` | Unexpected server error (details are only in the server log) |

### Authentication

1. `POST /auth/login` returns an **access token** (valid 15 minutes) in the body and sets an **HttpOnly refresh cookie** `trilane_refresh` (valid 7 days, path `/api/v1/auth`, `SameSite=Lax`, `Secure` in production).
2. Send the access token on admin requests: `Authorization: Bearer <token>`.
3. When it expires (401), call `POST /auth/refresh` with the cookie to get a new token. The cookie is replaced on every refresh. Reusing an old cookie ends every session for that user.
4. Browsers must send credentials (`withCredentials: true`) and may only call from the origins in `CORS_ALLOWED_ORIGINS`.

The user's role and active status are read from the database on every admin request.

---

## Public

### `GET /public/services`

Published services grouped by category, in display order. Every category is present, possibly with an empty list.

```json
{
  "data": [
    {
      "category": "ONE_TIME",
      "label": "One-time projects",
      "services": [
        {
          "id": 1,
          "slug": "foundation-website",
          "name": "Foundation Website",
          "category": "ONE_TIME",
          "price": 2800.00,
          "billingPeriod": "ONCE",
          "regularPrice": null,
          "timeline": "10–14 business days",
          "hours": null,
          "summary": "A custom 4–6 page website …",
          "idealFor": "Businesses with no website or a very basic one",
          "displayOrder": 1,
          "published": true,
          "items": [
            { "kind": "INCLUDED", "text": "Mobile-responsive design" },
            { "kind": "NOT_INCLUDED", "text": "E-commerce" }
          ]
        }
      ]
    },
    { "category": "RETAINER", "label": "Ongoing retainers", "services": [ … ] },
    { "category": "BUNDLE", "label": "Recommended bundles", "services": [ … ] }
  ]
}
```

`billingPeriod` is `ONCE` or `MONTHLY`. `regularPrice` is what a bundle's parts cost separately. `hours` is the monthly hour cap for retainers.

### `GET /public/team`

Published team profiles.

```json
{ "data": [ { "id": 1, "fullName": "Jivonz", "position": null, "bio": null, "photoFileId": null, "photoUrl": null, "displayOrder": 1, "published": true } ] }
```

`photoUrl` is a path on the API host, for example `/api/v1/files/4`.

### `GET /public/portfolio`

Published projects (summary form): `id, slug, title, clientName, summary, serviceId, serviceName, serviceSlug, coverFileId, coverUrl, completedOn, displayOrder, published, concept`. `concept` is true for work built to show skills rather than for a client; the site labels it "Concept".

### `GET /public/portfolio/{slug}`

One published project with `description`, `projectUrl` and `images: [{ fileId, url, altText }]`. Unpublished or unknown slugs return 404.

### `GET /public/faqs`

Published FAQ entries: `[{ id, question, answer, displayOrder, published }]`.

### `GET /public/site`

```json
{
  "data": {
    "pilot": {
      "active": true,
      "price": 2900.00,
      "regularPrice": 3600.00,
      "spotsRemaining": 5,
      "serviceSlug": "launch-bundle",
      "serviceName": "Launch Bundle"
    },
    "portfolioVisible": false,
    "bookingUrl": "https://calendar.app.google/…"
  }
}
```

`pilot.active` is true only when the offer is switched on, at least one spot remains and the Launch Bundle is published. When inactive, the other pilot fields are null. `portfolioVisible` is true once at least one project is published. `bookingUrl` is the shared booking page behind the "Book a call" buttons, or null when none is set.

### `POST /public/leads`

Submits the contact form. Rate limited to 5 accepted submissions per client address per hour.

Request:

```json
{
  "fullName": "Maria Santos",
  "email": "maria@example.com",
  "phone": "+63 917 123 4567",
  "company": "Santos Bakery",
  "websiteUrl": "santosbakery.ph",
  "serviceSlug": "launch-bundle",
  "message": "We need a website and help answering inquiries.",
  "sourcePage": "/services",
  "sourceCta": "services-launch-bundle",
  "referrer": "https://www.google.com/",
  "utmSource": "",
  "utmMedium": "",
  "utmCampaign": "",
  "nickname": ""
}
```

| Field | Rule |
| --- | --- |
| `fullName` | Required, up to 120 characters |
| `email` | Required, valid address, up to 254 |
| `phone` | Optional; digits, spaces and `+ ( ) - .`, 5–40 characters |
| `company` | Optional, up to 160 |
| `websiteUrl` | Optional, must look like `example.com`, up to 255 |
| `serviceSlug` | Optional; must be a published service |
| `message` | Required, 10–5,000 characters |
| `sourcePage`, `sourceCta`, `referrer`, `utmSource`, `utmMedium`, `utmCampaign` | Optional, captured automatically; trimmed to 255 / 120 / 500 / 120 / 120 / 120 characters |
| `nickname` | Spam trap. Must be empty; when filled, the reply is a normal 201 but nothing is stored |

Response `201`: `{ "data": { "received": true } }`. After the lead is stored, the team gets a notification (Reply-To: the lead) and the lead gets an acknowledgement (Reply-To: the team). Email failures are logged and never undo the lead.

### `GET /files/{id}`

Returns the image bytes with its content type and a 30-day cache header. 404 if unknown.

---

## Auth

### `POST /auth/login`

Request `{ "email": "...", "password": "..." }`. Response `200`:

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9…",
    "expiresIn": 900,
    "user": { "id": 1, "fullName": "Jivonz", "email": "jivonzdy@trilanetech.com", "role": "ADMIN", "active": true, "status": "ACTIVE", "lastLoginAt": "…", "createdAt": "…" }
  }
}
```

plus the `Set-Cookie: trilane_refresh=…` header. Every failure (unknown email, wrong password, locked, deactivated, invite not yet accepted) returns the same `401 INVALID_CREDENTIALS`. Five consecutive wrong passwords lock the account for 15 minutes.

### `POST /auth/refresh`

No body; uses the cookie. Same response as login with a new cookie. `401 SESSION_EXPIRED` clears the cookie.

### `POST /auth/logout`

Revokes the session in the cookie. `204` and a cookie-clearing header.

### `POST /auth/forgot-password`

Request `{ "email": "..." }`. Always `200` with the same message. If an active account exists, a single-use reset link valid for 1 hour is emailed, and earlier unused links stop working.

### `POST /auth/set-password`

Request `{ "token": "...", "password": "..." }`. The password must be 10–72 characters. Works for both invite links (72 hours) and reset links (1 hour). On success: `200`, the link is used up, any lockout is cleared and all existing sessions for that user end. Invalid, used or expired links return `400 INVALID_TOKEN`.

The emailed link has the form `{SITE_URL}/admin/set-password?token=…&type=invite|reset`.

### `GET /auth/me`

Current user (requires the access token).

---

## Admin

All endpoints below require `Authorization: Bearer <access token>` for an active user with the `ADMIN` role.

### `GET /admin/dashboard/summary`

```json
{
  "data": {
    "totalLeads": 57,
    "newThisWeek": 6,
    "newThisMonth": 19,
    "byStatus": [ { "key": "NEW", "label": "New", "count": 12 }, … ],
    "bySource": [ { "key": "google.com", "label": "google.com", "count": 9 }, … ],
    "byService": [ { "key": "7", "label": "Launch Bundle", "count": 5 }, { "key": "none", "label": "Not specified", "count": 3 } ],
    "overdueFollowUps": 2,
    "overdue": [ { "id": 14, "fullName": "…", "status": "Contacted", "followUpOn": "2026-11-10", "assignedToName": "JL" } ],
    "won": 4,
    "lost": 2,
    "conversionRate": 0.6667,
    "weekStart": "2026-11-16",
    "monthStart": "2026-11-01"
  }
}
```

Weeks start on Monday in `APP_TIMEZONE`. `conversionRate` is Won ÷ (Won + Lost), or null when both are zero. `bySource` lists the top 10. `byService[].key` is the service id (or `none`), usable as the `serviceId` filter.

### `GET /admin/leads`

Query parameters (all optional):

| Parameter | Meaning |
| --- | --- |
| `q` | Case-insensitive search in name, email, company and message |
| `status` | `NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `WON` or `LOST` |
| `serviceId` | A service id, or `none` for leads without a service |
| `assignedTo` | A user id, or `unassigned` |
| `source` | Source label: UTM source if present, else the referring domain without `www.`, else `direct` |
| `from`, `to` | Received date range, inclusive, in `APP_TIMEZONE` |
| `overdue` | `true` for follow-up dates before today on leads that are not Won or Lost |
| `sort` | `createdAt`, `fullName`, `status` or `followUpOn`, optionally `,asc` or `,desc` (default `createdAt,desc`) |
| `page`, `size` | Paging; `size` is capped at 100 (default 20) |

Each lead:

```json
{
  "id": 14, "fullName": "Maria Santos", "email": "maria@example.com", "phone": "+63 917 123 4567",
  "company": "Santos Bakery", "websiteUrl": "santosbakery.ph", "serviceId": 7, "serviceName": "Launch Bundle",
  "message": "…", "status": "CONTACTED", "statusLabel": "Contacted",
  "sourcePage": "/services", "sourceCta": "services-launch-bundle", "referrer": "https://www.google.com/",
  "utmSource": null, "utmMedium": null, "utmCampaign": null, "source": "google.com",
  "assignedToId": 1, "assignedToName": "Jivonz", "followUpOn": "2026-11-20", "overdue": false,
  "createdAt": "…", "updatedAt": "…"
}
```

### `GET /admin/leads/export`

Same filters and sort as the list (no paging; up to 10,000 rows). Returns `text/csv; charset=UTF-8` as an attachment named `trilane-leads-YYYY-MM-DD.csv`, with a byte-order mark so Excel reads accents correctly. Every cell is quoted, and values starting with `=`, `+`, `-`, `@`, tab or carriage return are prefixed with `'` so spreadsheets show them as text.

### `GET /admin/leads/{id}` · `PATCH /admin/leads/{id}` · `DELETE /admin/leads/{id}`

`PATCH` accepts any of `status`, `assignedToId`, `followUpOn`. Only keys present change; `null` clears the assignee or follow-up date. Any other key is rejected. The assignee must be an active user.

```json
{ "status": "PROPOSAL_SENT", "assignedToId": 2, "followUpOn": "2026-11-24" }
```

`DELETE` removes the lead and its notes (`204`).

### Notes

- `GET /admin/leads/{id}/notes`: newest first, `[{ id, body, authorId, authorName, createdAt }]`
- `POST /admin/leads/{id}/notes` with `{ "body": "…" }` (1–5,000 characters): `201`
- `DELETE /admin/leads/{id}/notes/{noteId}`: `204`; 404 if the note belongs to a different lead

### Services

- `GET /admin/services`: all services, including unpublished
- `POST /admin/services`: `201`
- `GET /admin/services/{id}`
- `PUT /admin/services/{id}`: replaces the service and its full list of items
- `DELETE /admin/services/{id}`: `204`; leads and projects that pointed at it are kept with the link cleared

Body:

```json
{
  "slug": "landing-page",
  "name": "Landing Page",
  "category": "ONE_TIME",
  "price": 1200,
  "billingPeriod": "ONCE",
  "regularPrice": null,
  "timeline": "5–7 business days",
  "hours": null,
  "summary": "…",
  "idealFor": "…",
  "displayOrder": 2,
  "published": true,
  "items": [ { "kind": "INCLUDED", "text": "Single high-converting landing page" } ]
}
```

`slug`: lowercase letters, numbers and single hyphens, unique, up to 80. `price`/`regularPrice`: 0 or more, two decimals. `hours`: 1–744. `summary` up to 2,000; `idealFor` up to 255; up to 50 items of up to 300 characters.

### Team

- `GET /admin/team` · `POST /admin/team` · `PUT /admin/team/{id}` · `DELETE /admin/team/{id}`

Body: `{ "fullName", "position", "bio", "photoFileId", "displayOrder", "published" }`. `photoFileId` must be an uploaded image id or null.

### Portfolio

- `GET /admin/portfolio` (summaries) · `POST /admin/portfolio` · `GET /admin/portfolio/{id}` (detail) · `PUT /admin/portfolio/{id}` · `DELETE /admin/portfolio/{id}`

Body:

```json
{
  "slug": "santos-bakery",
  "title": "Santos Bakery website",
  "clientName": "Santos Bakery",
  "summary": "…",
  "description": "…",
  "serviceId": 1,
  "projectUrl": "https://example.com",
  "coverFileId": 4,
  "completedOn": "2026-10-30",
  "displayOrder": 1,
  "published": true,
  "concept": false,
  "images": [ { "fileId": 5, "altText": "Home page on a phone" } ]
}
```

New projects default to unpublished. `projectUrl` must start with `http://` or `https://`. Up to 30 images.

### FAQ

- `GET /admin/faqs` · `POST /admin/faqs` · `PUT /admin/faqs/{id}` · `DELETE /admin/faqs/{id}`

Body: `{ "question" (≤300), "answer" (≤5,000), "displayOrder", "published" }`.

### Pilot offer

- `GET /admin/settings/pilot`: `{ enabled, price, spotsRemaining, serviceName, regularPrice, live }`
- `PUT /admin/settings/pilot` with `{ "enabled": true, "price": 2900, "spotsRemaining": 5 }` (spots 0–1,000)

### Booking link

- `GET /admin/settings/booking`: `{ url }` (empty string when none is set)
- `PUT /admin/settings/booking` with `{ "url": "https://calendar.app.google/…" }`. The address must start with `https://` (at most 500 characters). Send `""` to hide the "Book a call" buttons.

### Users

- `GET /admin/users`: `[{ id, fullName, email, role, active, status, lastLoginAt, createdAt }]`, where `status` is `ACTIVE`, `INVITED` or `DEACTIVATED`
- `POST /admin/users` with `{ "fullName", "email" }`: creates an Admin without a password and emails a 72-hour invite link. `409` if the email is taken (case-insensitive).
- `POST /admin/users/{id}/resend-invite`: new link; earlier links stop working. `409` if the person already set a password or is deactivated.
- `PATCH /admin/users/{id}` with `{ "active": false | true }`: deactivating ends all of that user's sessions immediately. `409` when deactivating yourself or the last active admin who can sign in.

### Files

`POST /admin/files` as `multipart/form-data` with one part named `file`. JPEG, PNG or WebP only, recognised by content; up to 5 MB. Response `201`:

```json
{ "data": { "id": 4, "url": "/api/v1/files/4", "contentType": "image/png", "sizeBytes": 48213, "originalName": "photo.png" } }
```

---

## Reserved

`/api/v1/client/**` is reserved for a future client portal and currently refuses all requests.
