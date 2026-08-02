import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../config'

const CACHE_PREFIX = 'cache:'
const DEFAULT_TIMEOUT = 12000

// Enveloppe fetch avec un timeout : sans ça une connexion très lente laisse
// l'écran en chargement indéfiniment au lieu de basculer sur le cache.
async function fetchWithTimeout(url, timeout) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    try {
        return await fetch(url, { signal: controller.signal })
    } finally {
        clearTimeout(timer)
    }
}

async function readCache(key) {
    try {
        const raw = await AsyncStorage.getItem(CACHE_PREFIX + key)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

async function writeCache(key, data) {
    try {
        await AsyncStorage.setItem(
            CACHE_PREFIX + key,
            JSON.stringify({ data, at: Date.now() })
        )
    } catch {
        // Quota plein ou stockage indisponible : le cache est un confort,
        // jamais un prérequis. On laisse passer silencieusement.
    }
}

/**
 * GET sur l'API avec repli hors-ligne.
 *
 * Renvoie { data, fromCache, error }. `data` vaut null seulement si le
 * réseau a échoué ET qu'aucune version en cache n'existe.
 *
 * @param {string} path      chemin commençant par « / » (ex. /api/dictionary)
 * @param {string} cacheKey  clé de cache ; si absente, aucun cache
 */
export async function apiGet(path, cacheKey = null, timeout = DEFAULT_TIMEOUT) {
    try {
        const response = await fetchWithTimeout(`${API_URL}${path}`, timeout)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const data = await response.json()
        if (cacheKey) await writeCache(cacheKey, data)
        return { data, fromCache: false, error: null }

    } catch (error) {
        if (cacheKey) {
            const cached = await readCache(cacheKey)
            if (cached) {
                return { data: cached.data, fromCache: true, error: null }
            }
        }
        return { data: null, fromCache: false, error }
    }
}

// Signaux d'usage renvoyés au backend (compteurs de recherche / consultation).
// Volontairement « fire and forget » : un échec ne doit jamais perturber
// la navigation, et hors-ligne on ne tente rien.
export function track(path, body = {}) {
    fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }).catch(() => {})
}
