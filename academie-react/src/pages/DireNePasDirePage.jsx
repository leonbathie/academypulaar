import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../config'
import './DireNePasDirePage.css'

function DireNePasDirePage() {
    const { t, i18n } = useTranslation()
    const [articles, setArticles] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('all')

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

    return (
        <div className="dire-page">
            <div className="dire-page-header">
                <div className="container">
                    <h1 className="page-title">
                        {t('sayDontSay.title')} <span className="gold-accent">{t('sayDontSay.titleHighlight')}</span>
                    </h1>
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
                    <div className="dire-page-grid">
                        {filteredArticles.map((article) => (
                            <div key={article.id} className="dire-page-card">
                                {article.category && (
                                    <div className="dire-page-card-header">
                                        <span className="dire-page-category">{translateCategory(article.category)}</span>
                                    </div>
                                )}
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
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default DireNePasDirePage
