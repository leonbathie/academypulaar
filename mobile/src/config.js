// Configuration centralisée de l'app mobile.
// Pendant : Metro tourne sur la machine de dev, mais le backend de prod
// reste la source de vérité — on ne pointe jamais sur localhost depuis un
// iPhone physique (l'appareil ne verrait pas la machine de dev).

export const API_URL = 'https://goomufulo.com'

// Site web affiché dans les WebView (contenus longs : bibliothèque,
// histoire, terminologie). Même origine que l'API.
export const WEB_URL = 'https://goomufulo.com'

// Construit l'URL absolue d'un média servi par le backend.
// Les colonnes audio_word / audio_example / image stockent un chemin
// relatif commençant par « / » (ex. /uploads/audio/mot.mp3).
export function mediaUrl(path) {
    if (!path) return null
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`
}
