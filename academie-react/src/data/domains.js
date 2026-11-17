/**
 * Catalogue officiel des domaines du dictionnaire Goomu Fulo & Wiɗto.
 * Source de vérité partagée entre DictionaryPage.jsx et DictionaryAdmin.jsx.
 */
export const DICTIONARY_DOMAINS = [
    { key: 'scientifique',  adminKey: 'admin.dictionary.domScience' },
    { key: 'mathematiques', adminKey: 'admin.dictionary.domMath' },
    { key: 'chimie',        adminKey: 'admin.dictionary.domChimie' },
    { key: 'biologie',      adminKey: 'admin.dictionary.domBio' },
    { key: 'astronomie',    adminKey: 'admin.dictionary.domAstro' },
    { key: 'informatique',  adminKey: 'admin.dictionary.domInfo' },
    { key: 'religion',      adminKey: 'admin.dictionary.domReligion' },
    { key: 'finance',       adminKey: 'admin.dictionary.domFinance' },
    { key: 'economie',      adminKey: 'admin.dictionary.domEco' },
    { key: 'sport',         adminKey: 'admin.dictionary.domSport' },
    { key: 'droit',         adminKey: 'admin.dictionary.domDroit' },
    { key: 'politique',     adminKey: 'admin.dictionary.domPolitique' },
    { key: 'philosophie',   adminKey: 'admin.dictionary.domPhilo' },
    { key: 'histoire',      adminKey: 'admin.dictionary.domHistoire' },
    { key: 'art_culture',   adminKey: 'admin.dictionary.domArtCulture' },
    { key: 'medias',        adminKey: 'admin.dictionary.domMedias' },
    { key: 'dictionnaire',  adminKey: 'admin.dictionary.domDict' },
    { key: 'botanique',     adminKey: 'admin.dictionary.domBota' },
    { key: 'vivants',       adminKey: 'admin.dictionary.domVivants' },
    { key: 'agriculture',   adminKey: 'admin.dictionary.domAgri' },
    { key: 'elevage',       adminKey: 'admin.dictionary.domElevage' },
    { key: 'peche',         adminKey: 'admin.dictionary.domPeche' },
    { key: 'alimentation',  adminKey: 'admin.dictionary.domAlimentation' },
    { key: 'forge',         adminKey: 'admin.dictionary.domForge' },
    { key: 'transport',     adminKey: 'admin.dictionary.domTransport' },
    { key: 'general',       adminKey: 'admin.dictionary.domGeneral' }
]

export const ADMIN_DOMAIN_KEY_MAP = Object.fromEntries(
    DICTIONARY_DOMAINS.map(d => [d.key, d.adminKey])
)
