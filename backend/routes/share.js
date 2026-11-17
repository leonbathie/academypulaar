/**
 * Partage social des mots du dictionnaire.
 *
 *   GET /share/word/:id             -> HTML avec balises Open Graph
 *                                      (consomme par les scrapers Facebook,
 *                                      WhatsApp, Twitter, etc.) + redirection
 *                                      auto vers /dictionnaire?word=X pour
 *                                      les vrais utilisateurs.
 *
 *   GET /share/word/:id/card-v2.png -> Image PNG portrait generee a la volee
 *                                      via satori + resvg (avec aliases legacy).
 */
const express = require('express')
const fs = require('fs')
const path = require('path')
const { query } = require('../database')
const { validateId } = require('../middleware/auth')
const { UPLOADS_ROOT, sniffMimeFromFile } = require('../utils/uploadHelper')

const router = express.Router()

router.use((req, res, next) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin')
    res.set('Cross-Origin-Opener-Policy', 'unsafe-none')
    res.set('Cross-Origin-Embedder-Policy', 'unsafe-none')
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
    res.set('Access-Control-Allow-Headers', '*')
    res.removeHeader('Content-Security-Policy')
    next()
})

let _satori = null
let _resvg = null
async function loadDeps() {
    if (!_satori) _satori = (await import('satori')).default
    if (!_resvg) _resvg = require('@resvg/resvg-js')
    return { satori: _satori, resvg: _resvg }
}

const FONTS_DIR = path.join(__dirname, '..', 'assets', 'fonts')
const FONTS = (() => {
    try {
        return [
            { name: 'NotoSerif', data: fs.readFileSync(path.join(FONTS_DIR, 'NotoSerif-Bold.ttf')), weight: 700, style: 'normal' },
            { name: 'NotoSans',  data: fs.readFileSync(path.join(FONTS_DIR, 'NotoSans-Regular.ttf')), weight: 400, style: 'normal' },
            { name: 'NotoSans',  data: fs.readFileSync(path.join(FONTS_DIR, 'NotoSans-Bold.ttf')),    weight: 700, style: 'normal' }
        ]
    } catch (err) {
        console.error('[share] Impossible de charger les fontes:', err.message)
        return []
    }
})()

const _imageCache = new Map()
const IMAGE_TTL_MS = 24 * 60 * 60 * 1000
const MAX_CACHE_ENTRIES = 200

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://goomufulo.com'

const DOMAIN_LABELS = {
    scientifique: 'Noms Scientifiques',
    mathematiques: 'Mathématiques & Physique',
    biologie: 'Biologie & Médecine',
    philosophie: 'Philosophie & Psychologie',
    economie: 'Économie & Commerce',
    droit: 'Droit',
    astronomie: 'Astronomie',
    informatique: 'Informatique',
    botanique: 'Arbres & Plantes',
    vivants: 'Êtres Vivants',
    elevage: 'Élevage',
    agriculture: 'Agriculture',
    peche: 'Pêche',
    forge: 'Forge & Bijouterie',
    dictionnaire: 'Éducation',
    general: 'Général',
    religion: 'Religion & Spiritualité',
    finance: 'Finance & Banque',
    sport: 'Sport & Jeux',
    politique: 'Politique & Administration',
    histoire: 'Histoire & Géographie',
    art_culture: 'Art, Musique & Culture',
    medias: 'Médias & Communication',
    chimie: 'Chimie',
    alimentation: 'Cuisine & Alimentation',
    transport: 'Transport & Météorologie'
}

function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

/**
 * Normalise un texte en paragraphes propres :
 * - Supprime les retours à la ligne simples accidentels (copier-coller PDF / WhatsApp)
 *   pour éviter les lignes coupées prématurément, tout en conservant les doubles sauts
 *   de ligne (\n\n) comme vrais paragraphes.
 */
function normalizeParagraphs(raw) {
    if (!raw) return []
    return String(raw)
        .normalize('NFC')
        .replace(/\r\n/g, '\n')
        .split(/\n{2,}/)
        .map(block => block.replace(/\n+/g, ' ').replace(/[ \t]+/g, ' ').trim())
        .filter(Boolean)
}

function normalizeInline(raw) {
    return normalizeParagraphs(raw).join(' ')
}

function pickDomainLabels(word) {
    const rawList = Array.isArray(word.domains) && word.domains.length > 0
        ? word.domains
        : (word.domain ? [word.domain] : [])
    return rawList
        .filter(Boolean)
        .slice(0, 2)
        .map(d => (DOMAIN_LABELS[d] || d).toUpperCase())
}

const LOGO_BASE64 = (() => {
    try {
        const buf = fs.readFileSync(path.join(__dirname, '..', 'assets', 'logo-academie.png'))
        return 'data:image/png;base64,' + buf.toString('base64')
    } catch (err) {
        console.error('[share] Impossible de charger le logo:', err.message)
        return null
    }
})()

function loadWordImageDataUri(word) {
    if (!word || !word.image || typeof word.image !== 'string') return null
    try {
        const rel = word.image.replace(/^\/+/, '').replace(/^uploads[\\/]/, '')
        const abs = path.resolve(UPLOADS_ROOT, rel)
        if (!abs.startsWith(UPLOADS_ROOT + path.sep) || !fs.existsSync(abs)) return null
        const stat = fs.statSync(abs)
        if (!stat.isFile() || stat.size > 6 * 1024 * 1024) return null
        const mime = sniffMimeFromFile(abs)
        // Satori supporte nativement PNG et JPEG en data URI
        if (mime !== 'image/jpeg' && mime !== 'image/png') return null
        const buf = fs.readFileSync(abs)
        return `data:${mime};base64,${buf.toString('base64')}`
    } catch (_) {
        return null
    }
}

/**
 * Construit l'arbre Satori (largeur 1080, hauteur adaptative >= 1350) avec
 * paragraphe justifié bord à bord (textAlign: 'justify'), icône SVG vectorielle
 * (sans carré manquant) et mise en page éditoriale soignée.
 */
function buildOgCard(word) {
    const fulfulde = normalizeInline(word.word || '')
    const domains = pickDomainLabels(word)
    const fr = normalizeInline(word.translation_fr || '')
    const en = normalizeInline(word.translation_en || '')
    const rawFfParagraphs = normalizeParagraphs(word.translation_ff || '')
    const ffParagraphs = rawFfParagraphs.filter(p => p.toLowerCase() !== fulfulde.toLowerCase())
    const ffTotalLen = ffParagraphs.reduce((acc, p) => acc + p.length, 0)
    const wordImgUri = loadWordImageDataUri(word)

    const COLOR_BG = '#FDF8F0'
    const COLOR_GOLD = '#D4A537'
    const COLOR_GOLD_DARK = '#B8860B'
    const COLOR_DARK = '#1A1A2E'
    const COLOR_TEXT = '#2C2C3A'
    const COLOR_BURGUNDY = '#8B2942'

    // Taille du titre adaptée à la longueur du mot et à la densité du paragraphe
    const hasLongBody = ffTotalLen > 240 || Boolean(wordImgUri)
    const titleFontSize = fulfulde.length > 26 ? 68
        : fulfulde.length > 18 ? 86
        : hasLongBody ? 98
        : 122

    // Taille de police adaptative du paragraphe Fulfulde pour une lisibilité optimale
    const paraFontSize = ffTotalLen > 650 ? 25
        : ffTotalLen > 420 ? 28
        : ffTotalLen > 200 ? 31
        : 34

    // Calcul de hauteur dynamique afin qu'aucun paragraphe long ne soit tronqué
    const titleLinesEst = Math.max(1, Math.ceil((fulfulde.length * titleFontSize * 0.56) / 900))
    const charsPerLine = Math.max(28, Math.floor(900 / (paraFontSize * 0.53)))
    const paraLinesEst = ffParagraphs.reduce(
        (sum, p) => sum + Math.max(1, Math.ceil(p.length / charsPerLine)),
        0
    )
    const transHeightEst = (fr ? Math.ceil(fr.length / 38) * 46 + 28 : 0)
        + (en ? Math.ceil(en.length / 38) * 46 + 28 : 0)
        + ((fr || en) ? 72 : 0)
    const imgHeightEst = wordImgUri ? 280 : 0

    const estimatedContentHeight =
        190 + // header + top padding
        (domains.length ? 76 : 24) +
        imgHeightEst +
        (titleLinesEst * titleFontSize * 1.12) + 40 +
        (paraLinesEst > 0 ? (paraLinesEst * paraFontSize * 1.56) + (ffParagraphs.length * 18) + 36 : 24) +
        transHeightEst +
        130 // footer

    const height = Math.max(1350, Math.min(2100, Math.ceil(estimatedContentHeight / 10) * 10))

    // Icône lien/globe en pur SVG (évite le glyphe manquant ▯ sur NotoSans)
    const linkSvgIcon = {
        type: 'svg',
        props: {
            width: 24,
            height: 24,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: '#F2D88A',
            strokeWidth: 2.2,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            children: [
                { type: 'circle', props: { cx: '12', cy: '12', r: '10' } },
                { type: 'path', props: { d: 'M2 12h20' } },
                { type: 'path', props: { d: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' } }
            ]
        }
    }

    const tree = {
        type: 'div',
        props: {
            style: {
                width: '1080px',
                height: `${height}px`,
                display: 'flex',
                flexDirection: 'column',
                background: COLOR_BG,
                padding: '66px 74px 56px',
                fontFamily: 'NotoSans',
                position: 'relative'
            },
            children: [
                // Bandeau supérieur doré
                {
                    type: 'div',
                    props: {
                        style: {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '14px',
                            background: `linear-gradient(90deg, ${COLOR_GOLD_DARK} 0%, #F2D88A 50%, ${COLOR_GOLD_DARK} 100%)`,
                            display: 'flex'
                        }
                    }
                },
                // Cadre filet doré subtil autour de la carte
                {
                    type: 'div',
                    props: {
                        style: {
                            position: 'absolute',
                            top: '28px',
                            left: '28px',
                            right: '28px',
                            bottom: '28px',
                            border: '1.5px solid rgba(212, 165, 55, 0.32)',
                            borderRadius: '24px',
                            display: 'flex'
                        }
                    }
                },

                // En-tête : logo + identité Académie GFW
                {
                    type: 'div',
                    props: {
                        style: { display: 'flex', alignItems: 'center', gap: '22px', width: '100%' },
                        children: [
                            LOGO_BASE64 ? {
                                type: 'img',
                                props: {
                                    src: LOGO_BASE64,
                                    width: 86,
                                    height: 86,
                                    style: { borderRadius: '18px' }
                                }
                            } : { type: 'div', props: { style: { display: 'flex' }, children: '' } },
                            {
                                type: 'div',
                                props: {
                                    style: { display: 'flex', flexDirection: 'column' },
                                    children: [
                                        {
                                            type: 'div',
                                            props: {
                                                style: {
                                                    color: COLOR_DARK,
                                                    fontSize: '32px',
                                                    fontWeight: 700,
                                                    fontFamily: 'NotoSerif',
                                                    lineHeight: 1.15
                                                },
                                                children: 'Goomu Fulo & Wiɗto'
                                            }
                                        },
                                        {
                                            type: 'div',
                                            props: {
                                                style: {
                                                    color: COLOR_GOLD_DARK,
                                                    fontSize: '17px',
                                                    fontWeight: 700,
                                                    letterSpacing: '0.22em',
                                                    marginTop: '6px'
                                                },
                                                children: 'ACADÉMIE GFW'
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },

                // Badges de domaine
                domains.length > 0 ? {
                    type: 'div',
                    props: {
                        style: { display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '34px' },
                        children: domains.map(dom => ({
                            type: 'div',
                            props: {
                                style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: '#FFFFFF',
                                    color: COLOR_BURGUNDY,
                                    padding: '10px 26px',
                                    borderRadius: '999px',
                                    fontSize: '22px',
                                    fontWeight: 700,
                                    letterSpacing: '0.07em',
                                    border: '2px solid rgba(139, 41, 66, 0.22)'
                                },
                                children: dom
                            }
                        }))
                    }
                } : { type: 'div', props: { style: { display: 'flex', marginTop: '16px' }, children: '' } },

                // Zone centrale : image optionnelle + terme Fulfulde + paragraphe justifié
                {
                    type: 'div',
                    props: {
                        style: {
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'stretch',
                            padding: '28px 0',
                            width: '100%'
                        },
                        children: [
                            wordImgUri ? {
                                type: 'div',
                                props: {
                                    style: {
                                        display: 'flex',
                                        justifyContent: 'center',
                                        marginBottom: '26px',
                                        width: '100%'
                                    },
                                    children: [{
                                        type: 'img',
                                        props: {
                                            src: wordImgUri,
                                            height: 230,
                                            style: {
                                                borderRadius: '20px',
                                                objectFit: 'cover',
                                                maxWidth: '932px',
                                                border: '2px solid rgba(212, 165, 55, 0.35)'
                                            }
                                        }
                                    }]
                                }
                            } : { type: 'div', props: { style: { display: 'flex' }, children: '' } },

                            {
                                type: 'div',
                                props: {
                                    style: {
                                        fontFamily: 'NotoSerif',
                                        fontSize: `${titleFontSize}px`,
                                        fontWeight: 700,
                                        color: COLOR_GOLD,
                                        lineHeight: 1.08,
                                        width: '100%',
                                        display: 'flex',
                                        textAlign: 'left'
                                    },
                                    children: fulfulde
                                }
                            },

                            // Filet doré décoratif sous le mot lorsqu'une définition suit
                            ffParagraphs.length > 0 ? {
                                type: 'div',
                                props: {
                                    style: {
                                        width: '96px',
                                        height: '4px',
                                        borderRadius: '4px',
                                        background: COLOR_GOLD,
                                        opacity: 0.55,
                                        marginTop: '22px',
                                        marginBottom: '6px',
                                        display: 'flex'
                                    }
                                }
                            } : { type: 'div', props: { style: { display: 'flex' }, children: '' } },

                            // Paragraphe(s) de définition Fulfulde justifiés bord à bord
                            ...(ffParagraphs.length > 0
                                ? ffParagraphs.map((para, idx) => ({
                                    type: 'div',
                                    props: {
                                        style: {
                                            color: COLOR_TEXT,
                                            fontSize: `${paraFontSize}px`,
                                            lineHeight: 1.54,
                                            marginTop: idx === 0 ? '18px' : '16px',
                                            width: '100%',
                                            display: 'flex',
                                            textAlign: 'justify'
                                        },
                                        children: para
                                    }
                                }))
                                : [])
                        ]
                    }
                },

                // Carte blanche des équivalents FR / EN
                (fr || en) ? {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '18px',
                            background: '#FFFFFF',
                            borderRadius: '24px',
                            padding: '32px 40px',
                            border: '1.5px solid #E8E2D5',
                            width: '100%',
                            boxShadow: '0 6px 20px rgba(26, 26, 46, 0.06)'
                        },
                        children: [
                            fr ? {
                                type: 'div',
                                props: {
                                    style: { display: 'flex', alignItems: 'center', gap: '20px', width: '100%' },
                                    children: [
                                        {
                                            type: 'div',
                                            props: {
                                                style: {
                                                    background: '#2563EB',
                                                    color: '#FFFFFF',
                                                    padding: '7px 18px',
                                                    borderRadius: '999px',
                                                    fontSize: '22px',
                                                    fontWeight: 700,
                                                    flexShrink: 0,
                                                    display: 'flex'
                                                },
                                                children: 'FR'
                                            }
                                        },
                                        {
                                            type: 'div',
                                            props: {
                                                style: {
                                                    color: COLOR_DARK,
                                                    fontSize: fr.length > 80 ? '30px' : '34px',
                                                    fontWeight: 400,
                                                    flex: 1,
                                                    display: 'flex',
                                                    lineHeight: 1.38,
                                                    textAlign: fr.length > 75 ? 'justify' : 'left'
                                                },
                                                children: fr
                                            }
                                        }
                                    ]
                                }
                            } : { type: 'div', props: { style: { display: 'flex' }, children: '' } },
                            en ? {
                                type: 'div',
                                props: {
                                    style: { display: 'flex', alignItems: 'center', gap: '20px', width: '100%' },
                                    children: [
                                        {
                                            type: 'div',
                                            props: {
                                                style: {
                                                    background: '#10B981',
                                                    color: '#FFFFFF',
                                                    padding: '7px 18px',
                                                    borderRadius: '999px',
                                                    fontSize: '22px',
                                                    fontWeight: 700,
                                                    flexShrink: 0,
                                                    display: 'flex'
                                                },
                                                children: 'EN'
                                            }
                                        },
                                        {
                                            type: 'div',
                                            props: {
                                                style: {
                                                    color: COLOR_DARK,
                                                    fontSize: en.length > 80 ? '30px' : '34px',
                                                    fontWeight: 400,
                                                    flex: 1,
                                                    display: 'flex',
                                                    lineHeight: 1.38,
                                                    textAlign: en.length > 75 ? 'justify' : 'left'
                                                },
                                                children: en
                                            }
                                        }
                                    ]
                                }
                            } : { type: 'div', props: { style: { display: 'flex' }, children: '' } }
                        ]
                    }
                } : { type: 'div', props: { style: { display: 'flex' }, children: '' } },

                // Pied de carte : pilule sombre avec icône vectorielle propre
                {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: '34px',
                            paddingTop: '22px',
                            borderTop: '1.5px solid rgba(212, 165, 55, 0.35)',
                            width: '100%'
                        },
                        children: [{
                            type: 'div',
                            props: {
                                style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    background: COLOR_DARK,
                                    color: '#FFFFFF',
                                    padding: '15px 34px',
                                    borderRadius: '999px',
                                    fontSize: '22px',
                                    fontWeight: 700,
                                    letterSpacing: '0.05em'
                                },
                                children: [
                                    linkSvgIcon,
                                    {
                                        type: 'div',
                                        props: {
                                            style: { display: 'flex', color: '#FFFFFF' },
                                            children: 'goomufulo.com/dictionnaire'
                                        }
                                    }
                                ]
                            }
                        }]
                    }
                }
            ]
        }
    }

    return { tree, width: 1080, height }
}

async function generateImage(word) {
    if (FONTS.length === 0) throw new Error('Fontes non chargees')
    const { satori, resvg } = await loadDeps()
    const { tree, width, height } = buildOgCard(word)
    const svg = await satori(tree, { width, height, fonts: FONTS })
    const png = new resvg.Resvg(svg, {
        fitTo: { mode: 'width', value: width },
        background: '#FDF8F0'
    }).render().asPng()
    return { png, width, height }
}

router.get(['/word/:id/card-v2.png', '/word/:id/share.png', '/word/:id/card.png', '/word/:id/og.png', '/word/:id/image.png'], validateId, async (req, res) => {
    try {
        const id = req.params.id
        const r = await query('SELECT * FROM dictionary WHERE id = $1', [id])
        if (r.rows.length === 0) return res.status(404).send('Not found')
        const word = r.rows[0]

        try {
            const d = await query('SELECT domain FROM dictionary_domains WHERE dictionary_id = $1 ORDER BY domain', [id])
            word.domains = d.rows.map(x => x.domain)
        } catch (_) { /* table peut ne pas exister */ }

        const versionStamp = word.updated_at ? new Date(word.updated_at).getTime() : 0
        const cacheKey = `${id}:${versionStamp}:${word.image || ''}:${(word.domains || []).join(',')}`
        const now = Date.now()
        const cached = _imageCache.get(cacheKey)
        if (cached && (now - cached.at) < IMAGE_TTL_MS) {
            res.set('Content-Type', 'image/png')
            res.set('Cache-Control', 'public, max-age=3600')
            return res.send(cached.png)
        }

        const { png } = await generateImage(word)
        if (_imageCache.size >= MAX_CACHE_ENTRIES) {
            const oldestKey = _imageCache.keys().next().value
            if (oldestKey) _imageCache.delete(oldestKey)
        }
        _imageCache.set(cacheKey, { png, at: now })
        res.set('Content-Type', 'image/png')
        res.set('Cache-Control', 'public, max-age=3600')
        res.send(png)
    } catch (err) {
        console.error('[share] Erreur generation image:', err)
        res.status(500).send('Erreur generation image')
    }
})

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

        const v = word.updated_at ? new Date(word.updated_at).getTime() : '2'
        const imageUrl = `${PUBLIC_BASE_URL}/share/word/${id}/card-v2.png?v=${v}`
        const canonicalUrl = `${PUBLIC_BASE_URL}/dictionnaire?word=${encodeURIComponent(word.word)}`

        res.set('Cache-Control', 'public, max-age=600')
        res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(canonicalUrl)}">

<!-- Open Graph (Facebook, WhatsApp, LinkedIn) -->
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${escapeHtml(imageUrl)}">
<meta property="og:image:width" content="1080">
<meta property="og:image:height" content="1350">
<meta property="og:url" content="${escapeHtml(canonicalUrl)}">
<meta property="og:site_name" content="Goomu Fulo & Wiɗto">

<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(imageUrl)}">

<style>
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#FDF8F0;color:#1A1A2E;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px;box-sizing:border-box}
img{max-width:min(100%,460px);height:auto;border-radius:18px;box-shadow:0 12px 36px rgba(26,26,46,0.14)}
a.cta{display:inline-block;background:linear-gradient(135deg,#D4A537,#B8860B);color:#fff;padding:14px 28px;border-radius:50px;font-weight:700;margin-top:24px;font-size:16px;text-decoration:none;box-shadow:0 4px 12px rgba(212,165,55,0.3)}
a.cta:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(212,165,55,0.4)}
</style>
</head>
<body>
<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(word.word)}">
<a class="cta" href="${escapeHtml(canonicalUrl)}">Voir dans le dictionnaire →</a>
<script>
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
