// Configuration API centralisée
// En production, l'API est sur le même domaine (Nginx proxy /api)
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'

export const API_URL = isProduction
    ? `${window.location.protocol}//${window.location.host}`
    : 'http://localhost:5000'

// Google OAuth Client ID
// Configurer via VITE_GOOGLE_CLIENT_ID dans .env ou en dur ici
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

/**
 * Résout proprement tout chemin média (/uploads/..., uploads/..., URL externe, blob:, data:)
 */
export function resolveMediaUrl(rawPath) {
    if (!rawPath || typeof rawPath !== 'string') return ''
    const trimmed = rawPath.trim()
    if (!trimmed) return ''
    if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed
    const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    return `${API_URL}${normalized}`
}

/**
 * Découpe un texte en paragraphes propres en fusionnant les retours à la ligne
 * simples accidentels (copier-coller PDF / WhatsApp) tout en conservant les doubles
 * sauts de ligne (\n\n) comme paragraphes distincts.
 */
export function formatParagraphs(rawText) {
    if (!rawText) return []
    return String(rawText)
        .normalize('NFC')
        .replace(/\r\n/g, '\n')
        .split(/\n{2,}/)
        .map(block => block.replace(/\n+/g, ' ').replace(/[ \t]+/g, ' ').trim())
        .filter(Boolean)
}
