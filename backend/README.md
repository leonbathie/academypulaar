# GoomuFuloWiɗto Backend

API Backend pour le site GoomuFuloWiɗto – Suudu Ɗemngal Pulaar.

## Prérequis

- Node.js 18+
- PostgreSQL 14+

## Installation

1. **Configurer PostgreSQL**

```sql
CREATE DATABASE goomufulowidto;
```

2. **Configurer les variables d'environnement**

Modifiez le fichier `.env` avec vos informations PostgreSQL :

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/goomufulowidto
```

3. **Installer les dépendances**

```bash
npm install
```

4. **Initialiser la base de données**

```bash
npm run init-db
```

Cela crée les tables et l'utilisateur admin par défaut.

## Démarrage

```bash
# Mode développement (avec rechargement automatique)
npm run dev

# Mode production
npm start
```

Le serveur démarre sur `http://localhost:5000`

## Credentials Admin

- **Username:** admin
- **Password:** GoomuFulo2024!

> ⚠️ Changez le mot de passe après la première connexion !

## API Endpoints

### Authentification

- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Infos utilisateur
- `POST /api/auth/change-password` - Changer mot de passe

### Dictionnaire

- `GET /api/dictionary` - Liste des mots
- `GET /api/dictionary/:id` - Détail d'un mot
- `POST /api/dictionary` - Ajouter (admin)
- `PUT /api/dictionary/:id` - Modifier (admin)
- `DELETE /api/dictionary/:id` - Supprimer (admin)

### Membres

- `GET /api/members` - Liste des membres
- `POST /api/members` - Ajouter (admin)
- `PUT /api/members/:id` - Modifier (admin)
- `DELETE /api/members/:id` - Supprimer (admin)

### Actualités

- `GET /api/news` - Liste des actualités
- `POST /api/news` - Ajouter (admin)
- `PUT /api/news/:id` - Modifier (admin)
- `DELETE /api/news/:id` - Supprimer (admin)

### Contenu

- `GET /api/content/dire` - Liste "Dire, Ne pas dire"
- `POST /api/content/dire` - Ajouter (admin)
- `PUT /api/content/dire/:id` - Modifier (admin)
- `DELETE /api/content/dire/:id` - Supprimer (admin)

## Structure

```
backend/
├── server.js          # Serveur Express
├── database.js        # Connexion PostgreSQL
├── init-database.js   # Script d'initialisation
├── routes/
│   ├── auth.js        # Routes authentification
│   ├── dictionary.js  # Routes dictionnaire
│   ├── members.js     # Routes membres
│   ├── news.js        # Routes actualités
│   └── content.js     # Routes contenu
├── middleware/
│   └── auth.js        # Middleware JWT
└── uploads/           # Images uploadées
```

## Frontend Admin

Accédez au panel d'administration via:

```
http://localhost:5173/login
```

Puis:

```
http://localhost:5173/admin
```
