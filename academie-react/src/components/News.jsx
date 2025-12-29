import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../config'
import './News.css'

function News() {
    const { t, i18n } = useTranslation()
    const [newsItems, setNewsItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedNews, setExpandedNews] = useState({})

    useEffect(() => {
        loadNews()
    }, [])

    const loadNews = async () => {
        try {
            const response = await fetch(`${API_URL}/api/news?published=true&limit=4`)
            if (response.ok) {
                const data = await response.json()
                setNewsItems(data)
            }
        } catch (error) {
            console.error('Error loading news:', error)
        } finally {
            setLoading(false)
        }
    }

    const getTitle = (item) => {
        switch (i18n.language) {
            case 'en': return item.title_en || item.title_fr || item.title
            case 'ff': return item.title_ff || item.title_fr || item.title
            default: return item.title_fr || item.title
        }
    }

    const getExcerpt = (item) => {
        switch (i18n.language) {
            case 'en': return item.excerpt_en || item.excerpt_fr || item.excerpt
            case 'ff': return item.excerpt_ff || item.excerpt_fr || item.excerpt
            default: return item.excerpt_fr || item.excerpt
        }
    }

    const getContent = (item) => {
        switch (i18n.language) {
            case 'en': return item.content_en || item.content_fr || item.content
            case 'ff': return item.content_ff || item.content_fr || item.content
            default: return item.content_fr || item.content
        }
    }

    const getCategoryLabel = (category) => {
        const categoryMap = {
            'candidacy': 'news.candidacy',
            'election': 'news.election',
            'sayDontSay': 'news.sayDontSay',
            'literaryPrizes': 'news.literaryPrizes',
            'event': 'news.event'
        }
        return t(categoryMap[category] || category)
    }

    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : i18n.language === 'ff' ? 'fr-FR' : 'fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const toggleExpand = (itemId) => {
        setExpandedNews(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }))
    }

    const truncateText = (text, maxLength = 100) => {
        if (!text || text.length <= maxLength) return text
        return text.substring(0, maxLength) + '...'
    }

    return (
        <section className="news" id="actualites">
            <div className="container">
                <div className="news-header">
                    <div className="news-title-group">
                        <span className="section-label">{t('news.sectionLabel')}</span>
                        <h2 className="section-title">
                            {t('news.title')}<span className="gold-accent">{t('news.titleHighlight')}</span>
                        </h2>
                    </div>
                    <a href="#toutes-actualites" className="news-view-all">
                        {t('news.viewAll')}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </a>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="spinner"></div>
                    </div>
                ) : newsItems.length > 0 ? (
                    <div className="news-grid">
                        {newsItems.map((item) => {
                            const isExpanded = expandedNews[item.id]
                            const excerpt = getExcerpt(item)
                            const content = getContent(item)
                            const displayText = isExpanded ? (content || excerpt) : truncateText(excerpt)
                            const hasMoreContent = (content && content.length > 100) || (excerpt && excerpt.length > 100)

                            return (
                                <article key={item.id} className={`news-card news-card--${item.type || 'default'}`}>
                                    {item.image && (
                                        <div className="news-card-image">
                                            <img src={`${API_URL}${item.image}`} alt={getTitle(item)} />
                                        </div>
                                    )}
                                    <div className="news-card-header">
                                        <span className={`news-category news-category--${item.type || 'default'}`}>
                                            {getCategoryLabel(item.category)}
                                        </span>
                                        <time className="news-date">{formatDate(item.date)}</time>
                                    </div>
                                    <h3 className="news-title">{getTitle(item)}</h3>
                                    <p className="news-excerpt">{displayText}</p>
                                    {hasMoreContent && (
                                        <button
                                            className="news-link"
                                            onClick={() => toggleExpand(item.id)}
                                        >
                                            {isExpanded
                                                ? (i18n.language === 'en' ? 'Show less' : 'Réduire')
                                                : t('common.readMore')
                                            }
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d={isExpanded ? "M19 12H5M12 5l-7 7 7 7" : "M5 12h14M12 5l7 7-7 7"} />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Liens et contacts */}
                                    {(item.link || item.contact_email || item.contact_phone) && (
                                        <div className="news-contact">
                                            {item.link && (
                                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="news-external-link">
                                                    🔗 {i18n.language === 'en' ? 'View more' : 'En savoir plus'}
                                                </a>
                                            )}
                                            {item.contact_email && (
                                                <a href={`mailto:${item.contact_email}`} className="news-contact-item">
                                                    📧 {item.contact_email}
                                                </a>
                                            )}
                                            {item.contact_phone && (
                                                <a href={`tel:${item.contact_phone}`} className="news-contact-item">
                                                    📱 {item.contact_phone}
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </article>
                            )
                        })}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--medium-gray)' }}>
                        <p>{i18n.language === 'en' ? 'No news available' : 'Aucune actualité disponible'}</p>
                    </div>
                )}
            </div>
        </section>
    )
}

export default News
