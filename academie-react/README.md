# GoomuFuloWiɗto – Frontend

Application React pour GoomuFuloWiɗto – Suudu Ɗemngal Pulaar.

## Stack

- **React 19** + **Vite 7**
- **React Router 7** (SPA routing)
- **i18next** (internationalisation FR / Pulaar / EN)
- **CSS3** avec variables CSS et design responsive

## Structure

```
src/
├── components/     # Header, Footer, Hero, Dictionary, Features, News, DireNePasDire
├── pages/          # DictionaryPage, LibraryPage, AboutPage, ContactPage, AdminPage...
│   └── admin/      # DashboardAdmin, DictionaryAdmin, BooksAdmin, MembersAdmin...
├── context/        # AuthContext (JWT), ThemeContext (dark/light)
├── i18n/           # fr.json, ff.json, en.json, index.js
├── data/           # Données statiques (dictionary.js, members.js)
├── assets/         # Logo, images
├── App.jsx         # Routes principales
├── App.css         # Styles globaux de l'app
├── index.css       # Variables CSS, reset, typographie
└── main.jsx        # Point d'entrée React
```

## Développement

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # Production build dans dist/
npm run preview   # Prévisualisation du build
```

## Variables d'environnement

Créer `.env.production` pour la production :

```env
VITE_API_URL=https://votre-domaine.com
```
