# Setup guide

This guide takes you from the extracted ZIP to both applications running on your computer, then covers production deployment and email.

- [1. Install the tools](#1-install-the-tools)
- [2. Configure the environment](#2-configure-the-environment)
- [3. Start the database and mail catcher](#3-start-the-database-and-mail-catcher)
- [4. Run the backend](#4-run-the-backend)
- [5. Run the frontend](#5-run-the-frontend)
- [6. Sign in for the first time](#6-sign-in-for-the-first-time)
- [7. Run the automated tests](#7-run-the-automated-tests)
- [8. Opening the project in an editor](#8-opening-the-project-in-an-editor)
- [9. Without Docker](#9-without-docker)
- [10. Environment variable reference](#10-environment-variable-reference)
- [11. Production deployment](#11-production-deployment)
- [12. Email with Google Workspace](#12-email-with-google-workspace)
- [13. Go-live checklists](#13-go-live-checklists)
- [14. Troubleshooting](#14-troubleshooting)

## 1. Install the tools

| Tool | Version | Check with |
| --- | --- | --- |
| Java (JDK) | 21 | `java -version` |
| Node.js | 20.19 or newer (current LTS recommended) | `node -v` |
| Docker Desktop | any recent | `docker --version` |

Maven does not need to be installed: the backend includes the Maven wrapper (`./mvnw`), which downloads the right version the first time.

On macOS with Homebrew:

```bash
brew install --cask temurin@21
brew install node
brew install --cask docker-desktop
```

Open Docker Desktop once after installing it and keep it running while you work.

## 2. Configure the environment

From the project folder:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local
```

Open `.env` and set at least:

- `DB_PASSWORD`: any long random string. It becomes the password of the local database.
- `ADMIN_EMAIL` and `ADMIN_NAME`: the first account, created automatically on first start.
- `JWT_SECRET` (recommended): generate one with `openssl rand -base64 48`. If you leave it empty in development, a temporary secret is generated each time and everyone is signed out on restart.

The defaults in `frontend/.env.local` already point at the local backend.

`.env` and `.env.local` contain secrets and are excluded from version control by `.gitignore`.

## 3. Start the database and mail catcher

```bash
docker compose up -d
```

This starts:

- **PostgreSQL 16** on `localhost:5432`, with a `trilane` database for the app and a `trilane_test` database for the automated tests.
- **Mailpit**, a mail catcher. Every email the backend sends locally lands at <http://localhost:8025> instead of a real inbox.

Check with `docker compose ps`; both should show as running (PostgreSQL as healthy).

## 4. Run the backend

```bash
cd backend
./mvnw spring-boot:run
```

On Windows use `mvnw.cmd spring-boot:run`.

The first run downloads dependencies (a few minutes). Then it:

1. applies the database migrations and loads the starting content (services, prices, FAQ, team names, pilot offer),
2. creates the first admin account from `ADMIN_EMAIL` if no accounts exist, and emails them an invite link,
3. starts the API on <http://localhost:8080>.

Quick check: <http://localhost:8080/api/v1/public/services> should show the services as JSON.

## 5. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The site runs at <http://localhost:5173> and the dashboard at <http://localhost:5173/admin>.

For a production build: `npm run build` (output in `frontend/dist/`). `npm run preview` serves that build at <http://localhost:4173>. If you use preview while the backend runs, add `http://localhost:4173` to `CORS_ALLOWED_ORIGINS` in `.env`.

## 6. Sign in for the first time

1. Open Mailpit at <http://localhost:8025>. You'll see "You're invited to the Trilane Tech dashboard".
2. Click **Set your password** in that email and choose a password of at least 10 characters.
3. Sign in at <http://localhost:5173/admin/login>.
4. Invite JL and Rusebel from **Users**. Their invites also appear in Mailpit locally.
5. In **Team**, add each person's position, bio and photo. The seed content only has their names.

If the invite email is missing, check the backend log for `Created the first admin account`. If accounts already existed, no invite is sent; use **Forgot password** on the sign-in page instead.

## 7. Run the automated tests

The backend has 71 automated tests (unit and full-application tests). They run against the real `trilane_test` PostgreSQL database, which is wiped and re-created before every test.

```bash
cd backend
./mvnw test
```

Docker Compose must be running (step 3). If you use your own PostgreSQL instead, create the `trilane_test` database first (see section 9) or point `TEST_DB_URL` at another empty database. Never point it at real data.

## 8. Opening the project in an editor

**IntelliJ IDEA:** open the `trilane-tech` folder, then right-click `backend/pom.xml` and choose *Add as Maven Project*. Run `TrilaneApiApplication` and set the run configuration's working directory to the `backend` folder (or the project root); the app finds `.env` in either. Set the project SDK to Java 21.

**VS Code:** open the `trilane-tech` folder and install the recommended extensions when prompted (Java and Spring Boot packs). Use the terminal commands above to run both apps.

## 9. Without Docker

Install PostgreSQL 16 directly (on macOS: `brew install postgresql@16 && brew services start postgresql@16`). Then create the user and databases, using the same password you put in `.env`:

```bash
psql postgres -c "CREATE USER trilane WITH PASSWORD 'your-db-password';"
psql postgres -c "CREATE DATABASE trilane OWNER trilane;"
psql postgres -c "CREATE DATABASE trilane_test OWNER trilane;"
```

Without Mailpit there is no local mail catcher. Either run any SMTP catcher on port 1025, or point the `MAIL_*` settings at a real SMTP account. If no mail server is reachable, the app keeps working and logs `Email delivery failed`, but invite links won't arrive. To reset your password in that situation, see section 14.

## 10. Environment variable reference

### Backend (`.env` locally; host settings in production)

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | prod: yes | `dev` | Set to `prod` in production |
| `DB_URL` | yes | `jdbc:postgresql://localhost:5432/trilane` | JDBC address of the database |
| `DB_USERNAME` | yes | `trilane` | |
| `DB_PASSWORD` | yes | — | |
| `JWT_SECRET` | prod: yes | random per run in dev | At least 32 characters; signs access tokens. Changing it signs everyone out |
| `SITE_URL` | yes | `http://localhost:5173` | Public website address; used in email links |
| `CORS_ALLOWED_ORIGINS` | no | same as `SITE_URL` | Comma-separated browser origins allowed to call the API |
| `APP_TIMEZONE` | no | `Asia/Manila` | For "this week", "this month" and overdue follow-ups |
| `ADMIN_EMAIL`, `ADMIN_NAME` | first start | — | First admin, created only when no accounts exist |
| `MAIL_HOST`, `MAIL_PORT` | yes | `localhost`, `1025` | SMTP server |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | prod | — | SMTP login (app password for Google) |
| `MAIL_SMTP_AUTH`, `MAIL_STARTTLS` | prod | `false` | `true` for Google Workspace |
| `MAIL_FROM` | yes | `Trilane Tech <no-reply@localhost>` | Sender, e.g. `Trilane Tech <jivonzdy@trilanetech.com>` |
| `LEAD_NOTIFICATION_TO` | yes | — | Comma-separated recipients of new-lead emails |
| `UPLOAD_DIR` | yes | `./uploads` | Folder for uploaded images; a persistent disk in production |
| `AUTH_COOKIE_SECURE` | no | `false` dev, `true` prod | Sends the refresh cookie only over HTTPS |
| `PORT` | no | `8080` | Port the API listens on (hosts often set this) |
| `TEST_DB_URL` | tests | `jdbc:postgresql://localhost:5432/trilane_test` | Database wiped by the automated tests |

### Frontend (`frontend/.env.local` locally; build settings on the host)

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | API address including `/api/v1`, e.g. `https://api.trilanetech.com/api/v1` |
| `VITE_SITE_URL` | Public site address, used for the sitemap, robots file, canonical links and sharing tags |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 ID (`G-…`). Leave empty to disable analytics and the cookie banner |

Frontend values are compiled into the public JavaScript, so never put secrets in them. Changing one requires a new build.

## 11. Production deployment

The live setup: frontend on **Cloudflare Pages** at `trilanetech.com`, backend on **Render** (Singapore) at `api.trilanetech.com` with a PostgreSQL database on **Supabase** (Singapore, session pooler). The approved specification allowed Vercel or Netlify for the frontend; Cloudflare Pages was chosen because its free plan adds no badge. In general terms the layout is: frontend at `trilanetech.com`, backend at `api.trilanetech.com`, managed PostgreSQL from the same provider, and a persistent disk for images. I have not verified these providers' current plans or prices; check them before choosing. Entry-level plans often put an idle backend to sleep, which makes the first request after a quiet period slow.

Because the site and API share the registrable domain `trilanetech.com`, the refresh cookie works with `SameSite=Lax` and no extra settings.

### 11.1 Database

Create a managed PostgreSQL 16 database. Note its host, port, database name, user and password, and build the JDBC address:

```
DB_URL=jdbc:postgresql://<host>:<port>/<database>?sslmode=require
```

Some providers show a `postgres://user:pass@host/db` address; the JDBC address uses the same parts, with the user and password going into `DB_USERNAME` and `DB_PASSWORD`.

**On Supabase**, the site only talks to the database through the backend, never through Supabase's built-in Data API. Lock that API down:

1. In the project, open **Project Settings → Data API** (or **Integrations → Data API → Settings**) and turn **Enable Data API** off.
2. Migration `V6` turns on row level security (RLS) for every app table and removes the Data API roles' access. It can't do Flyway's own history table, because Flyway locks that table while migrating. After the first deploy, run this once in the Supabase **SQL Editor**:

   ```sql
   ALTER TABLE public.flyway_schema_history ENABLE ROW LEVEL SECURITY;
   REVOKE ALL ON public.flyway_schema_history FROM anon, authenticated;
   ```
3. Any table added in a later migration needs `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;` in that same migration. The backend connects as the tables' owner, which is not affected by RLS.

### 11.2 Backend

1. Create a web service from this repository with root directory `backend`, using the included **Dockerfile**.
2. Attach a **persistent disk** mounted at `/data/uploads`. Without it, uploaded images are lost on every redeploy. The image already sets `UPLOAD_DIR=/data/uploads`.
3. Set the environment variables (section 10): `SPRING_PROFILES_ACTIVE=prod`, the `DB_*` values, a new `JWT_SECRET` (`openssl rand -base64 48`), `SITE_URL=https://trilanetech.com`, `CORS_ALLOWED_ORIGINS=https://trilanetech.com,https://www.trilanetech.com`, `ADMIN_EMAIL`, `ADMIN_NAME`, the Google `MAIL_*` values (section 12) and `LEAD_NOTIFICATION_TO`.
4. If the host requires a health check path, use `/api/v1/public/site`.
5. Deploy. In the log, look for `Successfully applied 6 migrations` (or fewer on a database that already has some of them) and `Created the first admin account`.
6. Add the custom domain `api.trilanetech.com` on the host and enable HTTPS.

The production profile trusts the host's proxy headers so client addresses are correct for the contact form limit. If every visitor seems to share one limit, the host's proxy address is outside the usual private ranges; set `SERVER_TOMCAT_REMOTEIP_INTERNALPROXIES` to a regular expression matching it.

### 11.3 Frontend

1. In Cloudflare, create a **Pages** project from this repository: root directory `frontend`, build command `npm run build`, output directory `dist`.
2. Set `VITE_API_BASE_URL=https://api.trilanetech.com/api/v1`, `VITE_SITE_URL=https://trilanetech.com`, `NODE_VERSION=22` and optionally `VITE_GA_MEASUREMENT_ID`.
3. Add the custom domains `trilanetech.com` and `www.trilanetech.com` under the project's **Custom domains**.
4. Routing: Cloudflare Pages serves `index.html` for any path without its own file, so `/admin` and the portfolio pages work with no rules. `frontend/public/_redirects` deliberately has no catch-all rule, because Cloudflare applies `_redirects` even when a page file exists and would hide the pre-rendered pages. (`frontend/vercel.json` is only for a Vercel setup.)

**Pre-rendered pages.** `npm run build` also writes a ready-made HTML file for Home, Services, About, FAQ, Contact and Privacy (`scripts/prerender.mjs`). Visitors, search engines and link previews that don't run JavaScript see the full content, and each page has its own title and description. The build reads services, team, FAQs and site settings from the live API at `VITE_API_BASE_URL`. If the API can't be reached, the build still succeeds and those sections load in the browser instead.

Content you change in the dashboard shows up for normal visitors straight away. The pre-rendered copy updates on the next build, so after larger content changes run **Retry deployment** on the latest deployment in Cloudflare Pages. When a backend change and a frontend change are pushed together, wait until Render shows the backend as **Live**, then retry the Cloudflare deployment so the pre-rendered pages use the new data.

Link previews (when the site is shared in chat apps or social media) use `frontend/public/og-image.png`, a 1200×630 image. The build writes the full address from `VITE_SITE_URL` into the preview tags in `index.html`, so that variable must be set to the live address. To change the preview, replace the image with another of the same size and name.

The Inter typeface is served from `frontend/public/fonts` rather than a font service. Its licence (SIL Open Font License 1.1) is in `frontend/public/fonts/Inter-LICENSE.txt` and must stay with the font files.

### 11.4 DNS

With the domain on Cloudflare, Pages creates the `@` and `www` records itself when you add the custom domains. For other setups, add the records each host shows you. Typically:

| Name | Type | Value |
| --- | --- | --- |
| `@` (trilanetech.com) | A or ALIAS | value given by Vercel or Netlify |
| `www` | CNAME | value given by Vercel or Netlify |
| `api` | CNAME | value given by Render or Railway |

Keep the existing MX records for Google Workspace untouched. Mail must keep working.

## 12. Email with Google Workspace

The approved setup sends through Google Workspace SMTP as `jivonzdy@trilanetech.com`.

1. Sign in to that account and turn on **2-Step Verification** (Google Account → Security). App passwords only exist once it's on. If you can't find the option, a Workspace administrator may need to allow 2-Step Verification for the organisation.
2. Go to Google Account → Security → **App passwords** and create one named "Trilane website". Copy the 16-character password (spaces don't matter).
3. Set these on the backend host:

```
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SMTP_AUTH=true
MAIL_STARTTLS=true
MAIL_USERNAME=jivonzdy@trilanetech.com
MAIL_PASSWORD=<the app password>
MAIL_FROM=Trilane Tech <jivonzdy@trilanetech.com>
LEAD_NOTIFICATION_TO=jivonzdy@trilanetech.com
```

`MAIL_FROM` must be the signed-in address or an alias configured on that Gmail account, otherwise Google rewrites the sender. To notify more people, list them in `LEAD_NOTIFICATION_TO`, separated by commas.

The app password is a secret. Store it only in the host's environment settings, never in the code or a committed file. If it leaks, revoke it on the same App passwords page and create a new one.

For good deliverability, make sure `trilanetech.com` has SPF and DKIM set up for Google Workspace (Admin console → Apps → Google Workspace → Gmail → Authenticate email).

## 13. Go-live checklists

### Email delivery (needs your real mailbox; could not be tested before delivery)

- [ ] The first-admin invite arrives at `ADMIN_EMAIL` within a minute, from "Trilane Tech", and is not in spam.
- [ ] The invite link opens `https://trilanetech.com/admin/set-password…` and setting a password works.
- [ ] "Forgot password" sends a reset email; the link works once and a second click says it has expired.
- [ ] A test lead from the live Contact page produces two emails: "New lead: …" to the team and "Thanks for contacting Trilane Tech" to the test address.
- [ ] Replying to "New lead: …" addresses the lead; replying to the acknowledgement addresses the team.
- [ ] Both emails look right in Gmail on desktop and on a phone, in light and dark mode.
- [ ] The backend log shows `Email sent: kind=…` and no `Email delivery failed` lines.

### Production deployment (could not be tested before delivery)

- [ ] `https://api.trilanetech.com/api/v1/public/site` returns JSON over HTTPS.
- [ ] The backend log shows the production profile and both migrations applied.
- [ ] `https://trilanetech.com` loads with HTTPS; reloading on `/services` or `/admin/leads` doesn't give a 404.
- [ ] `https://trilanetech.com/robots.txt` and `/sitemap.xml` use the real domain.
- [ ] Sign in, invite JL and Rusebel, and confirm they can set passwords.
- [ ] Reloading the dashboard keeps you signed in; signing out ends the session.
- [ ] Submit a test lead; it appears in Leads with the right page, button and source. Delete it afterwards.
- [ ] Upload a team photo; it shows on About. Redeploy the backend and confirm the photo is still there (this proves the persistent disk works).
- [ ] Change the pilot spots to 0 and back; the Home page offer disappears and returns.
- [ ] If analytics is configured: the banner appears, Decline loads nothing, Accept starts Google Analytics (visible in GA's Realtime view).
- [ ] Database backups are switched on at the host.
- [ ] Review the Privacy Policy text (`/privacy`). It is a plain-language starting draft, not legal advice.

## 14. Troubleshooting

| Problem | Fix |
| --- | --- |
| `Set DB_PASSWORD in .env` when starting Docker | Create `.env` from `.env.example` (step 2) |
| Backend: `password authentication failed` | `DB_PASSWORD` in `.env` differs from the one the database was created with. Use the original, or remove the volume with `docker compose down -v` (this deletes local data) and start again |
| Backend: `Connection refused` to 5432 | Start Docker Desktop and run `docker compose up -d` |
| Backend: `JWT_SECRET must be set in production` | Set `JWT_SECRET` (at least 32 characters) |
| The site says it can't reach the server | Check the backend is running and `VITE_API_BASE_URL` is right; restart `npm run dev` after editing `.env.local` |
| Browser console shows a CORS error | Add the site's exact origin (scheme, host and port) to `CORS_ALLOWED_ORIGINS` and restart the backend |
| Signed out after every backend restart in development | Set `JWT_SECRET` in `.env` |
| "You've sent several messages in a short time" while testing | The limit is 5 contact submissions per address per hour; restart the backend to reset it locally |
| No first-admin email | Accounts already exist. Use "Forgot password", or check the `MAIL_*` settings and the log for `Email delivery failed` |
| Locked out with no working email | Run this against the database, then use "Forgot password" once email works: `UPDATE users SET locked_until = NULL, failed_login_attempts = 0 WHERE email = 'you@…';` |
| Port 5432, 8080 or 5173 already in use | Stop the other program, or change the port (`PORT` for the backend; `server.port` in `vite.config.js` for the frontend, updating `SITE_URL` to match) |
