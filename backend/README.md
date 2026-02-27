# GoomuFuloWidto Backend

REST API server for the GoomuFuloWidto platform.

## Prerequisites

- Node.js 18 or later
- PostgreSQL 14 or later

## Installation

1. Create the database:

```sql
CREATE DATABASE goomufulowidto;
```

2. Configure environment variables in `.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/goomufulowidto
JWT_SECRET=your-secret-key
```

3. Install dependencies:

```bash
npm install
```

4. Initialize the database (creates tables and default admin user):

```bash
npm run init-db
```

## Usage

```bash
npm run dev     # Development mode with auto-reload
npm start       # Production mode
```

The server starts on `http://localhost:5000`.

## API Endpoints

### Authentication

| Method | Endpoint                    | Description           |
| ------ | --------------------------- | --------------------- |
| POST   | /api/auth/login             | Login                 |
| GET    | /api/auth/me                | Current user info     |
| POST   | /api/auth/change-password   | Change password       |

### Dictionary

| Method | Endpoint              | Description           |
| ------ | --------------------- | --------------------- |
| GET    | /api/dictionary       | List all entries      |
| GET    | /api/dictionary/:id   | Get single entry      |
| POST   | /api/dictionary       | Create entry (admin)  |
| PUT    | /api/dictionary/:id   | Update entry (admin)  |
| DELETE | /api/dictionary/:id   | Delete entry (admin)  |

### Members

| Method | Endpoint           | Description           |
| ------ | ------------------ | --------------------- |
| GET    | /api/members       | List all members      |
| POST   | /api/members       | Create member (admin) |
| PUT    | /api/members/:id   | Update member (admin) |
| DELETE | /api/members/:id   | Delete member (admin) |

### News

| Method | Endpoint        | Description             |
| ------ | --------------- | ----------------------- |
| GET    | /api/news       | List all articles       |
| POST   | /api/news       | Create article (admin)  |
| PUT    | /api/news/:id   | Update article (admin)  |
| DELETE | /api/news/:id   | Delete article (admin)  |

### Content

| Method | Endpoint              | Description                    |
| ------ | --------------------- | ------------------------------ |
| GET    | /api/content/dire     | List linguistic corrections    |
| POST   | /api/content/dire     | Create correction (admin)      |
| PUT    | /api/content/dire/:id | Update correction (admin)      |
| DELETE | /api/content/dire/:id | Delete correction (admin)      |

## Structure

```
backend/
├── server.js          Express server entry point
├── database.js        PostgreSQL connection pool
├── init-database.js   Database initialization script
├── routes/
│   ├── auth.js        Authentication routes
│   ├── dictionary.js  Dictionary routes
│   ├── members.js     Members routes
│   ├── news.js        News routes
│   ├── books.js       Books routes
│   └── content.js     Content routes
├── middleware/
│   └── auth.js        JWT authentication middleware
└── uploads/           User-uploaded files
```
