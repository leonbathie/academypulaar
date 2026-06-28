import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../config'
import { renderBio } from '../utils/renderBio'
import './News.css'

function News() {
    const { t, i18n } = useTranslation()
    const lang = (i18n.language || 'fr').substring(0, 2)
    const [newsItems, setNewsItems] = useState([])
    const [loading, setLoading] = useState(true)
    // Articles "deplies" via "Lire la suite" (surtout utile sur smartphone)
    const [expanded, setExpanded] = useState({})
    const toggleExpand = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }))
    // Retour visuel "lien copie" apres un partage par presse-papiers
    const [copiedId, setCopiedId] = useState(null)
    // Carrousel : index de l'actualite affichee (mode "une a la fois")
    const [activeIndex, setActiveIndex] = useState(0)
    // "Toutes les actualites" : bascule entre carrousel et liste complete
    const [showAll, setShowAll] = useState(false)

    const handleShare = async (item, imageUrl) => {
        const url = `${window.location.origin}/#actualite-${item.id}`
        const title = getTitle(item)

        // Tenter de joindre l'image affichee comme fichier (partage natif mobile)
        let files
        if (imageUrl) {
            try {
                const res = await fetch(`${API_URL}${imageUrl}`)
                const blob = await res.blob()
                const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
                const file = new File([blob], `actualite-${item.id}.${ext}`, { type: blob.type })
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    files = [file]
                }
            } catch { /* image inaccessible : on partage sans */ }
        }

        const shareData = files
            ? { title, text: title, url, files }
            : { title, text: title, url }

        if (navigator.share) {
            try { await navigator.share(shareData) } catch { /* annule par l'utilisateur */ }
            return
        }
        try {
            await navigator.clipboard.writeText(url)
            setCopiedId(item.id)
            setTimeout(() => setCopiedId((c) => (c === item.id ? null : c)), 2000)
        } catch { /* presse-papiers indisponible */ }
    }

    useEffect(() => {
        loadNews()
    }, [])

    // Lien partage (#actualite-ID) : defile jusqu'a l'article une fois charge.
    useEffect(() => {
        if (loading) return
        const hash = window.location.hash
        if (!hash.startsWith('#actualite-')) return
        const el = document.getElementById(hash.slice(1))
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, [loading])

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

    // Resume : on prefere la langue courante, puis on se rabat sur une autre
    // langue disponible (fr > en > ff) pour qu'une actualite publiee mais non
    // traduite reste visible au lieu d'etre masquee.
    const getExcerpt = (item) =>
        item[`excerpt_${lang}`] || item.excerpt_fr || item.excerpt_en || item.excerpt_ff || item.excerpt || ''

    // Contenu : meme regle de repli que le resume.
    const getContent = (item) =>
        item[`content_${lang}`] || item.content_fr || item.content_en || item.content_ff || item.content || ''

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

    // Un article est affiche des qu'il possede un texte (resume ou contenu)
    // dans AU MOINS une langue (grace au repli ci-dessus). Sinon il est masque.
    const hasLangText = (item) => {
        const content = getContent(item)
        const excerpt = getExcerpt(item)
        return Boolean((content && content.trim()) || (excerpt && excerpt.trim()))
    }

    // Ordre d'affichage tire au hasard a chaque chargement de la liste.
    const ordered = useMemo(() => {
        return newsItems
            .map((n) => ({ n, r: Math.random() }))
            .sort((a, b) => a.r - b.r)
            .map((x) => x.n)
    }, [newsItems])

    const displayItems = ordered.filter(hasLangText)

    // Galerie d'images par actualite (repli sur l'image unique historique).
    const galleries = useMemo(() => {
        const map = {}
        newsItems.forEach((it) => {
            map[it.id] = (it.images && it.images.length)
                ? it.images
                : (it.image ? [it.image] : [])
        })
        return map
    }, [newsItems])

    // Image affichee par actualite. Tirage au hasard initial, puis rotation
    // aleatoire toutes les 3 s pour les galeries de plusieurs images.
    const [currentImg, setCurrentImg] = useState({})
    useEffect(() => {
        const pickRandom = (imgs) => imgs[Math.floor(Math.random() * imgs.length)]

        const init = {}
        Object.entries(galleries).forEach(([id, imgs]) => {
            if (imgs.length) init[id] = pickRandom(imgs)
        })
        setCurrentImg(init)

        const hasMulti = Object.values(galleries).some((imgs) => imgs.length > 1)
        if (!hasMulti) return

        const interval = setInterval(() => {
            setCurrentImg((prev) => {
                const next = { ...prev }
                Object.entries(galleries).forEach(([id, imgs]) => {
                    if (imgs.length > 1) {
                        // une image differente de l'actuelle
                        let pick = prev[id]
                        for (let i = 0; i < 6 && pick === prev[id]; i++) pick = pickRandom(imgs)
                        next[id] = pick
                    }
                })
                return next
            })
        }, 3000)
        return () => clearInterval(interval)
    }, [galleries])

    // Recentrer le carrousel quand la liste change ou qu'on bascule l'affichage
    useEffect(() => { setActiveIndex(0) }, [newsItems.length, showAll])

    // Ne pas afficher la section s'il n'y a aucune actualite a montrer dans la
    // langue courante (rien de publie, ou rien de traduit dans cette langue) :
    // un bloc vide donne une impression d'abandon.
    if (displayItems.length === 0) {
        return null
    }

    const goPrev = () => setActiveIndex(i => (i - 1 + displayItems.length) % displayItems.length)
    const goNext = () => setActiveIndex(i => (i + 1) % displayItems.length)
    const safeIndex = Math.min(activeIndex, displayItems.length - 1)

    const renderArticle = (item) => {
        const img = currentImg[item.id]
        const text = getContent(item) || getExcerpt(item) || ''
        const isLong = (text || '').length > 280
        const isOpen = !!expanded[item.id]
        return (
            <article
                key={item.id}
                id={`actualite-${item.id}`}
                className={`news-row news-row--${item.type || 'default'}${img ? '' : ' news-row--noimg'}`}
            >
                {img && (
                    <div className="news-row-img">
                        <img key={img} src={`${API_URL}${img}`} alt={getTitle(item)} />
                    </div>
                )}
                <div className="news-row-body">
                    <div className="news-row-meta">
                        <span className={`news-category news-category--${item.type || 'default'}`}>
                            {getCategoryLabel(item.category)}
                        </span>
                        <time className="news-date">{formatDate(item.date)}</time>
                        <button
                            type="button"
                            className="news-share"
                            onClick={() => handleShare(item, img)}
                            aria-label={t('common.share')}
                            title={t('common.share')}
                        >
                            {copiedId === item.id ? (
                                <span className="news-share-copied">{t('common.copied')}</span>
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
                    <h3 className="news-row-title">{getTitle(item)}</h3>
                    <div className={`news-row-content${isLong ? (isOpen ? ' news-row-content--scroll' : ' news-row-content--clamp') : ''}`}>
                        {renderBio(text)}
                    </div>
                    {isLong && (
                        <button
                            type="button"
                            className="news-read-more"
                            onClick={() => toggleExpand(item.id)}
                            aria-expanded={isOpen}
                        >
                            {isOpen ? t('common.readLess', 'Lire moins') : t('common.readMore', 'Lire la suite')}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isOpen ? 'is-open' : ''}>
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </button>
                    )}

                    {(item.link || item.contact_email || item.contact_phone) && (
                        <div className="news-contact">
                            {item.link && (
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="news-external-link">
                                    🔗 {t('common.learnMore')}
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
                </div>
            </article>
        )
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
                    {displayItems.length > 1 && (
                        <button type="button" className="news-view-all" onClick={() => setShowAll(s => !s)}>
                            {showAll ? t('news.viewLess', 'Réduire') : t('news.viewAll')}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="spinner"></div>
                    </div>
                ) : showAll ? (
                    <div className="news-list">
                        {displayItems.map((item) => renderArticle(item))}
                    </div>
                ) : (
                    <>
                        <div className="news-carousel">
                            {displayItems.length > 1 && (
                                <button type="button" className="news-arrow news-arrow--prev" onClick={goPrev} aria-label={t('common.previous', 'Précédent')}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
                                </button>
                            )}
                            <div className="news-list news-list--single">
                                {displayItems[safeIndex] && renderArticle(displayItems[safeIndex])}
                            </div>
                            {displayItems.length > 1 && (
                                <button type="button" className="news-arrow news-arrow--next" onClick={goNext} aria-label={t('common.next', 'Suivant')}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 6l6 6-6 6" /></svg>
                                </button>
                            )}
                        </div>
                        {displayItems.length > 1 && (
                            <div className="news-dots">
                                {displayItems.map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className={`news-dot ${i === safeIndex ? 'active' : ''}`}
                                        onClick={() => setActiveIndex(i)}
                                        aria-label={`${t('news.sectionLabel')} ${i + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    )
}

export default News
