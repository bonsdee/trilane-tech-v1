# Trilane Tech website

The public marketing website for Trilane Tech, which captures leads, plus a private dashboard where the team manages those leads and edits site content.

- **Frontend:** React 19 + Vite 8 in JavaScript, plain CSS (CSS Modules), React Router, Axios
- **Backend:** Java 21, Spring Boot 4.1 (Web MVC, Data JPA, Security, Validation, Mail), Flyway
- **Database:** PostgreSQL 16

## Quick start

You need Java 21, Node.js 20.19+ and Docker Desktop. The full walkthrough is in [documentation/SETUP_GUIDE.md](documentation/SETUP_GUIDE.md).

```bash
cp .env.example .env                        # then set DB_PASSWORD, ADMIN_EMAIL, ADMIN_NAME
cp frontend/.env.example frontend/.env.local
docker compose up -d                        # PostgreSQL + Mailpit (http://localhost:8025)

cd backend && ./mvnw spring-boot:run        # API on http://localhost:8080
cd frontend && npm install && npm run dev   # site on http://localhost:5173
```

Open Mailpit at <http://localhost:8025>, follow the invite link to set the first admin's password, then sign in at <http://localhost:5173/admin>.

Run the backend tests (Docker Compose must be running): `cd backend && ./mvnw test`.

## Project layout

```
trilane-tech/
├── frontend/            React app (public site + lazy-loaded /admin dashboard)
├── backend/             Spring Boot API, Flyway migrations, email templates, tests, Dockerfile
├── database/            Docker init script (creates the test database)
├── documentation/       SRS, API documentation, database design, setup guide
├── branding/            Logo files (SVG, PNG), icons, Orbitron font and brand rules
├── docker-compose.yml   Local PostgreSQL and Mailpit
├── .env.example         Backend and Docker settings (copy to .env)
└── README.md
```

## Documentation

| File | Contents |
| --- | --- |
| [SETUP_GUIDE.md](documentation/SETUP_GUIDE.md) | Local setup, editors, environment variables, production deployment, Google Workspace email, go-live checklists, troubleshooting |
| [API_DOCUMENTATION.md](documentation/API_DOCUMENTATION.md) | Every endpoint, request and response format, error codes |
| [DATABASE_DESIGN.md](documentation/DATABASE_DESIGN.md) | Tables, relationships, indexes, seed content, backups |
| [SRS.md](documentation/SRS.md) | The approved specification, plus implementation notes |
| [branding/README.md](branding/README.md) | Logo versions, colours, typeface and usage rules |

## What was tested before delivery

Tested in the build environment (Linux, Java 21, Node 22, PostgreSQL 16, headless Chrome):

- `npm install` and `npm run build` for the frontend (0 vulnerabilities reported by npm).
- Backend compile, and **71 automated tests passing against a real PostgreSQL 16 database**. They cover sign-in, lockout, sessions, invites and resets, permissions, the contact form and its validation, spam protection, rate limiting, email sending and failure handling, lead filters and updates, notes, CSV export, the overview numbers, content management, uploads and the pilot offer.
- Both applications running together, exercised with live API requests, including production mode (secret required, secure cookie).
- Browser tests of every public page and dashboard screen at phone, tablet and desktop widths in light and dark mode, with no console errors and no sideways scrolling. These covered the contact form end to end, sign-in, lead management, all content editors, user management and the cookie banner with a sample Analytics ID.
- Emails were checked by capturing them with a local test mail server, not a real mailbox.

**Not tested:** delivery through your real Google Workspace mailbox, the Docker image build (no Docker daemon was available), deployment to any host, and real Google Analytics data collection. The setup guide has checklists for each of these.

## Before going live

- Add each team member's position, bio and photo in **Dashboard → Team**. The seed content only has their names.
- Review the Privacy Policy wording. It is a plain-language starting draft, not legal advice.
- Work through the go-live checklists in the setup guide.
# trilane-tech-v1
