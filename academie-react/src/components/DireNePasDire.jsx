import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../config'
import './DireNePasDire.css'

function DireNePasDire() {
    const { t, i18n } = useTranslation()
    const [articles, setArticles] = useState([])
    const [activeIndex, setActiveIndex] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadArticles()
    }, [])

    const loadArticles = async () => {
        try {
            const response = await fetch(`${API_URL}/api/content/dire`)
            if (response.ok) {
                const data = await response.json()
                if (data.length > 0) {
                    // Randomiser l'ordre des articles
                    const shuffled = [...data].sort(() => Math.random() - 0.5)
                    setArticles(shuffled)
                }
            }
        } catch (error) {
            console.error('Error loading dire:', error)
        } finally {
            setLoading(false)
        }
    }

    const getDire = (article) => {
        if (!article) return ""
        switch (i18n.language) {
            case 'en': return article.dire_en || article.dire_fr || article.dire
            case 'ff': return article.dire_ff || article.dire_fr || article.dire
            default: return article.dire_fr || article.dire
        }
    }

    const getNePasDire = (article) => {
        if (!article) return ""
        switch (i18n.language) {
            case 'en': return article.ne_pas_dire_en || article.ne_pas_dire_fr || article.ne_pas_dire
            case 'ff': return article.ne_pas_dire_ff || article.ne_pas_dire_fr || article.ne_pas_dire
            default: return article.ne_pas_dire_fr || article.ne_pas_dire
        }
    }

    const getExplanation = (article) => {
        if (!article) return ""
        switch (i18n.language) {
            case 'en': return article.explanation_en || article.explanation_fr || article.explanation
            case 'ff': return article.explanation_ff || article.explanation_fr || article.explanation
            default: return article.explanation_fr || article.explanation
        }
    }

    const getTabLabel = (article) => {
        const text = getDire(article)
        if (!text) return `#${articles.indexOf(article) + 1}`
        // Prendre les 2 premiers mots pour le label
        const words = text.split(' ')
        if (words.length <= 2) return text
        return words.slice(0, 2).join(' ') + '...'
    }

    const currentArticle = articles[activeIndex] || null

    return (
        <section className="dire-section" id="dire">
            {!loading && articles.length === 0 ? null : (
            <div className="container">
                <div className="dire-layout">
                    <div className="dire-content">
                        <span className="section-label">{t('sayDontSay.sectionLabel')}</span>
                        <h2 className="section-title">
                            {t('sayDontSay.title')} <span className="gold-accent">{t('sayDontSay.titleHighlight')}</span>
                        </h2>
                        <p className="dire-intro">
                            {t('sayDontSay.intro')}
                        </p>

                        {articles.length > 0 && (
                            <div className="dire-tabs">
                                {articles.slice(0, 6).map((article, index) => (
                                    <button
                                        key={index}
                                        className={`dire-tab ${index === activeIndex ? 'active' : ''}`}
                                        onClick={() => setActiveIndex(index)}
                                    >
                                        {getTabLabel(article)}
                                    </button>
                                ))}
                            </div>
                        )}

                        <a href="/dictionnaire" className="btn btn-primary">
                            {t('sayDontSay.discoverSection')}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </a>
                    </div>

                    {currentArticle && (
                        <div className="dire-card">
                            <div className="dire-card-header">
                                <span className="dire-card-category">{currentArticle.category}</span>
                            </div>
                            <div className="dire-card-body">
                                <div className="dire-item dire-item--correct">
                                    <span className="dire-label">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <path d="M5 13l4 4L19 7" />
                                        </svg>
                                        {t('sayDontSay.weSay')}
                                    </span>
                                    <p className="dire-text">{getDire(currentArticle)}</p>
                                </div>
                                <div className="dire-item dire-item--incorrect">
                                    <span className="dire-label">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <path d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        {t('sayDontSay.weDontSay')}
                                    </span>
                                    <p className="dire-text">{getNePasDire(currentArticle)}</p>
                                </div>
                                {getExplanation(currentArticle) && (
                                    <div className="dire-explanation">
                                        <p>{getExplanation(currentArticle)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            )}
        </section>
    )
}

export default DireNePasDire
