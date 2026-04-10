import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import fr from './fr.json'
import en from './en.json'
import ff from './ff.json'

const resources = {
    fr: { translation: fr },
    en: { translation: en },
    ff: { translation: ff }  // Fulfulde
}

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'ff',
        supportedLngs: ['fr', 'en', 'ff'],

        detection: {
            // Ordre de détection : localStorage uniquement (pas navigator)
            order: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage']
        },

        interpolation: {
            escapeValue: false // React échappe déjà les valeurs
        },

        react: {
            useSuspense: true
        }
    })

export default i18n
