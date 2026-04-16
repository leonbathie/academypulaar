import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../config'
import './Hero.css'

// Slides par défaut si aucune n'est configurée en base
const defaultSlides = [
    {
        image: "https://images.unsplash.com/photo-1568667256549-094345857637?w=1920",
        title_fr: null,
        title_en: null,
        title_ff: null,
        titleKey: "hero.title2"
    },
    {
        image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1920",
        title_fr: null,
        title_en: null,
        title_ff: null,
        titleKey: "hero.title3",
        subtitleKey: "hero.subtitle3"
    }
]

function Hero() {
    const { t, i18n } = useTranslation()
    const [currentSlide, setCurrentSlide] = useState(0)
    const [scholar, setScholar] = useState(null)
    const [slides, setSlides] = useState(defaultSlides)
    const [slidesLoaded, setSlidesLoaded] = useState(false)
    const [bioExpanded, setBioExpanded] = useState(false)
    const lang = ['fr', 'en', 'ff'].includes(i18n.language) ? i18n.language : 'fr'

    // Charger les slides depuis l'API
    useEffect(() => {
        const loadSlides = async () => {
            try {
                const res = await fetch(`${API_URL}/api/hero`)
                if (!res.ok) return
                const data = await res.json()
                if (Array.isArray(data) && data.length > 0) {
                    setSlides(data)
                }
            } catch (e) {
                // Utiliser les slides par défaut en cas d'erreur
            } finally {
                setSlidesLoaded(true)
            }
        }
        loadSlides()
    }, [])

    useEffect(() => {
        if (slides.length <= 1) return
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length)
        }, 6000)
        return () => clearInterval(timer)
    }, [slides.length])

    const fetchRandomScholar = useCallback(async (excludeId = null) => {
        try {
            const res = await fetch(`${API_URL}/api/scholars/random`)
            if (!res.ok) return
            const data = await res.json()
            if (!data) return
            // Si même savant renvoyé, retry une fois
            if (excludeId && data.id === excludeId) {
                const res2 = await fetch(`${API_URL}/api/scholars/random`)
                if (res2.ok) {
                    const data2 = await res2.json()
                    if (data2) setScholar(data2)
                }
                return
            }
            setScholar(data)
        } catch (e) {
            // Pas de savant disponible, on ignore
        }
    }, [])

    useEffect(() => {
        fetchRandomScholar()
    }, [fetchRandomScholar])

    const pickAnotherScholar = () => {
        fetchRandomScholar(scholar?.id)
        setBioExpanded(false)
    }

    const goToSlide = (index) => {
        setCurrentSlide(index)
    }

    // Obtenir le titre de la slide courante selon la langue
    const getSlideTitle = (slide) => {
        // Si la slide vient de l'API (a des champs title_fr, etc.)
        if (slide.title_fr || slide.title_en || slide.title_ff) {
            return slide[`title_${lang}`] || slide.title_fr || slide.title_en || ''
        }
        // Sinon, utiliser la clé i18n (slides par défaut)
        if (slide.titleKey) return t(slide.titleKey)
        return ''
    }

    const getSlideSubtitle = (slide) => {
        if (slide.subtitle_fr || slide.subtitle_en || slide.subtitle_ff) {
            return slide[`subtitle_${lang}`] || slide.subtitle_fr || slide.subtitle_en || ''
        }
        if (slide.subtitleKey) return t(slide.subtitleKey)
        return ''
    }

    const getSlideImage = (slide) => {
        // Slide de l'API : image est un chemin relatif
        if (slide.image && slide.image.startsWith('/uploads')) {
            return `${API_URL}${slide.image}`
        }
        // Slide par défaut ou URL complète
        return slide.image || ''
    }

    return (
        <section className="hero">
            <div className="hero-slides">
                {slides.map((slide, index) => (
                    <div
                        key={slide.id || index}
                        className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                        style={{ backgroundImage: `url(${getSlideImage(slide)})` }}
                    >
                        <div className="hero-overlay"></div>
                    </div>
                ))}
            </div>

            <div className="hero-content">
                <div className="hero-text">
                    <span className="hero-badge">{t('common.since')}</span>
                    <h1 className="hero-title">
                        {getSlideTitle(slides[currentSlide])}
                    </h1>
                    {getSlideSubtitle(slides[currentSlide]) && (
                        <p className="hero-subtitle">
                            {getSlideSubtitle(slides[currentSlide])}
                        </p>
                    )}
                    <div className="hero-buttons">
                        <a href="#decouvrir" className="btn btn-primary">
                            {t('common.discover')}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </a>
                        <a href="#dictionnaire" className="btn btn-secondary">
                            {t('hero.consultDictionary')}
                        </a>
                    </div>
                </div>

                <div className="hero-indicators">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            className={`indicator ${index === currentSlide ? 'active' : ''}`}
                            onClick={() => goToSlide(index)}
                            aria-label={`Slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>

            {scholar && (
                <div className="hero-scholar">
                    <div className="hero-scholar-image">
                        <img
                            src={scholar.image ? `${API_URL}${scholar.image}` : `https://via.placeholder.com/300x400/1a1f3a/d4af37?text=${encodeURIComponent(scholar.name)}`}
                            alt={scholar.name}
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x400/1a1f3a/d4af37?text=' + encodeURIComponent(scholar.name) }}
                        />
                    </div>
                    <div className="hero-scholar-info">
                        <span className="hero-scholar-label">{t('scholars.label', 'Patrimoine')}</span>
                        <h3 className="hero-scholar-name">{scholar.name}</h3>
                        <span className="hero-scholar-years">{scholar.years}</span>
                        <p className={`hero-scholar-bio ${bioExpanded ? 'expanded' : ''}`}
                            style={!scholar[`bio_${lang}`] && lang !== 'fr' ? { color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' } : {}}>
                            {scholar[`bio_${lang}`] || (lang !== 'fr' ? t('common.noTranslation') : scholar.bio_fr)}
                        </p>
                        {scholar[`bio_${lang}`] && (
                            <button className="hero-scholar-toggle" onClick={() => setBioExpanded(v => !v)}>
                                {bioExpanded ? t('common.seeLess', 'Voir moins') : t('common.seeMore', 'Voir plus')}
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                    style={{ transform: bioExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </button>
                        )}
                        <button className="hero-scholar-next" onClick={pickAnotherScholar}>
                            {t('scholars.next', 'Découvrir un autre savant')}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
            )}

            <div className="hero-scroll">
                <span>{t('hero.scroll')}</span>
                <svg className="scroll-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 10l6 6 6-6" />
                    <path d="M6 4l6 6 6-6" opacity="0.4" />
                </svg>
            </div>
        </section>
    )
}

export default Hero

