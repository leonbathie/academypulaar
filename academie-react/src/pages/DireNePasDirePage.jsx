import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../config'
import './DireNePasDirePage.css'

function DireNePasDirePage() {
    const { t, i18n } = useTranslation()
    const [articles, setArticles] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [copiedId, setCopiedId] = useState(null)

    useEffect(() => {
        loadArticles()
    }, [])

    const loadArticles = async () => {
        try {
            const response = await fetch(`${API_URL}/api/content/dire`)
            if (response.ok) {
                const data = await response.json()
                setArticles(data)
            }
        } catch (error) {
            console.error('Error loading dire:', error)
        } finally {
            setLoading(false)
        }
    }

    const lang = (i18n.language || 'fr').substring(0, 2)

    const getDire = (article) => {
        if (!article) return ""
        switch (lang) {
            case 'en': return article.dire_en || article.dire_fr || article.dire
            case 'ff': return article.dire_ff || article.dire_fr || article.dire
            default: return article.dire_fr || article.dire
        }
    }

    const getNePasDire = (article) => {
        if (!article) return ""
        switch (lang) {
            case 'en': return article.ne_pas_dire_en || article.ne_pas_dire_fr || article.ne_pas_dire
            case 'ff': return article.ne_pas_dire_ff || article.ne_pas_dire_fr || article.ne_pas_dire
            default: return article.ne_pas_dire_fr || article.ne_pas_dire
        }
    }

    const getExplanation = (article) => {
        if (!article) return ""
        switch (lang) {
            case 'en': return article.explanation_en || article.explanation_fr || article.explanation
            case 'ff': return article.explanation_ff || article.explanation_fr || article.explanation
            default: return article.explanation_fr || article.explanation
        }
    }

    // Mapping des catégories DB (français) vers clés i18n
    const categoryMap = {
        'Grammaire': 'sayDontSay.catGrammar',
        'Erreurs courantes': 'sayDontSay.catCommon',
        'Emprunts': 'sayDontSay.catBorrowings',
        'Usage incorrect': 'sayDontSay.catIncorrect'
    }

    const translateCategory = (cat) => {
        if (cat === 'all') return t('sayDontSay.allCategories', 'Toutes')
        return categoryMap[cat] ? t(categoryMap[cat], cat) : cat
    }

    // Extraire les catégories uniques
    const categories = ['all', ...new Set(articles.map(a => a.category).filter(Boolean))]

    const filteredArticles = selectedCategory === 'all'
        ? articles
        : articles.filter(a => a.category === selectedCategory)

    // Lien de partage (#dire-ID) : faire defiler jusqu'a la carte ciblee une
    // fois la liste chargee (toutes les cartes sont affichees).
    useEffect(() => {
        if (loading || !filteredArticles.length) return
        const m = window.location.hash.match(/^#dire-(\d+)$/)
        if (!m) return
        const el = document.getElementById(`dire-${m[1]}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, [loading, filteredArticles.length, selectedCategory])

    // Decoupe un texte en lignes tenant dans maxWidth (pour le canvas).
    const wrapLines = (ctx, text, maxWidth) => {
        const words = (text || '').split(/\s+/).filter(Boolean)
        const lines = []
        let line = ''
        for (const w of words) {
            const test = line ? `${line} ${w}` : w
            if (ctx.measureText(test).width > maxWidth && line) {
                lines.push(line)
                line = w
            } else {
                line = test
            }
        }
        if (line) lines.push(line)
        return lines
    }

    // Genere une image (PNG) de la carte aux couleurs de la charte.
    const generateCardImage = async (article) => {
        const W = 1080, H = 1080
        const canvas = document.createElement('canvas')
        canvas.width = W
        canvas.height = H
        const ctx = canvas.getContext('2d')
        try { await document.fonts.ready } catch { /* polices systeme */ }
        const loadImage = (src) => new Promise((resolve) => {
            const im = new Image()
            im.onload = () => resolve(im)
            im.onerror = () => resolve(null)
            im.src = src
        })
        const logo = await loadImage('/logo-academie.png')

        // Fond + cadre + filet dore
        ctx.fillStyle = '#FDF8F0'
        ctx.fillRect(0, 0, W, H)
        ctx.strokeStyle = 'rgba(212,165,55,0.45)'
        ctx.lineWidth = 2
        ctx.strokeRect(44, 44, W - 88, H - 88)
        const bar = ctx.createLinearGradient(44, 0, W - 44, 0)
        bar.addColorStop(0, '#D4A537'); bar.addColorStop(0.5, '#F2D88A'); bar.addColorStop(1, '#D4A537')
        ctx.fillStyle = bar
        ctx.fillRect(44, 44, W - 88, 14)

        const cx = W / 2
        const maxW = W - 280
        let y = 120

        const diamonds = (yy) => {
            ctx.save()
            ctx.fillStyle = '#D4A537'
            ;[-26, 0, 26].forEach((dx, i) => {
                const s = i === 1 ? 9 : 6
                ctx.save(); ctx.translate(cx + dx, yy); ctx.rotate(Math.PI / 4)
                ctx.fillRect(-s, -s, s * 2, s * 2); ctx.restore()
            })
            ctx.restore()
        }

        // Logo en haut, centre
        if (logo && logo.width) {
            const lw = 130
            const lh = logo.height * (lw / logo.width)
            ctx.drawImage(logo, cx - lw / 2, y, lw, lh)
            y += lh + 28
        } else {
            y = 150
        }

        ctx.textAlign = 'center'
        ctx.fillStyle = '#B8860B'
        ctx.font = '700 28px "Source Sans Pro", Arial, sans-serif'
        ctx.fillText('GOOMU FULO E WIƊTO', cx, y)
        y += 44
        diamonds(y)
        y += 78

        const drawBlock = (label, labelColor, value, strike, valueColor) => {
            ctx.textAlign = 'center'
            ctx.fillStyle = labelColor
            ctx.font = '700 30px "Source Sans Pro", Arial, sans-serif'
            ctx.fillText(label.toUpperCase(), cx, y)
            y += 64
            ctx.fillStyle = valueColor
            ctx.font = '600 56px "Playfair Display", Georgia, serif'
            const lines = wrapLines(ctx, value, maxW)
            for (const ln of lines) {
                ctx.fillText(ln, cx, y)
                if (strike) {
                    const w = ctx.measureText(ln).width
                    ctx.strokeStyle = 'rgba(239,68,68,0.6)'
                    ctx.lineWidth = 4
                    ctx.beginPath(); ctx.moveTo(cx - w / 2, y - 16); ctx.lineTo(cx + w / 2, y - 16); ctx.stroke()
                }
                y += 70
            }
        }

        drawBlock(t('sayDontSay.weSay'), '#16a34a', getDire(article), false, '#1A1A2E')
        y += 30
        diamonds(y)
        y += 90
        drawBlock(t('sayDontSay.weDontSay'), '#ef4444', getNePasDire(article), true, '#9A9A9A')

        const explanation = getExplanation(article)
        if (explanation) {
            y += 30
            ctx.fillStyle = '#7A7A7A'
            ctx.font = '400 30px "Source Sans Pro", Arial, sans-serif'
            const lines = wrapLines(ctx, explanation, maxW).slice(0, 3)
            for (const ln of lines) { ctx.fillText(ln, cx, y); y += 42 }
        }

        ctx.fillStyle = '#B8860B'
        ctx.font = '700 26px "Source Sans Pro", Arial, sans-serif'
        ctx.fillText('goomufulo.com', cx, H - 80)

        return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    }

    const handleShare = async (article) => {
        const url = `${window.location.origin}/dire#dire-${article.id}`
        const title = `${t('sayDontSay.weSay')} : ${getDire(article)}`
        const text = `✅ ${t('sayDontSay.weSay')} : ${getDire(article)}\n❌ ${t('sayDontSay.weDontSay')} : ${getNePasDire(article)}`

        // Joindre une image de la carte (partage natif compatible)
        let files
        try {
            const blob = await generateCardImage(article)
            if (blob) {
                const file = new File([blob], `dire-${article.id}.png`, { type: 'image/png' })
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    files = [file]
                }
            }
        } catch { /* generation impossible : partage sans image */ }

        const shareData = files ? { title, text, url, files } : { title, text, url }
        if (navigator.share) {
            try { await navigator.share(shareData) } catch { /* annule */ }
            return
        }
        try {
            await navigator.clipboard.writeText(`${text}\n${url}`)
            setCopiedId(article.id)
            setTimeout(() => setCopiedId(c => (c === article.id ? null : c)), 2000)
        } catch { /* presse-papiers indisponible */ }
    }

    const renderCard = (article) => (
        <div key={article.id} id={`dire-${article.id}`} className="dire-page-card">
            <div className="dire-page-card-header">
                {article.category ? (
                    <span className="dire-page-category">{translateCategory(article.category)}</span>
                ) : <span />}
                <button
                    type="button"
                    className="dire-share-btn"
                    onClick={() => handleShare(article)}
                    aria-label={t('common.share')}
                    title={t('common.share')}
                >
                    {copiedId === article.id ? (
                        <span className="dire-share-copied">{t('common.copied')}</span>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="18" cy="5" r="3" />
                                <circle cx="6" cy="12" r="3" />
                                <circle cx="18" cy="19" r="3" />
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                            </svg>
                            <span>{t('common.share')}</span>
                        </>
                    )}
                </button>
            </div>
            <div className="dire-page-card-body">
                <div className="dire-page-item dire-page-item--correct">
                    <span className="dire-page-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 13l4 4L19 7" />
                        </svg>
                        {t('sayDontSay.weSay')}
                    </span>
                    <p className="dire-page-text">{getDire(article)}</p>
                </div>
                <div className="dire-vs" aria-hidden="true"><span /></div>
                <div className="dire-page-item dire-page-item--incorrect">
                    <span className="dire-page-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {t('sayDontSay.weDontSay')}
                    </span>
                    <p className="dire-page-text">{getNePasDire(article)}</p>
                </div>
                {getExplanation(article) && (
                    <div className="dire-page-explanation">
                        <p>{getExplanation(article)}</p>
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <div className="dire-page">
            <div className="dire-page-header">
                <div className="container">
                    <h1 className="page-title">
                        {t('sayDontSay.title')} <span className="gold-accent">{t('sayDontSay.titleHighlight')}</span>
                    </h1>
                    <div className="dire-divider" aria-hidden="true">
                        <span className="dire-diamond" />
                        <span className="dire-diamond" />
                        <span className="dire-diamond" />
                    </div>
                    <p className="page-subtitle">{t('sayDontSay.intro')}</p>
                </div>
            </div>

            <div className="container">
                {/* Filtres par catégorie */}
                {categories.length > 1 && (
                    <div className="dire-page-filters">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`dire-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {translateCategory(cat)}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="dire-page-loading">
                        <div className="spinner"></div>
                        <p>{t('common.loading', 'Chargement...')}</p>
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="dire-page-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="dire-empty-icon">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <h3>{t('sayDontSay.noArticles')}</h3>
                        <p>{t('sayDontSay.noArticlesDesc')}</p>
                    </div>
                ) : (
                    <>
                        <aside className="dire-intro-panel dire-intro-panel--top">
                            <span className="dire-intro-accent" />
                            <h2 className="dire-intro-title">{t('sayDontSay.whyTitle')}</h2>
                            <p className="dire-intro-text">{t('sayDontSay.whyText')}</p>
                            <ul className="dire-intro-points">
                                {['point1', 'point2', 'point3'].map((p) => (
                                    <li key={p}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <path d="M5 13l4 4L19 7" />
                                        </svg>
                                        {t(`sayDontSay.${p}`)}
                                    </li>
                                ))}
                            </ul>
                        </aside>

                        <div className="dire-grid">
                            {filteredArticles.map((article) => renderCard(article))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default DireNePasDirePage
