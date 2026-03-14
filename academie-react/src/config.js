// Configuration API centralisée
// En production, l'API est sur le même domaine (Nginx proxy /api)
const isProduction = window.location.hostname !== 'localhost';

export const API_URL = isProduction 
    ? `${window.location.protocol}//${window.location.host}`
    : 'http://localhost:5000'

// Google OAuth Client ID
// Configurer via VITE_GOOGLE_CLIENT_ID dans .env ou en dur ici
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
