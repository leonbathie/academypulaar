/**
 * Partage social des mots du dictionnaire.
 *
 *   GET /share/word/:id            -> HTML avec balises Open Graph
 *                                     (consomme par les scrapers Facebook,
 *                                     WhatsApp, Twitter, etc.) + redirection
 *                                     auto vers /dictionnaire?word=X pour
 *                                     les vrais utilisateurs.
 *
 *   GET /share/word/:id/image.png  -> Image PNG 1200x630 generee a la volee
 *                                     via satori + resvg. Cachee 24h.
 *
 * Utilisation cote front : un bouton "Partager" sur chaque carte de mot
 * partage l'URL /share/word/:id. Les apercus FB / WhatsApp affichent
 * automatiquement la jolie image.
 */
const express = require('express')
const fs = require('fs')
const path = require('path')
const { query } = require('../database')
const { validateId } = require('../middleware/auth')

const router = express.Router()

// IMPORTANT : helmet (configure dans server.js) ajoute par defaut
// Cross-Origin-Resource-Policy: same-origin + un CSP restrictif. Pour
// les ressources de partage social, on doit les rendre cross-origin
// (les images sont fetched par FB/WhatsApp/Twitter depuis leurs serveurs)
// et sans CSP qui pourrait gener les scrapers / iframes d'apercu.
router.use((req, res, next) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin')
    res.set('Cross-Origin-Opener-Policy', 'unsafe-none')
    res.set('Cross-Origin-Embedder-Policy', 'unsafe-none')
    // CORS public : ces ressources sont conçues pour etre scrapees par
    // n'importe quel client social (WhatsApp Web depuis web.whatsapp.com,
    // FB depuis facebook.com, etc.). Sans cette ligne, le CORS limite a
    // goomufulo.com empechait les scrapers cote browser de lire le HTML
    // et de generer l'apercu.
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
    res.set('Access-Control-Allow-Headers', '*')
    // Retirer le CSP restrictif pour cette route
    res.removeHeader('Content-Security-Policy')
    next()
})

// Charge satori + resvg en lazy require (lourd a charger, evite de penaliser
// le startup quand personne ne partage)
let _satori = null
let _resvg = null
async function loadDeps() {
    if (!_satori) _satori = (await import('satori')).default
    if (!_resvg) _resvg = require('@resvg/resvg-js')
    return { satori: _satori, resvg: _resvg }
}

// Fontes : chargees une fois, gardees en memoire
const FONTS_DIR = path.join(__dirname, '..', 'assets', 'fonts')
const FONTS = (() => {
    try {
        return [
            { name: 'PlayfairDisplay', data: fs.readFileSync(path.join(FONTS_DIR, 'PlayfairDisplay-Bold.ttf')), weight: 700, style: 'normal' },
            { name: 'SourceSans3', data: fs.readFileSync(path.join(FONTS_DIR, 'SourceSans3-Regular.ttf')), weight: 400, style: 'normal' },
            { name: 'SourceSans3', data: fs.readFileSync(path.join(FONTS_DIR, 'SourceSans3-Bold.ttf')), weight: 700, style: 'normal' }
        ]
    } catch (err) {
        console.error('[share] Impossible de charger les fontes:', err.message)
        return []
    }
})()

// Cache en memoire des PNG generes (cle = id du mot)
const _imageCache = new Map()
const IMAGE_TTL_MS = 24 * 60 * 60 * 1000

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://goomufulo.com'

function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function pickDomainLabel(word) {
    if (Array.isArray(word.domains) && word.domains.length > 0) return word.domains[0]
    return word.domain || ''
}

// Construit l'arbre JSX-like consomme par satori (objets bruts, pas du JSX)
function buildOgTree(word) {
    const fulfulde = word.word || ''
    const domain = pickDomainLabel(word).toUpperCase()
    const fr = word.translation_fr || ''
    const en = word.translation_en || ''
    const ff = word.translation_ff || ''

    const COLOR_BG = '#FDF8F0'        // cream
    const COLOR_GOLD = '#D4A537'      // primary-gold
    const COLOR_DARK = '#1A1A2E'      // primary-dark
    const COLOR_GRAY = '#3A3A3A'      // dark-gray
    const COLOR_BURGUNDY = '#8B2942'  // secondary-burgundy

    return {
        type: 'div',
        props: {
            style: {
                width: '1200px',
                height: '630px',
                display: 'flex',
                flexDirection: 'column',
                background: COLOR_BG,
                padding: '60px 70px',
                fontFamily: 'SourceSans3',
                position: 'relative'
            },
            children: [
                // Bande or en haut
                {
                    type: 'div',
                    props: {
                        style: {
                            position: 'absolute', top: 0, left: 0, right: 0, height: '8px',
                            background: COLOR_GOLD, display: 'flex'
                        }
                    }
                },
                // Header : badge domaine + branding
                {
                    type: 'div',
                    props: {
                        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
                        children: [
                            domain ? {
                                type: 'div',
                                props: {
                                    style: {
                                        display: 'flex', alignItems: 'center',
                                        background: '#fff', color: COLOR_BURGUNDY,
                                        padding: '8px 18px', borderRadius: '999px',
                                        fontSize: '20px', fontWeight: 700,
                                        letterSpacing: '0.05em',
                                        border: '1px solid #E8E6E1'
                                    },
                                    children: domain
                                }
                            } : { type: 'div', props: { style: { display: 'flex' }, children: '' } },
                            {
                                type: 'div',
                                props: {
                                    style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
                                    children: [
                                        {
                                            type: 'div',
                                            props: {
                                                style: { color: COLOR_DARK, fontSize: '22px', fontWeight: 700, fontFamily: 'PlayfairDisplay' },
                                                children: 'Goomu Fulo & Wiɗto'
                                            }
                                        },
                                        {
                                            type: 'div',
                                            props: {
                                                style: { color: COLOR_GOLD, fontSize: '14px', fontWeight: 700, letterSpacing: '0.18em', marginTop: '4px' },
                                                children: 'ACADÉMIE GFW'
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },
                // Centre : le mot en grand
                {
                    type: 'div',
                    props: {
                        style: {
                            flex: 1, display: 'flex', flexDirection: 'column',
                            justifyContent: 'center', alignItems: 'center',
                            textAlign: 'center', padding: '20px 0'
                        },
                        children: [
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        fontFamily: 'PlayfairDisplay',
                                        fontSize: fulfulde.length > 18 ? '88px' : '120px',
                                        fontWeight: 700,
                                        color: COLOR_GOLD,
                                        lineHeight: 1.1,
                                        maxWidth: '1060px',
                                        textAlign: 'center',
                                        display: 'flex'
                                    },
                                    children: fulfulde
                                }
                            },
                            ff && ff !== fulfulde ? {
                                type: 'div',
                                props: {
                                    style: { color: COLOR_GRAY, fontSize: '24px', marginTop: '14px', fontStyle: 'italic', display: 'flex', maxWidth: '1000px', textAlign: 'center' },
                                    children: ff
                                }
                            } : { type: 'div', props: { style: { display: 'flex' }, children: '' } }
                        ]
                    }
                },
                // Bas : traductions FR/EN
                {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex', flexDirection: 'column', gap: '14px',
                            background: '#fff', borderRadius: '16px',
                            padding: '24px 32px', border: '1px solid #E8E6E1',
                            width: '100%'
                        },
                        children: [
                            fr ? {
                                type: 'div',
                                props: {
                                    style: { display: 'flex', alignItems: 'flex-start', gap: '16px' },
                                    children: [
                                        {
                                            type: 'div',
                                            props: {
                                                style: { background: '#2563EB', color: '#fff', padding: '4px 12px', borderRadius: '999px', fontSize: '18px', fontWeight: 700, flexShrink: 0, display: 'flex' },
                                                children: 'FR'
                                            }
                                        },
                                        {
                                            type: 'div',
                                            props: {
                                                style: { color: COLOR_DARK, fontSize: '28px', flex: 1, display: 'flex', lineHeight: 1.3 },
                                                children: fr
                                            }
                                        }
                                    ]
                                }
                            } : { type: 'div', props: { style: { display: 'flex' }, children: '' } },
                            en ? {
                                type: 'div',
                                props: {
                                    style: { display: 'flex', alignItems: 'flex-start', gap: '16px' },
                                    children: [
                                        {
                                            type: 'div',
                                            props: {
                                                style: { background: '#10B981', color: '#fff', padding: '4px 12px', borderRadius: '999px', fontSize: '18px', fontWeight: 700, flexShrink: 0, display: 'flex' },
                                                children: 'EN'
                                            }
                                        },
                                        {
                                            type: 'div',
                                            props: {
                                                style: { color: COLOR_DARK, fontSize: '28px', flex: 1, display: 'flex', lineHeight: 1.3 },
                                                children: en
                                            }
                                        }
                                    ]
                                }
                            } : { type: 'div', props: { style: { display: 'flex' }, children: '' } }
                        ]
                    }
                },
                // Footer : URL
                {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex', justifyContent: 'center', marginTop: '24px',
                            color: COLOR_GRAY, fontSize: '20px'
                        },
                        children: 'goomufulo.com/dictionnaire'
                    }
                }
            ]
        }
    }
}

async function generateImage(word) {
    if (FONTS.length === 0) throw new Error('Fontes non chargees')
    const { satori, resvg } = await loadDeps()
    const tree = buildOgTree(word)
    const svg = await satori(tree, { width: 1200, height: 630, fonts: FONTS })
    // background opaque cream pour eviter le canal alpha qui pose probleme
    // a certains clients (WhatsApp inclus). Ratio 1.91:1 = format OG ideal.
    const png = new resvg.Resvg(svg, {
        fitTo: { mode: 'width', value: 1200 },
        background: '#FDF8F0'
    }).render().asPng()
    return png
}

// GET /share/word/:id/preview.png — nouveau path pour bypasser le
// cache Cloudflare qui servait encore les anciennes versions avec
// les mauvais headers (CSP restrictif, pas de CORS). Aliases gardes
// pour les anciens partages qui ont les anciennes URLs en cache.
router.get(['/word/:id/preview.png', '/word/:id/og.png', '/word/:id/image.png'], validateId, async (req, res) => {
    try {
        const id = req.params.id
        const now = Date.now()
        const cached = _imageCache.get(id)
        if (cached && (now - cached.at) < IMAGE_TTL_MS) {
            res.set('Content-Type', 'image/png')
            res.set('Cache-Control', 'public, max-age=86400, immutable')
            return res.send(cached.png)
        }

        const r = await query('SELECT * FROM dictionary WHERE id = $1', [id])
        if (r.rows.length === 0) return res.status(404).send('Not found')
        const word = r.rows[0]
        // Charger les domaines depuis la pivot si disponible
        try {
            const d = await query('SELECT domain FROM dictionary_domains WHERE dictionary_id = $1 ORDER BY domain', [id])
            word.domains = d.rows.map(x => x.domain)
        } catch (_) { /* table peut ne pas exister, on ignore */ }

        const png = await generateImage(word)
        _imageCache.set(id, { png, at: now })
        res.set('Content-Type', 'image/png')
        res.set('Cache-Control', 'public, max-age=86400, immutable')
        res.send(png)
    } catch (err) {
        console.error('[share] Erreur generation image:', err)
        res.status(500).send('Erreur generation image')
    }
})

// GET /share/word/:id
// Renvoie une page HTML avec balises Open Graph. Les bots FB/WhatsApp les
// lisent pour generer l'apercu. Les vrais utilisateurs sont rediriges vers
// la page dictionnaire via meta refresh + JS.
router.get('/word/:id', validateId, async (req, res) => {
    try {
        const id = req.params.id
        const r = await query('SELECT * FROM dictionary WHERE id = $1', [id])
        if (r.rows.length === 0) return res.status(404).send('Mot non trouve')
        const word = r.rows[0]

        const title = `${word.word} — Dictionnaire Pulaar/Fulfulde`
        const descParts = []
        if (word.translation_fr) descParts.push('🇫🇷 ' + word.translation_fr)
        if (word.translation_en) descParts.push('🇬🇧 ' + word.translation_en)
        const description = descParts.join(' · ') || 'Découvrez ce mot sur le dictionnaire Goomu Fulo & Wiɗto.'

        const imageUrl = `${PUBLIC_BASE_URL}/share/word/${id}/preview.png`
        const canonicalUrl = `${PUBLIC_BASE_URL}/dictionnaire?word=${encodeURIComponent(word.word)}`

        res.set('Cache-Control', 'public, max-age=3600')
        res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(canonicalUrl)}">

<!-- Open Graph (Facebook, WhatsApp, LinkedIn) -->
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${escapeHtml(imageUrl)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${escapeHtml(canonicalUrl)}">
<meta property="og:site_name" content="Goomu Fulo & Wiɗto">

<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(imageUrl)}">

<!-- IMPORTANT : surtout PAS de <meta http-equiv="refresh"> ici.
     Les scrapers Facebook/WhatsApp suivent les meta refresh < 1s et
     scrapent alors la page de destination (la SPA React) qui n'a pas
     les balises OG specifiques. Pour rediriger les humains on utilise
     uniquement du JS (les bots n'executent pas le JS). -->
<style>
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#FDF8F0;color:#1A1A2E;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px}
img{max-width:100%;height:auto;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,0.1)}
a.cta{display:inline-block;background:linear-gradient(135deg,#D4A537,#B8860B);color:#fff;padding:14px 28px;border-radius:50px;font-weight:700;margin-top:24px;font-size:16px;text-decoration:none;box-shadow:0 4px 12px rgba(212,165,55,0.3)}
a.cta:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(212,165,55,0.4)}
</style>
</head>
<body>
<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(word.word)}">
<a class="cta" href="${escapeHtml(canonicalUrl)}">Voir dans le dictionnaire →</a>
<script>
// Redirection JS pour les humains uniquement (les bots ne l'executent pas).
// Delai 1.5s pour laisser le temps de voir la jolie image avant redirection.
setTimeout(function(){location.href=${JSON.stringify(canonicalUrl)}}, 1500);
</script>
</body>
</html>`)
    } catch (err) {
        console.error('[share] Erreur page partage:', err)
        res.status(500).send('Erreur')
    }
})

module.exports = router
