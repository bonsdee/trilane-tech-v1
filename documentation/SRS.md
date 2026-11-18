# Trilane Tech Website — Software Requirements Specification

Nov 17, 2026 · Approved specification, copied from the shared document at delivery. The implementation notes at the end were added when the build was delivered; everything above them is the approved text.

## 1. Project overview

Trilane Tech gets a public marketing website that captures leads, plus a private admin dashboard where the three team members manage those leads and edit site content. Nothing is built until this document is approved.

| Item | Decision |
| --- | --- |
| Product | Company website + admin dashboard (option 2) |
| Primary goal | Turn visitors into leads and track each lead to Won or Lost |
| Public users | Small businesses, startups and service businesses evaluating Trilane Tech |
| Internal users | Jivonz, JL and Rusebel, all with the Admin role |
| Frontend | React + Vite, JavaScript, plain modern CSS |
| Backend | Java 21, Spring Boot, Spring Web, Spring Data JPA, REST |
| Database | PostgreSQL, with versioned migrations |
| Domain | trilanetech.com (site), api.trilanetech.com (backend, proposed) |
| Currency | US dollars, as in the brief |

**Out of scope for this version:** client portal, client and project records, testimonials, blog, GoHighLevel sync, payments, calendar booking, AI features, CAPTCHA, lead change history.

## 2. Final feature list

Every item below is in the first version and will be fully working, with no placeholder features.

### Public website

- Six pages: Home, Services & Pricing, About/Team, Portfolio, FAQ, Contact. A seventh, Privacy Policy, is proposed in section 14.
- Services & Pricing shows all three one-time projects, three retainers and two bundles with price, timeline, inclusions and exclusions, loaded from the database.
- Pilot offer for the Launch Bundle ($2,900 instead of $3,600) with a "spots remaining" count. It disappears automatically when the count reaches zero or the offer is switched off.
- One contact form with name, email, phone (optional), company (optional), website (optional), service of interest and message. Service buttons across the site open the form with that service pre-selected.
- Automatic lead source capture: the page and button the visitor came from, the referring site, and ad campaign tags (UTM parameters).
- Portfolio page and project detail pages that stay hidden from navigation until the first project is published.
- Light and dark mode that follows the device setting, with a manual toggle that is remembered.
- Cookie consent banner. Google Analytics loads only if a measurement ID is configured and the visitor accepts.
- Sitemap file, robots file, per-page titles and descriptions, and social sharing tags.
- Loading, empty and error states on every data-driven section.

### Admin dashboard

- Login, logout, forgot password, and account lockout after repeated failed attempts.
- Overview screen: new leads this week and this month, leads by status, by source and by service, overdue follow-ups, and conversion rate (Won divided by Won plus Lost).
- Leads: searchable, filterable, paginated list; lead detail with status, assignee, follow-up date and internal notes; overdue follow-ups highlighted; CSV export of the current filter; delete.
- Lead statuses: New, Contacted, Qualified, Proposal Sent, Won, Lost.
- Content management for services, pricing and bundles, team bios and photos, portfolio projects with images, FAQ entries, and the pilot offer settings.
- Users: invite a team member by email, resend an invite, deactivate or reactivate an account.

### Email

- New lead: notification to the team inbox and an automatic acknowledgement to the lead.
- Account invite and password reset links, each single-use and expiring.
- A lead is always saved even if email delivery fails; the failure is logged.

### Future features (structure prepared, no code shipped)

| Feature | How the first version leaves room |
| --- | --- |
| Client portal | Role column on users; API split into public, admin and a reserved client area |
| Testimonials | Content modules follow one pattern, so a new one is an addition |
| Blog | Same content pattern; routes reserved |
| GoHighLevel sync | Lead creation publishes an internal event a sync listener can subscribe to |
| Stripe payments | Services carry stable identifiers and prices in the database |
| Call booking | Contact page layout has a slot for a booking button |
| Individual service pages | Each service already has a URL-friendly identifier |
| Cloud image storage | File storage sits behind one interface with a local-disk implementation |

## 3. Sitemap

The public site and the dashboard are one React application; the dashboard code loads only when someone visits `/admin`.

| Route | Screen | Access |
| --- | --- | --- |
| `/` | Home: positioning, three service lanes, pilot offer, team preview, contact prompt | Public |
| `/services` | Services & Pricing: one-time projects, retainers, bundles | Public |
| `/about` | About and team | Public |
| `/portfolio` | Project list (hidden until a project is published) | Public |
| `/portfolio/:slug` | Project detail | Public |
| `/faq` | Frequently asked questions | Public |
| `/contact` | Contact form; accepts `?service=` to pre-select | Public |
| `/privacy` | Privacy policy (proposed) | Public |
| `/admin/login` | Sign in | Public |
| `/admin/forgot-password` | Request a reset link | Public |
| `/admin/set-password` | Set a password from an invite or reset link | Link holder |
| `/admin` | Overview | Admin |
| `/admin/leads` | Lead list, filters, export | Admin |
| `/admin/leads/:id` | Lead detail and notes | Admin |
| `/admin/services` | Services, pricing and bundles | Admin |
| `/admin/team` | Team bios and photos | Admin |
| `/admin/portfolio` | Portfolio projects | Admin |
| `/admin/faq` | FAQ entries | Admin |
| `/admin/settings` | Pilot offer settings | Admin |
| `/admin/users` | Team accounts | Admin |
| `*` | Not found page | Public |

## 4. User roles and permissions

There is one working role, Admin, held by all three team members. The role is stored per user and checked on every admin request, so adding Staff or Client later is a data change plus new rules.

| Capability | Visitor | Admin |
| --- | --- | --- |
| View public pages and published content | Yes | Yes |
| Submit the contact form | Yes | Yes |
| View and manage leads, notes, export | No | Yes |
| Edit services, team, portfolio, FAQ, pilot offer | No | Yes |
| Invite, deactivate and reactivate users | No | Yes |

Two safeguards apply: an Admin cannot deactivate their own account, and the last active Admin cannot be deactivated.

## 5. Database architecture

PostgreSQL holds 13 tables, created and versioned by Flyway migration files so every environment has the same structure. The current services, prices, team bios and starter FAQ entries are loaded by a seed migration.

| Table | Purpose | Key columns |
| --- | --- | --- |
| `users` | Team accounts | full_name, email (unique), password_hash, role, active, failed_login_attempts, locked_until, last_login_at |
| `password_tokens` | Invite and reset links | user_id, token_hash, purpose (INVITE or RESET), expires_at, used_at |
| `refresh_tokens` | Signed-in sessions | user_id, token_hash, expires_at, revoked_at |
| `services` | Projects, retainers, bundles | slug (unique), name, category (ONE_TIME, RETAINER, BUNDLE), price, billing_period (ONCE or MONTHLY), regular_price, timeline, hours, summary, ideal_for, display_order, published |
| `service_items` | Inclusions and exclusions | service_id, kind (INCLUDED or NOT_INCLUDED), text, display_order |
| `team_members` | Public team profiles | full_name, position, bio, photo_file_id, display_order, published |
| `portfolio_projects` | Case studies | slug (unique), title, client_name, summary, description, service_id, project_url, cover_file_id, completed_on, display_order, published |
| `portfolio_images` | Project gallery | project_id, file_id, alt_text, display_order |
| `faqs` | FAQ entries | question, answer, display_order, published |
| `stored_files` | Uploaded images | storage_key, original_name, content_type, size_bytes, uploaded_by |
| `site_settings` | Pilot offer and similar switches | key (unique), value |
| `leads` | Contact form submissions | full_name, email, phone, company, website_url, service_id, message, status, source_page, source_cta, referrer, utm_source, utm_medium, utm_campaign, assigned_to, follow_up_on |
| `lead_notes` | Internal notes | lead_id, author_id, body |

Every table also has `id`, `created_at` and `updated_at`.

**Relationships**

- A service has many service items; deleting a service deletes its items.
- A lead optionally points to one service and one assigned user. Deleting a service or deactivating a user keeps the lead and clears or preserves the link respectively.
- A lead has many notes; deleting a lead deletes its notes.
- A portfolio project has many images and optionally one service; each image points to one stored file.
- A user has many password tokens and refresh tokens.

**Indexes:** leads by status, created_at, follow_up_on and assigned_to; unique indexes on user email and all slugs.

`team_members` and `users` are separate on purpose: one is public profile content, the other is a login. That lets you edit a bio without touching accounts.

## 6. API architecture

The backend exposes a versioned REST API under `/api/v1`, split into three areas: `public` (no login), `auth` (signing in), and `admin` (Admin role required). A `client` area is reserved for the future portal.

### Public

| Method and path | Purpose |
| --- | --- |
| `GET /public/services` | Published services, grouped by category, with items |
| `GET /public/team` | Published team members |
| `GET /public/portfolio` | Published projects |
| `GET /public/portfolio/{slug}` | One project with gallery |
| `GET /public/faqs` | Published FAQ entries |
| `GET /public/site` | Pilot offer state and whether the portfolio is visible |
| `POST /public/leads` | Submit the contact form (rate limited) |
| `GET /files/{id}` | Serve an uploaded image |

### Auth

| Method and path | Purpose |
| --- | --- |
| `POST /auth/login` | Sign in; returns a short-lived access token and sets a refresh cookie |
| `POST /auth/refresh` | Exchange the refresh cookie for a new access token |
| `POST /auth/logout` | Revoke the session |
| `POST /auth/forgot-password` | Email a reset link; always answers the same way |
| `POST /auth/set-password` | Set a password from an invite or reset token |
| `GET /auth/me` | Current user |

### Admin

| Method and path | Purpose |
| --- | --- |
| `GET /admin/dashboard/summary` | Overview numbers |
| `GET /admin/leads` | List with search, filters (status, service, assignee, source, date range, overdue), sorting and paging |
| `GET /admin/leads/export` | CSV of the current filter |
| `GET`, `PATCH`, `DELETE /admin/leads/{id}` | Read, update status, assignee or follow-up date, delete |
| `GET`, `POST /admin/leads/{id}/notes` | List and add notes |
| `DELETE /admin/leads/{id}/notes/{noteId}` | Remove a note |
| `GET`, `POST /admin/services`; `GET`, `PUT`, `DELETE /admin/services/{id}` | Manage services and their items |
| `GET`, `POST /admin/team`; `PUT`, `DELETE /admin/team/{id}` | Manage team profiles |
| `GET`, `POST /admin/portfolio`; `GET`, `PUT`, `DELETE /admin/portfolio/{id}` | Manage projects and galleries |
| `GET`, `POST /admin/faqs`; `PUT`, `DELETE /admin/faqs/{id}` | Manage FAQ entries |
| `GET`, `PUT /admin/settings/pilot` | Pilot offer on or off, price, spots remaining |
| `GET`, `POST /admin/users` | List users, invite a user |
| `POST /admin/users/{id}/resend-invite` | Send a fresh invite link |
| `PATCH /admin/users/{id}` | Deactivate or reactivate |
| `POST /admin/files` | Upload an image (JPEG, PNG or WebP, up to 5 MB) |

### Response format

Successful responses return `{ "data": ... }`, with a `meta` object carrying page number, page size and total for lists. Errors return `{ "error": { "code", "message", "fields" } }`, where `fields` lists per-field validation messages. Status codes: 200, 201, 204, 400 (validation), 401 (not signed in), 403 (not allowed), 404, 409 (conflict such as a duplicate email), 429 (too many requests), 500.

## 7. Frontend architecture

The frontend is a single React application built with Vite in JavaScript, with two runtime dependencies beyond React itself: React Router for pages and Axios for API calls. There is no UI component library; the design system is hand-built CSS.

```
frontend/src/
  api/          one file per backend area (leads, services, auth, ...) plus the shared Axios client
  components/   reusable pieces: Button, Card, Field, Modal, Table, Badge, Spinner, EmptyState, ErrorState
  layouts/      PublicLayout (header, footer, consent banner), AdminLayout (sidebar, top bar)
  pages/        public/ and admin/, one folder per screen
  hooks/        useAuth, useTheme, useFetch, useLeadSource
  context/      AuthContext, ThemeContext
  styles/       tokens.css (colors, spacing, type), base.css, per-component CSS Modules
  utils/        validation, formatting, lead source capture
  routes.jsx    route table with lazy-loaded admin section and protected routes
```

- **State:** React context for the signed-in user and the theme; page data is fetched per screen through a shared hook that provides loading, empty and error states. No global state library.
- **Sign-in handling:** the access token is kept in memory only. The Axios client attaches it to requests and, on a 401, silently asks for a new one using the refresh cookie, then retries once.
- **Forms:** shared validation rules mirror the backend rules; server-side field errors are shown next to the matching field.
- **Configuration:** `VITE_API_BASE_URL` and `VITE_GA_MEASUREMENT_ID` come from environment files; `.env.example` is included.
- **Search engines:** each page sets its own title, description and sharing tags, and the site ships a sitemap and robots file. The pages are rendered in the browser, which Google handles but which is slower to index than pre-built pages. Pre-rendering the public pages is a possible later improvement and is not in this version.
- **Accessibility:** semantic HTML, keyboard-reachable navigation and dialogs, visible focus states, and contrast that meets WCAG AA in both themes.

## 8. Backend architecture

The backend is one Spring Boot application on Java 21, built with Maven and organised by feature, with each feature following the Controller, Service, Repository, Entity pattern and using DTOs for everything that crosses the API.

```
backend/src/main/java/com/trilanetech/api/
  auth/        login, refresh, password tokens, JWT handling
  user/        accounts and invites
  lead/        leads, notes, CSV export, lead-created event
  catalog/     services and service items
  team/        team profiles
  portfolio/   projects and galleries
  faq/         FAQ entries
  settings/    pilot offer
  file/        FileStorage interface + local-disk implementation
  dashboard/   overview queries
  email/       mail sender and templates
  common/      response envelope, exception handler, rate limiter, security config
backend/src/main/resources/
  application.yml, application-dev.yml, application-prod.yml
  db/migration/   Flyway SQL files
  templates/      email templates
```

| Concern | Approach |
| --- | --- |
| Dependencies | Spring Web, Data JPA, Security, Validation, Mail, Flyway, the PostgreSQL driver, and one JWT library. Exact versions are pinned to the current stable releases when the build is created. |
| Validation | Bean Validation annotations on request DTOs |
| Errors | One central exception handler producing the error format in section 6 |
| Email | Sent after the lead is saved, on a background thread, through standard SMTP |
| Lead events | Saving a lead publishes an internal event; email is the first listener, a CRM sync can be a second |
| Configuration | Database, SMTP, JWT secret, allowed site address, first admin and upload folder all come from environment variables; nothing secret is in the code |
| First admin | Created at startup from `ADMIN_EMAIL` and `ADMIN_NAME` if no users exist, then sent a set-password link |
| Logging | Structured request and error logs; no passwords, tokens or message bodies are logged |

## 9. UI/UX direction

The look is quiet and typographic: near-black text on white, large confident headlines, wide margins, and teal used only for actions. It borrows Apple's restraint without copying its layouts or assets.

| Element | Light mode | Dark mode |
| --- | --- | --- |
| Page background | White `#FFFFFF` | Near-black `#0E1113` |
| Section and card surface | Soft grey `#F5F6F7` | Charcoal `#171B1E` |
| Primary text | Ink `#111417` | Off-white `#F2F4F5` |
| Secondary text | Slate `#5B6570` | Grey `#A3ADB7` |
| Accent (buttons, links) | Teal `#0F766E` | Teal `#2DD4BF` |
| Borders | Hairline `#E3E6E9` | Hairline `#262C31` |

- **Typography:** the device's system font. Headlines are large and tight with heavy weight; body text is 17 px with generous line height.
- **Wordmark:** "Trilane Tech" set in text, paired with a simple mark of three parallel lines for the three lanes of work. It is built in code so a real logo can replace it later.
- **Shape:** cards with 20 px rounded corners, pill-shaped buttons, hairline borders and very soft shadows. One subtle teal gradient on the Home hero and nowhere else.
- **Navigation:** a slim header that stays at the top with a light blur, collapsing to a full-screen menu on phones. The dashboard uses a left sidebar that becomes a bottom bar on phones.
- **Motion:** sections fade and rise slightly as they scroll into view, buttons and cards respond to hover and press, and page changes cross-fade. All motion is switched off for visitors whose device asks for reduced motion.
- **Layout:** designed for phones first and scaled up to tablet and desktop, with a 1,120 px maximum content width and a consistent 8 px spacing scale.
- **Home page story:** who Trilane Tech is in one line, the three lanes (build, convert, operate), the services at a glance, the pilot offer, the three people, and a closing invitation to get in touch.
- **Content:** I write all site text from the brief for you to edit. Team members appear as initials on a teal tile until photos are uploaded.

## 10. Security considerations

| Area | Measure |
| --- | --- |
| Passwords | Stored only as BCrypt hashes; minimum 10 characters |
| Sessions | Access token valid for 15 minutes, held in browser memory; refresh token valid for 7 days in a cookie that scripts cannot read, restricted to the auth path, rotated on every use and revoked on logout |
| Lockout | Account locked for 15 minutes after 5 consecutive failed sign-ins |
| Invite and reset links | Random single-use tokens, stored hashed; invites expire after 72 hours, resets after 1 hour |
| Account discovery | Forgot-password and sign-in responses never reveal whether an email exists |
| Access control | Every `/admin` endpoint requires a valid token with the Admin role, enforced on the server |
| Contact form abuse | Hidden trap field, a limit of 5 submissions per address per hour, length limits on every field |
| Input handling | Server-side validation on all input; parameterised database queries; React escapes output by default |
| Uploads | Images only, checked by content and not just file name, 5 MB limit, stored under generated names |
| Cross-site requests | The API accepts browser requests only from the configured site address |
| Transport and headers | HTTPS in production; standard protective response headers |
| Secrets | Supplied through environment variables; `.env` files are excluded from version control |
| CSV export | Cell values that begin with formula characters are neutralised so a spreadsheet cannot execute them |
| Personal data | Leads can be deleted on request; analytics loads only after consent |

One known limit: the contact form's submission limiter lives in the application's memory, which is correct for a single backend instance. Running several instances later would need a shared store.

## 11. Deployment plan

The project runs on a laptop with three commands, and the setup guide covers a low-cost production layout on trilanetech.com.

### Local development

1. `docker compose up -d` starts PostgreSQL and a local mail catcher, so test emails are viewable in the browser and never leave your machine.
2. `./mvnw spring-boot:run` in `backend/` applies the migrations, loads the seed content and starts the API on port 8080.
3. `npm install` then `npm run dev` in `frontend/` starts the site on port 5173.

Requirements: Java 21, a current Node LTS release, and Docker. The guide also documents installing PostgreSQL directly for anyone without Docker.

### Production

| Part | Where | Notes |
| --- | --- | --- |
| Frontend | Vercel or Netlify at trilanetech.com | Static build; a rewrite rule sends all routes to the app |
| Backend | Render or Railway at api.trilanetech.com | Built from the included Dockerfile |
| Database | Managed PostgreSQL from the same provider | Automatic backups if the plan includes them |
| Email | SMTP for the trilanetech.com mailbox | Host, port, user and app password set as environment variables |
| Images | A persistent disk attached to the backend | See the storage note in section 14 |

The guide lists every environment variable for both applications, the DNS records to add, and a post-deploy checklist: sign in, submit a test lead, confirm both emails arrive, upload an image.

I have not verified current plan limits or prices for these providers; check them before choosing. Entry-level tiers commonly pause idle backends, which would make the first form submission after a quiet period slow.

## 12. Testing plan and current limits

As things stand, I cannot build or run either application in my workspace, so the delivered code would be reviewed but not executed. I checked this today: Node 22, Java 21, Maven and PostgreSQL 16 are installed, but package downloads from npm and Maven are blocked and Docker is not running.

| Check | With package downloads blocked (today) | With package downloads allowed |
| --- | --- | --- |
| Database migrations and seed data run on PostgreSQL 16 | Can test | Can test |
| Frontend installs and builds | Cannot test | Can test |
| Backend compiles and starts | Cannot test | Can test |
| API endpoints, sign-in, permissions, validation | Cannot test | Can test with automated tests and live requests |
| Forms, responsive layouts, browser console | Cannot test | Can test in a headless browser if one can be installed; otherwise I will say so |
| Email delivery through your real mailbox | Cannot test | Cannot test; needs your SMTP credentials, so you verify it with the checklist |
| Production deployment | Cannot test | Cannot test; you deploy using the guide |

**Recommended:** allow package installs in your Claude network settings before approving the build. The change may only take effect in a new chat; if so, share this document's link there and I can build from it.

If you prefer to proceed without that, I will still deliver the full ZIP, and the README will state plainly that the code has not been compiled or run and list the first commands to verify it yourself.

The backend will include automated tests for sign-in, lockout, permissions, lead submission and validation, lead filtering and CSV export, so you can re-run them at any time with `./mvnw test`.

## 13. Development milestones

The build runs in eight stages in this order, delivered together as one ZIP once the last stage passes.

1. **Foundation:** project structure, configuration, Docker Compose, database migrations and seed content.
2. **Accounts and security:** sign-in, sessions, invites, password reset, lockout, first-admin setup.
3. **Content API:** services, team, portfolio, FAQ, pilot offer and image uploads.
4. **Leads API:** contact submission, spam protection, source capture, emails, lead management, notes, CSV export, overview numbers.
5. **Design system and public site:** tokens, components, both themes, all public pages, contact form, consent banner, search engine files.
6. **Admin dashboard:** overview, leads, content editors, settings, users.
7. **Quality pass:** automated tests, manual checks of every item in section 12 that the environment allows, fixes for anything critical.
8. **Documentation and packaging:** README, setup guide, API documentation, database design, this specification, environment examples, and the ZIP.

## 14. Assumptions and open items

These are the points I decided on your behalf or still need from you. Anything you do not change is treated as approved.

| # | Item | My assumption or recommendation |
| --- | --- | --- |
| 1 | Privacy Policy page | Add it. The site collects contact details and uses a consent banner, so it needs one. I would draft a plain-language starting text, which is not legal advice and should be reviewed. |
| 2 | Image storage on the proposed hosts | Backends on Render or Railway lose uploaded files on redeploy unless a persistent disk is attached. Either attach one, or tell me to build the cloud storage option (Cloudflare R2 or Amazon S3) now. |
| 3 | Mail provider for jivonzdy@trilanetech.com | Needed only at setup time for the SMTP host and an app password. Tell me if it is Google Workspace, Zoho or another, and I will write provider-specific steps. |
| 4 | First admin account | Jivonz, at jivonzdy@trilanetech.com, who then invites JL and Rusebel. |
| 5 | Pilot spots | Counter starts at 5 remaining; you change it in Settings. |
| 6 | Testimonials | Left out, following your later answer. |
| 7 | First future feature | You did not pick one, so I leave the most room for the client portal. |
| 8 | Lead notifications | Sent to jivonzdy@trilanetech.com only; the address is a setting and accepts several recipients later. |
| 9 | Site text | Written by me from the brief. FAQ answers will stick to facts in the brief, such as timelines, revisions and what is not included. |
| 10 | Build verification | Depends on the network setting described in section 12. |

## Approval

Reply with "approved" to start the build as specified, or list the changes you want first. Please also answer items 1, 2, 3 and 10.

**Approved on 17 November 2026** with these final decisions on the open items:

- Item 1: the Privacy Policy page at `/privacy` is included.
- Item 2: images are stored on the server disk, with a persistent disk attached in production; the storage interface stays switchable to cloud storage.
- Item 3: email is sent through Google Workspace SMTP for jivonzdy@trilanetech.com, and the setup guide gives Google-specific steps including the app password.
- Item 10: the build happens in a new chat with package installs allowed, so the code is compiled and tested before delivery.
- Items 4 to 9 stand as assumed.

---

## Implementation notes (added at delivery)

These record choices made while building where the specification left room, or where something turned out differently in practice. None of them adds or removes a feature.

| Topic | What was built, and why |
| --- | --- |
| Versions | Spring Boot 4.1.2 (latest stable; 4.2 was still a release candidate), Java 21, React 19.3.1, Vite 8.3.8, React Router 7.18.5, Axios 1.21.1, PostgreSQL 16. |
| JWT library | Spring Security's OAuth2 resource server, which uses Nimbus JOSE + JWT. It is the single JWT library, and it reuses Spring Security's own token checks. |
| Role checks | The role is read from the database on every admin request (not only from the token), so deactivating someone takes effect immediately rather than when their 15-minute token expires. |
| Refresh token reuse | Presenting a refresh token that was already rotated ends every session for that user, since it suggests the token was copied. |
| Lockout message | Locked, deactivated, wrong-password and unknown-email sign-ins all get the same message, which also explains the 15-minute pause, so the response never reveals whether an account exists or is locked. |
| "Last active admin" | Counts active admins who have set a password, so a pending invite cannot be the only remaining admin. |
| Lead source | One label per lead: the UTM source if present, otherwise the referring domain, otherwise "direct". Used for the source filter, the overview and the CSV. |
| Lead PATCH | Only the keys sent change; sending `null` clears the assignee or follow-up date. |
| Tracking fields | Automatically captured fields (page, button, referrer, UTM tags) are trimmed to length instead of rejected, so a long ad tag never blocks someone from getting in touch. Visitor-typed fields are validated. |
| Spam trap | A filled trap field gets a normal-looking success reply but nothing is stored or emailed. |
| Rate limit counting | Counts submissions that pass validation, so typing mistakes do not use up a visitor's five attempts. |
| Cookie banner | Shown only when `VITE_GA_MEASUREMENT_ID` is set. Without an ID the site sets no optional cookies, so there is nothing to consent to. |
| Team seed content | The packages document has no team information, so the seed contains only the names Jivonz, JL and Rusebel, without positions, bios or photos. Add these in the dashboard. |
| Pricing content | Taken from the "Trilane Tech Packages" document, using its suggested edits (copywriting at $150 per page; Launch Bundle saves $1,000 against $4,600 separately). Facts such as content deadlines, extra hours and the 60-day rollover appear in service summaries and the FAQ. |
| `.env` file | One `.env` in the project root configures both Docker Compose and the backend during local development. Production uses real environment variables. |
| Test database | Automated tests use a separate `trilane_test` database that is wiped before each test. Docker Compose creates it automatically. |
| Sitemap | Generated at build time from `VITE_SITE_URL`. Portfolio pages are not listed because they are hidden until something is published. |
