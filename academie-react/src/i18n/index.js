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
        lng: 'ff',
        fallbackLng: 'ff',
        supportedLngs: ['fr', 'en', 'ff'],

        detection: {
            // Ordre de détection de la langue
            order: ['localStorage', 'navigator', 'htmlTag', 'querystring'],
            // Où sauvegarder la langue choisie
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
