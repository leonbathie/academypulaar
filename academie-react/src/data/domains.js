/**
 * Catalogue officiel des domaines du dictionnaire Goomu Fulo & Wiɗto.
 * Source de vérité partagée entre DictionaryPage.jsx et DictionaryAdmin.jsx.
 */
export const DICTIONARY_DOMAINS = [
    { key: 'scientifique',  icon: '🔬', adminKey: 'admin.dictionary.domScience' },
    { key: 'mathematiques', icon: '📐', adminKey: 'admin.dictionary.domMath' },
    { key: 'chimie',        icon: '🧪', adminKey: 'admin.dictionary.domChimie' },
    { key: 'biologie',      icon: '🧬', adminKey: 'admin.dictionary.domBio' },
    { key: 'astronomie',    icon: '🔭', adminKey: 'admin.dictionary.domAstro' },
    { key: 'informatique',  icon: '💻', adminKey: 'admin.dictionary.domInfo' },
    { key: 'religion',      icon: '🕌', adminKey: 'admin.dictionary.domReligion' },
    { key: 'finance',       icon: '💰', adminKey: 'admin.dictionary.domFinance' },
    { key: 'economie',      icon: '📈', adminKey: 'admin.dictionary.domEco' },
    { key: 'sport',         icon: '⚽', adminKey: 'admin.dictionary.domSport' },
    { key: 'droit',         icon: '⚖️', adminKey: 'admin.dictionary.domDroit' },
    { key: 'politique',     icon: '🏛️', adminKey: 'admin.dictionary.domPolitique' },
    { key: 'philosophie',   icon: '🧠', adminKey: 'admin.dictionary.domPhilo' },
    { key: 'histoire',      icon: '📜', adminKey: 'admin.dictionary.domHistoire' },
    { key: 'art_culture',   icon: '🎨', adminKey: 'admin.dictionary.domArtCulture' },
    { key: 'medias',        icon: '📰', adminKey: 'admin.dictionary.domMedias' },
    { key: 'dictionnaire',  icon: '📚', adminKey: 'admin.dictionary.domDict' },
    { key: 'botanique',     icon: '🌿', adminKey: 'admin.dictionary.domBota' },
    { key: 'vivants',       icon: '🦋', adminKey: 'admin.dictionary.domVivants' },
    { key: 'agriculture',   icon: '🌾', adminKey: 'admin.dictionary.domAgri' },
    { key: 'elevage',       icon: '🐄', adminKey: 'admin.dictionary.domElevage' },
    { key: 'peche',         icon: '🎣', adminKey: 'admin.dictionary.domPeche' },
    { key: 'alimentation',  icon: '🍲', adminKey: 'admin.dictionary.domAlimentation' },
    { key: 'forge',         icon: '🔨', adminKey: 'admin.dictionary.domForge' },
    { key: 'transport',     icon: '🧭', adminKey: 'admin.dictionary.domTransport' },
    { key: 'general',       icon: '🌍', adminKey: 'admin.dictionary.domGeneral' }
]

export const DOMAIN_ICON_MAP = Object.fromEntries(
    DICTIONARY_DOMAINS.map(d => [d.key, d.icon])
)

export const ADMIN_DOMAIN_KEY_MAP = Object.fromEntries(
    DICTIONARY_DOMAINS.map(d => [d.key, d.adminKey])
)
