# GoomuFuloWidto Frontend

React single-page application for the GoomuFuloWidto platform.

## Stack

- React 19 with Vite 7
- React Router 7 (client-side routing)
- i18next (internationalization: French, Pulaar, English)
- CSS3 with custom properties and responsive breakpoints

## Structure

```
src/
├── components/     Reusable UI components (Header, Footer, Hero, Dictionary, etc.)
├── pages/          Route-level pages (Dictionary, Library, About, Contact, Admin)
│   └── admin/      Admin sub-pages (Dashboard, Dictionary, Books, Members, News)
├── context/        React context providers (Auth, Theme)
├── i18n/           Translation files (fr.json, ff.json, en.json)
├── data/           Static data modules
├── assets/         Images and logos
├── App.jsx         Application routes
├── App.css         Application-level styles
├── index.css       CSS variables, reset, typography
└── main.jsx        Application entry point
```

## Development

```bash
npm install
npm run dev         # http://localhost:5173
npm run build       # Production build output in dist/
npm run preview     # Preview production build locally
```

## Environment Variables

Create `.env.production` for production builds:

```env
VITE_API_URL=https://your-domain.com
```
