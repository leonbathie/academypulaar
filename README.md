# GoomuFuloWidto

A fullstack web platform dedicated to the preservation and promotion of the Pulaar (Fulfulde) language. The application provides a bilingual dictionary, a digital library, linguistic resources, and an administration panel for content management.

**Live:** [goomunfulawidto.serveblog.net](https://goomunfulawidto.serveblog.net)

## Overview

GoomuFuloWidto offers the following features:

- Bilingual dictionary (French / Pulaar) with audio pronunciation, usage examples, and domain classification
- News section covering language and Fula culture
- Digital library with downloadable and purchasable books in Pulaar
- Linguistic correction section ("Dire, Ne pas dire")
- Language questions (FAQ)
- Specialized terminology organized by domain
- Full trilingual interface: French, Pulaar (Fulfulde), and English
- Dark / light theme support
- Responsive design across mobile, tablet, and desktop

## Project Structure

```
academypulaar/
├── academie-react/            Frontend (React / Vite)
│   ├── src/
│   │   ├── components/        Reusable UI components
│   │   ├── pages/             Route-level page components
│   │   │   └── admin/         Admin panel sub-pages
│   │   ├── context/           React context (Auth, Theme)
│   │   ├── i18n/              Translation files (fr, ff, en)
│   │   ├── data/              Static data
│   │   └── assets/            Images and logos
│   └── public/
│
├── backend/                   REST API (Express.js)
│   ├── server.js              Server entry point
│   ├── database.js            PostgreSQL connection
│   ├── init-database.js       Database initialization script
│   ├── routes/                API route handlers
│   ├── middleware/             JWT authentication middleware
│   └── scripts/               Utility scripts
│
├── .github/workflows/         CI/CD pipeline
├── nginx-academypulaar.conf   Nginx configuration reference
└── README.md
```

## Tech Stack

**Frontend:** React 19, Vite 7, React Router 7, i18next, CSS3 with custom properties

**Backend:** Node.js, Express.js, PostgreSQL, JSON Web Tokens, Multer (file uploads), bcryptjs

**Infrastructure:** VPS (Contabo), Nginx reverse proxy, PM2 process manager, GitHub Actions CI/CD, SSL/TLS

## Getting Started

### Prerequisites

- Node.js 18 or later
- PostgreSQL 14 or later

### Backend

```bash
cd backend
cp .env.example .env        # Set DATABASE_URL and JWT_SECRET
npm install
npm run init-db             # Creates tables and default admin user
npm run dev                 # Starts on http://localhost:5000
```

### Frontend

```bash
cd academie-react
npm install
npm run dev                 # Starts on http://localhost:5173
```

## API

| Method | Endpoint            | Description                |
| ------ | ------------------- | -------------------------- |
| POST   | /api/auth/login     | Admin authentication       |
| GET    | /api/dictionary     | List dictionary entries    |
| POST   | /api/dictionary     | Add dictionary entry       |
| GET    | /api/members        | List team members          |
| GET    | /api/news           | List news articles         |
| GET    | /api/content/dire   | Linguistic corrections     |
| GET    | /api/books          | List library books         |

See [backend/README.md](backend/README.md) for full API documentation.

## Administration

The admin panel (accessible via `/login`) provides:

- Dashboard with content statistics
- Full CRUD for dictionary entries, members, news, books, and linguistic content
- Audio upload for word pronunciation
- Image upload for members and news articles

## Author

Leon Bathie — [github.com/leonbathie](https://github.com/leonbathie)

## License

This project is developed for the promotion and preservation of the Pulaar language.
