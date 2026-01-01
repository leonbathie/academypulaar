// Configuration API centralisée
// En production, utilisez la variable d'environnement VITE_API_URL
const isProduction = window.location.hostname !== 'localhost';
export const API_URL = isProduction 
    ? 'https://goomufulowidto.servemp3.com' 
    : 'http://localhost:5000'
