// Configuration API centralisée
// En production, utilisez la variable d'environnement VITE_API_URL
const isProduction = window.location.hostname !== 'localhost';
const hostname = window.location.hostname;

// Utiliser l'IP si on est sur l'IP, sinon utiliser le domaine
export const API_URL = isProduction 
    ? (hostname === '173.249.22.217' ? 'https://173.249.22.217' : 'https://goomunfulawidto.serveblog.net')
    : 'http://localhost:5000'
