import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import AsyncStorage from '@react-native-async-storage/async-storage'

import fr from './fr.json'
import en from './en.json'
import ff from './ff.json'

const SUPPORTED = ['fr', 'en', 'ff']
const STORAGE_KEY = 'app:language'

// Comme sur le site, le Fulfulde est la langue par défaut : c'est le
// public visé, pas un repli technique.
const FALLBACK = 'ff'

function deviceLanguage() {
    const tag = Localization.getLocales()[0]?.languageCode
    return SUPPORTED.includes(tag) ? tag : FALLBACK
}

// i18next est initialisé de façon synchrone (les 3 langues tiennent
// largement en mémoire sur mobile, pas besoin de lazy-load ici), puis la
// préférence stockée est appliquée dès qu'elle est lue.
i18n.use(initReactI18next).init({
    lng: deviceLanguage(),
    fallbackLng: FALLBACK,
    supportedLngs: SUPPORTED,
    resources: {
        fr: { translation: fr },
        en: { translation: en },
        ff: { translation: ff },
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
})

AsyncStorage.getItem(STORAGE_KEY)
    .then(stored => {
        if (stored && SUPPORTED.includes(stored) && stored !== i18n.language) {
            i18n.changeLanguage(stored)
        }
    })
    .catch(() => {})

export async function changeLanguage(lng) {
    if (!SUPPORTED.includes(lng)) return
    await i18n.changeLanguage(lng)
    AsyncStorage.setItem(STORAGE_KEY, lng).catch(() => {})
}

export const LANGUAGES = [
    { code: 'ff', label: 'Fulfulde' },
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
]

export default i18n
