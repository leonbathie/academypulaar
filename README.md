# Goomu Fulo e Wiɗto

A fullstack web platform dedicated to serving, preserving, and developing the **Pulaar (Fulfulde)** language. It combines a multi-domain dictionary, a digital library, cultural heritage content, linguistic resources, and a full content-management admin panel.

**Live:** [goomufulo.com](https://goomufulo.com)

## Overview

The platform offers the following features:

- **Multi-domain dictionary** (Pulaar ↔ French / English) with audio pronunciation, usage examples, illustrative images, and classification across several domains (a word can belong to multiple domains)
- **Live inline search** on the homepage with instant results, plus a full dictionary page
- **Social sharing** of words with auto-generated Open Graph preview images
- **Digital library** of books in Pulaar (reading, download, purchase)
- **Cultural heritage** ("Patrimoine") section — gallery of cards with detail modals
- **Linguistic corrections** ("Wiyu, Woto Wiyu" / Dire, Ne pas dire)
- **Specialized terminology** organized by domain, with dedicated domain pages
- **News**, **team members**, **scholars**, and a **language FAQ**
- **Contact** form (messages stored in the database + email notification)
- **Trilingual interface**: Pulaar (Fulfulde, default), French, and English — lazy-loaded per language
- **Dark / light theme** and responsive design (mobile, tablet, desktop)

## Project Structure

```
academypulaar/
├── academie-react/            Frontend (React 19 / Vite 7)
│   ├── src/
│   │   ├── components/        Reusable UI (Header, Hero, Dictionary, Patrimoine, Footer, ShareWordButton…)
│   │   ├── pages/             Route-level pages
│   │   │   └── admin/         Admin panel sub-pages
│   │   ├── context/           React context (Auth, Theme, Api)
│   │   ├── i18n/              Translations (ff, fr, en) — lazy-loaded per language
│   │   ├── data/              Static data
│   │   └── assets/            Images and logos
│   └── public/
│
├── backend/                   REST API (Express.js)
│   ├── server.js              Server entry point (helmet, rate-limit, CORS)
│   ├── database.js            PostgreSQL connection
│   ├── init-database.js       Schema creation + migrations + default admin
│   ├── config/                Super-admin allow-list
│   ├── routes/                API route handlers
│   ├── middleware/            JWT authentication middleware
│   └── scripts/               Utility scripts
│
├── .github/workflows/         CI/CD (self-hosted runner, deploy on push to main)
├── nginx-academypulaar.conf   Nginx configuration reference
└── README.md
```

## Tech Stack

**Frontend:** React 19, Vite 7, React Router 7, i18next / react-i18next, lucide-react, CSS3 with custom properties

**Backend:** Node.js, Express.js, PostgreSQL (`pg`), JSON Web Tokens, Google OAuth (`google-auth-library`), Multer (uploads), Nodemailer (email), Helmet, express-rate-limit, bcryptjs. Open Graph word images are rendered with `satori` + `@resvg/resvg-js`.

**Infrastructure:** VPS, Cloudflare (TLS + CDN), Nginx reverse proxy, PostgreSQL, GitHub Actions CI/CD on a self-hosted runner (push to `main` auto-deploys).

## Getting Started

### Prerequisites

- Node.js 18 or later
- PostgreSQL 14 or later

### Backend

```bash
cd backend
cp .env.example .env        # Set DATABASE_URL, JWT_SECRET, Google OAuth + SMTP credentials
npm install
npm run init-db             # Creates tables, runs migrations, seeds default admin
npm run dev                 # Starts on http://localhost:5000 (nodemon)
```

### Frontend

```bash
cd academie-react
npm install
npm run dev                 # Starts on http://localhost:5173
npm run build               # Production build
npm run lint                # ESLint
```

## Authentication

Two sign-in methods are supported:

- **Email / password** (bcrypt-hashed) issuing a JWT
- **Google OAuth**

Roles are tiered (user → admin → super-admin). Super-admins are defined in an allow-list under `backend/config/` and cannot be demoted or deleted from the admin panel.

## API

Routes are mounted under `/api`. Main groups:

| Endpoint base          | Description                                  |
| ---------------------- | -------------------------------------------- |
| `/api/auth`            | Login (password + Google OAuth), user mgmt   |
| `/api/dictionary`      | Dictionary entries, search, stats, domains   |
| `/api/domain-content`  | Per-domain dictionary content                |
| `/api/terminologie`    | Specialized terminology                      |
| `/api/content`         | Editorial content (incl. "Dire / Ne pas dire") |
| `/api/books`           | Digital library                              |
| `/api/news`            | News articles                                |
| `/api/members`         | Team members                                 |
| `/api/scholars`        | Scholars                                     |
| `/api/questions`       | Language FAQ                                  |
| `/api/hero`            | Homepage hero content                        |
| `/api/contact`         | Contact messages (store + email)             |
| `/api/share`           | Word share pages with OG preview images      |
| `/api/visits`          | Visit tracking / stats                       |

## Administration

The admin panel (accessible via `/login`) provides:

- Dashboard with content and visit statistics
- Full CRUD for dictionary entries, terminology, members, scholars, news, books, FAQ, and editorial content
- Multi-domain assignment for dictionary words
- Audio and image upload (word pronunciation, illustrations, member/news images)
- Homepage hero editing
- Contact message inbox (read/unread, reply, delete)
- User management with role control (super-admins protected)

## Deployment

Pushing to the `main` branch triggers the GitHub Actions workflow on a self-hosted runner, which builds the frontend, installs backend dependencies, runs database migrations (`init-database.js`), and restarts the service. Production is served behind Cloudflare and Nginx.

## License

Developed for the promotion and preservation of the Pulaar (Fulfulde) language.
