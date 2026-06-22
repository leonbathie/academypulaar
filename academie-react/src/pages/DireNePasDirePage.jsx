import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../config'
import './DireNePasDirePage.css'

function DireNePasDirePage() {
    const { t, i18n } = useTranslation()
    const [articles, setArticles] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('all')
    // Une seule carte affichee a la fois ; les autres viennent au hasard.
    const [currentId, setCurrentId] = useState(null)
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

    // Choisir la carte a afficher : priorite au lien partage (#dire-ID),
    // sinon une carte au hasard. Recalcule quand la liste ou le filtre change.
    useEffect(() => {
        if (!filteredArticles.length) { setCurrentId(null); return }
        const m = window.location.hash.match(/^#dire-(\d+)$/)
        if (m && filteredArticles.some(a => String(a.id) === m[1])) {
            setCurrentId(Number(m[1]))
            return
        }
        setCurrentId(prev => (
            filteredArticles.some(a => a.id === prev)
                ? prev
                : filteredArticles[Math.floor(Math.random() * filteredArticles.length)].id
        ))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [articles, selectedCategory])

    const currentArticle = filteredArticles.find(a => a.id === currentId) || filteredArticles[0]

    const showAnother = () => {
        const pool = filteredArticles.filter(a => a.id !== currentId)
        const src = pool.length ? pool : filteredArticles
        if (!src.length) return
        setCurrentId(src[Math.floor(Math.random() * src.length)].id)
    }

    const handleShare = async (article) => {
        const url = `${window.location.origin}/dire#dire-${article.id}`
        const title = `${t('sayDontSay.weSay')} : ${getDire(article)}`
        const text = `✅ ${t('sayDontSay.weSay')} : ${getDire(article)}\n❌ ${t('sayDontSay.weDontSay')} : ${getNePasDire(article)}`
        if (navigator.share) {
            try { await navigator.share({ title, text, url }) } catch { /* annule */ }
            return
        }
        try {
            await navigator.clipboard.writeText(`${text}\n${url}`)
            setCopiedId(article.id)
            setTimeout(() => setCopiedId(c => (c === article.id ? null : c)), 2000)
        } catch { /* presse-papiers indisponible */ }
    }

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
                ) : currentArticle ? (
                    <div className="dire-layout">
                        <aside className="dire-intro-panel">
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

                        <div className="dire-single">
                        <div key={currentArticle.id} id={`dire-${currentArticle.id}`} className="dire-page-card">
                            <div className="dire-page-card-header">
                                {currentArticle.category ? (
                                    <span className="dire-page-category">{translateCategory(currentArticle.category)}</span>
                                ) : <span />}
                                <button
                                    type="button"
                                    className="dire-share-btn"
                                    onClick={() => handleShare(currentArticle)}
                                    aria-label={t('common.share')}
                                    title={t('common.share')}
                                >
                                    {copiedId === currentArticle.id ? (
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
                                    <p className="dire-page-text">{getDire(currentArticle)}</p>
                                </div>
                                <div className="dire-vs" aria-hidden="true"><span /></div>
                                <div className="dire-page-item dire-page-item--incorrect">
                                    <span className="dire-page-label">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <path d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        {t('sayDontSay.weDontSay')}
                                    </span>
                                    <p className="dire-page-text">{getNePasDire(currentArticle)}</p>
                                </div>
                                {getExplanation(currentArticle) && (
                                    <div className="dire-page-explanation">
                                        <p>{getExplanation(currentArticle)}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {filteredArticles.length > 1 && (
                            <button type="button" className="dire-next-btn" onClick={showAnother}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="23 4 23 10 17 10" />
                                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                </svg>
                                {t('sayDontSay.another', 'Voir une autre')}
                            </button>
                        )}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}

export default DireNePasDirePage
