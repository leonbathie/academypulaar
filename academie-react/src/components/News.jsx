import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../config'
import { renderBio } from '../utils/renderBio'
import './News.css'

function News() {
    const { t, i18n } = useTranslation()
    const lang = (i18n.language || 'fr').substring(0, 2)
    const [newsItems, setNewsItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState(null)

    useEffect(() => {
        loadNews()
    }, [])

    // Fermeture de la fiche : Echap + blocage du scroll de fond
    useEffect(() => {
        if (!selected) return
        const onKey = (e) => { if (e.key === 'Escape') setSelected(null) }
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [selected])

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
        switch (lang) {
            case 'en': return item.title_en || item.title_fr || item.title
            case 'ff': return item.title_ff || item.title_fr || item.title
            default: return item.title_fr || item.title
        }
    }

    const getExcerpt = (item) => {
        switch (lang) {
            case 'en': return item.excerpt_en || item.excerpt_fr || item.excerpt
            case 'ff': return item.excerpt_ff || item.excerpt_fr || item.excerpt
            default: return item.excerpt_fr || item.excerpt
        }
    }

    const getContent = (item) => {
        switch (lang) {
            case 'en': return item.content_en || item.content_fr || item.content
            case 'ff': return item.content_ff || item.content_fr || item.content
            default: return item.content_fr || item.content
        }
    }

    const getCategoryLabel = (category) => {
        const categoryMap = {
            'language': 'news.language',
            'publication': 'news.publication',
            'event': 'news.event',
            'general': 'news.general'
        }
        return t(categoryMap[category] || category)
    }

    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'ff' ? 'fr-FR' : 'fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const truncateText = (text, maxLength = 150) => {
        if (!text || text.length <= maxLength) return text
        return text.substring(0, maxLength) + '...'
    }

    // Autres actualites suggerees, tirees au hasard parmi les restantes.
    // Recalcule uniquement quand on change de fiche (pas a chaque rendu).
    const others = useMemo(() => {
        if (!selected) return []
        return newsItems
            .filter((n) => n.id !== selected.id)
            .map((n) => ({ n, r: Math.random() }))
            .sort((a, b) => a.r - b.r)
            .slice(0, 3)
            .map((x) => x.n)
    }, [selected, newsItems])

    // Ne pas afficher la section tant qu'aucune actualite n'est publiee :
    // un bloc vide donne une impression d'abandon. La section apparait
    // automatiquement des qu'une actualite est publiee.
    if (newsItems.length === 0) {
        return null
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
                            const excerpt = getExcerpt(item)
                            return (
                                <article
                                    key={item.id}
                                    className={`news-card news-card--${item.type || 'default'}`}
                                    onClick={() => setSelected(item)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(item) } }}
                                >
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
                                    <p className="news-excerpt">{truncateText(excerpt)}</p>
                                    <span className="news-link">
                                        {t('common.readMore')}
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </span>
                                </article>
                            )
                        })}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--medium-gray)' }}>
                        <p>{t('common.noNewsAvailable')}</p>
                    </div>
                )}
            </div>

            {/* Fiche detail — image en grand a gauche, infos a droite.
                Rendue via portal pour echapper aux contextes d'empilement. */}
            {selected && createPortal(
                <div className="news-modal-overlay" onClick={() => setSelected(null)}>
                    <div
                        className={`news-modal${selected.image ? '' : ' news-modal--noimg'}`}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label={getTitle(selected)}
                    >
                        <button className="news-modal-close" onClick={() => setSelected(null)} aria-label={t('common.close', 'Fermer')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        {selected.image && (
                            <div className="news-modal-img">
                                <img src={`${API_URL}${selected.image}`} alt={getTitle(selected)} />
                            </div>
                        )}

                        <div className="news-modal-body">
                            <div className="news-modal-meta">
                                <span className={`news-category news-category--${selected.type || 'default'}`}>
                                    {getCategoryLabel(selected.category)}
                                </span>
                                <time className="news-date">{formatDate(selected.date)}</time>
                            </div>
                            <h3 className="news-modal-title">{getTitle(selected)}</h3>

                            <div className="news-modal-content">
                                {renderBio(getContent(selected) || getExcerpt(selected) || '')}
                            </div>

                            {(selected.link || selected.contact_email || selected.contact_phone) && (
                                <div className="news-contact">
                                    {selected.link && (
                                        <a href={selected.link} target="_blank" rel="noopener noreferrer" className="news-external-link">
                                            🔗 {t('common.learnMore')}
                                        </a>
                                    )}
                                    {selected.contact_email && (
                                        <a href={`mailto:${selected.contact_email}`} className="news-contact-item">
                                            📧 {selected.contact_email}
                                        </a>
                                    )}
                                    {selected.contact_phone && (
                                        <a href={`tel:${selected.contact_phone}`} className="news-contact-item">
                                            📱 {selected.contact_phone}
                                        </a>
                                    )}
                                </div>
                            )}

                            {others.length > 0 && (
                                <div className="news-modal-others">
                                    <h4 className="news-modal-others-title">{t('news.otherNews', 'Autres actualités')}</h4>
                                    <div className="news-modal-others-list">
                                        {others.map((o) => (
                                            <button
                                                key={o.id}
                                                className="news-modal-other"
                                                onClick={() => setSelected(o)}
                                            >
                                                {o.image && (
                                                    <span className="news-modal-other-img">
                                                        <img src={`${API_URL}${o.image}`} alt={getTitle(o)} />
                                                    </span>
                                                )}
                                                <span className="news-modal-other-text">
                                                    <span className="news-modal-other-date">{formatDate(o.date)}</span>
                                                    <span className="news-modal-other-title">{getTitle(o)}</span>
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </section>
    )
}

export default News
