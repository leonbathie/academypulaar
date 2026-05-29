import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// === Optimisation : ne charger que la langue active dans le bundle initial ===
// Avant : import statique des 3 JSON => 190 Ko dans le bundle initial.
// Apres : dynamic import => Vite genere 3 chunks separes, seul celui de la
// langue detectee est telecharge au demarrage. Les autres se chargent au switch.

const SUPPORTED = ['fr', 'en', 'ff']

function getInitialLang() {
    try {
        const stored = localStorage.getItem('i18nextLng')
        if (stored && SUPPORTED.includes(stored)) return stored
    } catch (_) {}
    return 'ff'
}

// Vite genere 3 chunks (un par cas) grace aux import statiques inlines.
async function loadLangResource(lng) {
    switch (lng) {
        case 'fr': return (await import('./fr.json')).default
        case 'en': return (await import('./en.json')).default
        case 'ff':
        default:   return (await import('./ff.json')).default
    }
}

const initialLang = getInitialLang()
const initialResource = await loadLangResource(initialLang)

await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        lng: initialLang,
        fallbackLng: 'ff',
        supportedLngs: SUPPORTED,
        resources: { [initialLang]: { translation: initialResource } },

        detection: {
            order: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage']
        },

        interpolation: {
            escapeValue: false // React echappe deja les valeurs
        },

        react: {
            useSuspense: true
        }
    })

// Lazy-load des autres langues au switch.
i18n.on('languageChanged', async (lng) => {
    if (!SUPPORTED.includes(lng)) return
    if (i18n.hasResourceBundle(lng, 'translation')) return
    try {
        const res = await loadLangResource(lng)
        i18n.addResourceBundle(lng, 'translation', res, true, true)
    } catch (e) {
        console.error('Failed to load language', lng, e)
    }
})

export default i18n
