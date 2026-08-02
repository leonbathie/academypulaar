import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '../api/client'

const CACHE_KEY = 'dictionary:all'

// Le corpus entier est récupéré en une fois puis conservé localement.
// Deux bénéfices : la recherche devient instantanée (aucun aller-retour
// réseau par frappe) et le dictionnaire reste consultable hors ligne, ce
// qui est la principale valeur ajoutée de l'app face au site.
export function useDictionary() {
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [fromCache, setFromCache] = useState(false)
    const [failed, setFailed] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        const { data, fromCache: cached, error } = await apiGet('/api/dictionary', CACHE_KEY)

        if (data) {
            setEntries(Array.isArray(data) ? data : [])
            setFromCache(cached)
            setFailed(false)
        } else {
            setFailed(!!error)
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        load()
    }, [load])

    return { entries, loading, fromCache, failed, reload: load }
}

// Même normalisation que le backend (backend/routes/dictionary.js) :
// NFC + minuscules + espaces collapsés, pour que ɓ ɗ ŋ ƴ se comparent
// de façon fiable quelle que soit la saisie du clavier.
export function normalize(value) {
    if (value === null || value === undefined) return ''
    return String(value)
        .normalize('NFC')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase()
}

// Reproduit le filtre SQL : correspondance sur le mot ou sa traduction
// française, plus les traductions anglaise et fulfulde côté client.
export function searchEntries(entries, term, letter, domain) {
    const query = normalize(term)
    const initial = normalize(letter)

    return entries.filter(entry => {
        if (initial && !normalize(entry.word).startsWith(initial)) return false

        if (domain) {
            const domains = Array.isArray(entry.domains) ? entry.domains : []
            if (!domains.includes(domain) && entry.domain !== domain) return false
        }

        if (!query) return true

        return (
            normalize(entry.word).includes(query) ||
            normalize(entry.translation_fr).includes(query) ||
            normalize(entry.translation_en).includes(query) ||
            normalize(entry.translation_ff).includes(query)
        )
    })
}

// Alphabet Pulaar/Fulfulde, pour le filtre par initiale.
export const ALPHABET = [
    'a', 'b', 'ɓ', 'c', 'd', 'ɗ', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
    'm', 'n', 'ŋ', 'ñ', 'o', 'p', 'r', 's', 't', 'u', 'w', 'y', 'ƴ',
]

// Liste des domaines présents dans le corpus, dédoublonnée et triée.
export function extractDomains(entries) {
    const set = new Set()
    for (const entry of entries) {
        const domains = Array.isArray(entry.domains) ? entry.domains : []
        for (const domain of domains) {
            if (domain) set.add(domain)
        }
        if (domains.length === 0 && entry.domain) set.add(entry.domain)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
}
