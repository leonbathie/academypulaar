// Configuration API centralisée
// En production, l'API est sur le même domaine (Nginx proxy /api)
const isProduction = window.location.hostname !== 'localhost';

export const API_URL = isProduction 
    ? `${window.location.protocol}//${window.location.host}`
    : 'http://localhost:5000'
