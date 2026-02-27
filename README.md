# 🌍 GoomuFuloWiɗto – Suudu Ɗemngal Pulaar

**Plateforme numérique dédiée à la promotion et la préservation de la langue Pulaar (Fulfulde).**

> _GoomuFuloWiɗto_ — « Le groupe qui renforce le Pulaar »

🔗 **Site en ligne** : [goomunfulawidto.serveblog.net](https://goomunfulawidto.serveblog.net)

---

## 📋 Présentation

GoomuFuloWiɗto est une application web complète (fullstack) qui vise à :

- 📖 **Dictionnaire bilingue** Français ↔ Pulaar avec audio, domaines et exemples
- 📰 **Actualités** sur la langue et la culture peule
- 📚 **Bibliothèque numérique** de livres en Pulaar (téléchargement / achat)
- 🗣️ **Dire, Ne pas dire** — corrections linguistiques
- ❓ **Questions de langue** — FAQ linguistique
- 🏷️ **Terminologie** — vocabulaire spécialisé par domaine
- 👥 **Membres** — présentation de l'équipe
- 🌐 **Trilingue** : Français / Pulaar (Fulfulde) / English

---

## 🏗️ Architecture

```
academypulaar/
├── academie-react/          # Frontend React (Vite)
│   ├── src/
│   │   ├── components/      # Composants réutilisables (Header, Footer, Hero, etc.)
│   │   ├── pages/           # Pages (Dictionary, Library, About, Admin, etc.)
│   │   │   └── admin/       # Sous-pages du panneau admin
│   │   ├── context/         # AuthContext, ThemeContext
│   │   ├── i18n/            # Traductions (fr.json, ff.json, en.json)
│   │   ├── data/            # Données statiques
│   │   └── assets/          # Logo, images
│   └── public/
│
├── backend/                 # API Express.js
│   ├── server.js            # Point d'entrée serveur
│   ├── database.js          # Connexion PostgreSQL
│   ├── init-database.js     # Script d'initialisation DB
│   ├── routes/              # Routes API (auth, dictionary, books, news, etc.)
│   ├── middleware/           # Middleware JWT
│   └── scripts/             # Scripts utilitaires
│
├── .github/workflows/       # CI/CD (déploiement automatique)
├── nginx-academypulaar.conf # Configuration Nginx (référence)
└── README.md
```

---

## 🛠️ Technologies

### Frontend

| Technologie        | Usage                                         |
| ------------------ | --------------------------------------------- |
| **React 19**       | Framework UI                                  |
| **Vite 7**         | Build tool & dev server                       |
| **React Router 7** | Navigation SPA                                |
| **i18next**        | Internationalisation (FR / FF / EN)           |
| **CSS3**           | Styling avec variables CSS, responsive design |

### Backend

| Technologie    | Usage                                   |
| -------------- | --------------------------------------- |
| **Node.js**    | Runtime serveur                         |
| **Express.js** | Framework API REST                      |
| **PostgreSQL** | Base de données relationnelle           |
| **JWT**        | Authentification admin                  |
| **Multer**     | Upload de fichiers (images, audio, PDF) |
| **bcryptjs**   | Hashage des mots de passe               |

### Déploiement

| Technologie        | Usage                            |
| ------------------ | -------------------------------- |
| **VPS** (Contabo)  | Hébergement                      |
| **Nginx**          | Reverse proxy + serveur statique |
| **PM2**            | Process manager Node.js          |
| **GitHub Actions** | CI/CD automatisé                 |
| **SSL**            | Certificat HTTPS                 |

---

## 🚀 Installation locale

### Prérequis

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### 1. Cloner le projet

```bash
git clone https://github.com/leonbathie/academypulaar.git
cd academypulaar
```

### 2. Backend

```bash
cd backend
cp .env.example .env    # Configurer DATABASE_URL
npm install
npm run init-db         # Initialise les tables + admin
npm run dev             # Démarre sur http://localhost:5000
```

### 3. Frontend

```bash
cd academie-react
npm install
npm run dev             # Démarre sur http://localhost:5173
```

---

## 📡 API Endpoints

| Méthode | Route               | Description            |
| ------- | ------------------- | ---------------------- |
| `POST`  | `/api/auth/login`   | Connexion admin        |
| `GET`   | `/api/dictionary`   | Liste des mots         |
| `POST`  | `/api/dictionary`   | Ajouter un mot (admin) |
| `GET`   | `/api/members`      | Liste des membres      |
| `GET`   | `/api/news`         | Actualités             |
| `GET`   | `/api/content/dire` | Dire, Ne pas dire      |
| `GET`   | `/api/books`        | Bibliothèque           |

> Voir [backend/README.md](backend/README.md) pour la documentation complète de l'API.

---

## 🎨 Fonctionnalités

### Publiques

- 🔍 Recherche dans le dictionnaire (par mot, lettre, domaine)
- 🔊 Écoute audio des mots en Pulaar
- 📱 Design responsive (mobile, tablette, desktop)
- 🌙 Mode sombre / clair
- 🌐 Interface trilingue (FR / Pulaar / EN)
- 📥 Téléchargement de livres PDF

### Administration

- 📊 Dashboard avec statistiques
- ✏️ CRUD complet : dictionnaire, membres, actualités, livres, contenu
- 🎙️ Upload audio pour la prononciation
- 🖼️ Upload d'images pour les membres et actualités

---

## 👤 Auteur

**Léon Bathie** — [github.com/leonbathie](https://github.com/leonbathie)

---

## 📄 Licence

Ce projet est développé dans le cadre de la promotion de la langue Pulaar.
