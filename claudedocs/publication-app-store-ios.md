# Publier GoomuFulo sur l'App Store

Procédure complète pour l'app iOS située dans `mobile/`.
Tout se fait depuis Windows : **aucun Mac n'est nécessaire**, EAS compile sur
des machines macOS dans le cloud.

---

## 1. Ce qui est déjà fait

| Élément | État |
|---|---|
| Projet Expo (SDK 57, React Native 0.86) | `mobile/` |
| Bundle identifier | `com.goomufulo.app` |
| Icône App Store 1024×1024 sans transparence | `mobile/assets/icon.png` |
| Splash screen | `mobile/assets/splash-icon.png` |
| Déclaration de chiffrement (évite la question à chaque build) | `usesNonExemptEncryption: false` |
| Langues déclarées | fr, en, ff |
| `expo-doctor` | 20/20 |

## 2. Architecture retenue : hybride

Apple rejette les apps qui ne sont qu'une WebView du site
(**Guideline 4.2 – Minimum Functionality**). Il n'existe pas d'équivalent
iOS du TWA Android. L'app contient donc de vraies fonctions natives :

- **Dictionnaire hors ligne** — le corpus est téléchargé une fois puis
  conservé localement ; la recherche s'exécute sur l'appareil, sans réseau.
- **Recherche instantanée** avec filtres par initiale (alphabet Pulaar
  complet : ɓ ɗ ŋ ñ ƴ) et par domaine.
- **Lecture audio** des prononciations et des exemples.
- **Favoris** stockés sur l'appareil, consultables sans connexion.
- **Partage natif** iOS.
- Bandeau explicite quand le contenu affiché vient du cache.

Les contenus longs et éditorialisés (bibliothèque, histoire, missions,
terminologie, mentions légales) sont affichés en WebView : les réécrire en
natif dupliquerait une mise en forme déjà maintenue côté site.

## 3. Pas d'authentification dans l'app — c'est délibéré

La connexion du site est **réservée aux invités** : un admin envoie une
invitation par email, il n'existe aucune inscription publique
(`backend/routes/auth.js`). C'est un back-office, pas une fonction
utilisateur. L'app iOS n'embarque donc aucun login, ce qui écarte deux
exigences Apple :

- **Guideline 4.8** — Sign in with Apple n'est exigé que si l'app propose
  une connexion tierce (Google). Pas de login ⇒ pas d'obligation.
- **Guideline 5.1.1(v)** — la suppression de compte dans l'app n'est exigée
  que si l'app permet d'en créer un.

L'administration continue de se faire depuis le site web.

> Si un jour des comptes utilisateurs publics sont ajoutés, **les deux
> exigences ci-dessus deviennent obligatoires** avant toute mise à jour.

---

## 4. Première publication, étape par étape

### 4.1 Se connecter à EAS

```bash
cd mobile
npx eas-cli login          # compte Expo
npx eas-cli init           # crée le projet côté Expo, écrit extra.eas.projectId
```

### 4.2 Créer la fiche dans App Store Connect

Sur https://appstoreconnect.apple.com → **Mes apps** → **+** :

- Plateforme : iOS
- Nom : `Goomu Fulo e Wiɗto` (30 caractères max)
- Langue principale : Français
- Bundle ID : `com.goomufulo.app` (à créer d'abord dans
  [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list)
  si absent de la liste déroulante)
- SKU : `goomufulo-ios`

### 4.3 Lancer le build

```bash
npx eas-cli build --platform ios --profile production
```

EAS demande les identifiants Apple et **génère automatiquement** le
certificat de distribution et le provisioning profile. Le build dure
typiquement 15–30 min selon la file d'attente.

> Compte Expo gratuit : la file d'attente est partagée et peut être longue.
> Le plan payant donne des builds prioritaires.

### 4.4 Envoyer sur App Store Connect

```bash
npx eas-cli submit --platform ios --latest
```

---

## 5. Éléments à préparer dans App Store Connect

### Captures d'écran (obligatoires)

`supportsTablet` est à `false`, donc **aucune capture iPad n'est requise**.
Il faut la taille iPhone 6.9" (1290×2796 ou 1320×2868) — Apple décline les
autres tailles automatiquement.

Écrans à capturer : Accueil, Dictionnaire (recherche active), Fiche d'un mot
avec audio, Favoris, Bibliothèque.

### Confidentialité

- URL de politique de confidentialité : `https://goomufulo.com/confidentialite`
  (page déjà en ligne — champ obligatoire, la fiche est bloquée sans elle)
- **App Privacy / nutrition labels** : l'app ne collecte aucune donnée
  personnelle. Les appels `track-search` et `track-view` envoient un terme
  recherché et un identifiant de mot, sans identifiant utilisateur ni
  publicité. À déclarer en « Données non liées à l'utilisateur » →
  *Usage Data / Product Interaction*.

### Autres champs

| Champ | Valeur |
|---|---|
| Catégorie principale | Éducation (secondaire : Référence) |
| Classification par âge | 4+ |
| Compte de démo pour la review | Non requis — aucune connexion dans l'app |
| Droits de chiffrement | Déjà déclaré via `usesNonExemptEncryption: false` |
| Copyright | Goomu Fulo e Wiɗto |

### Notes pour l'équipe de review

Texte suggéré, à coller dans « Notes » :

> L'application est le compagnon mobile de l'Académie de la langue Fulfulde
> (goomufulo.com). Le dictionnaire, la recherche, l'écoute des
> prononciations et les favoris fonctionnent nativement et hors connexion.
> Les sections documentaires longues affichent le contenu éditorial du site.
> Aucun compte n'est nécessaire : tout le contenu est public.

---

## 6. Mises à jour

Deux canaux, à ne pas confondre.

**Changement de code JavaScript uniquement** (texte, style, correctif d'écran) —
publication immédiate, sans review :

```bash
npx eas-cli update --branch production --message "Correction de l'affichage des exemples"
```

**Changement natif** (nouvelle dépendance native, icône, permission, version) —
nouveau build + nouvelle review :

```bash
# incrémenter "version" dans app.json (1.0.0 -> 1.0.1)
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --latest
```

`buildNumber` n'est pas à gérer à la main : `appVersionSource: "remote"` et
`autoIncrement: true` s'en chargent.

---

## 7. Points de vigilance

- **L'icône ne doit jamais avoir de canal alpha.** `mobile/assets/icon.png`
  est en 24 bits sans transparence ; regénérer avec un fond opaque si elle
  est remplacée, sinon l'envoi est refusé.
- **Ne pas activer `supportsTablet`** sans fournir aussi les captures iPad.
- **Les polices d'icônes** : n'importer que `@expo/vector-icons/Ionicons`,
  jamais `{ Ionicons } from '@expo/vector-icons'` — l'import global embarque
  les 17 familles (3,5 Mo au lieu de 390 Ko).
- **`npx expo-doctor`** avant chaque build : il détecte les dépendances
  natives manquantes, qui passent inaperçues à l'export mais font planter
  le binaire de production.

## 8. Traductions Fulfulde à faire relire

Les libellés de l'interface reprennent les traductions existantes de
`academie-react/src/i18n/ff.json`. Une douzaine de chaînes propres au mobile
n'existaient nulle part et ont été composées à partir de ce vocabulaire —
elles méritent une relecture par un locuteur avant publication
(`mobile/src/i18n/ff.json`) :

`tabs.favorites`, `tabs.more`, `common.retry`, `common.loading`,
`common.seeAll`, `common.close`, `common.error`, `offline.banner`,
`offline.noData`, `favorites.empty`, `favorites.emptyHint`,
`favorites.add`, `favorites.remove`, `more.openInBrowser`.
