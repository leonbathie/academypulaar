import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../config'
import './Hero.css'

const slides = [
    {
        image: "https://images.unsplash.com/photo-1568667256549-094345857637?w=1920",
        titleKey: "hero.title2"
    },
    {
        image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1920",
        titleKey: "hero.title3",
        subtitleKey: "hero.subtitle3"
    }
]

function ScholarCard({ scholar, lang, t, showNext, onNext, expanded, onToggleExpand }) {
    return (
        <div className="hero-scholar">
            <div className="hero-scholar-image">
                <img
                    src={scholar.image ? `${API_URL}${scholar.image}` : `https://via.placeholder.com/300x400/1a1f3a/d4af37?text=${encodeURIComponent(scholar.name)}`}
                    alt={scholar.name}
                    style={{ objectPosition: scholar.image_position || '50% 20%' }}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x400/1a1f3a/d4af37?text=' + encodeURIComponent(scholar.name) }}
                />
            </div>
            <div className="hero-scholar-info">
                <span className="hero-scholar-label">{t('scholars.label', 'Patrimoine')}</span>
                <h3 className="hero-scholar-name">{scholar.name}</h3>
                <span className="hero-scholar-years">{scholar.years}</span>
                <p
                    className={`hero-scholar-bio ${expanded ? 'expanded' : ''}`}
                    style={!scholar[`bio_${lang}`] && lang !== 'fr' ? { color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' } : {}}
                >
                    {scholar[`bio_${lang}`] || (lang !== 'fr' ? t('common.noTranslation') : scholar.bio_fr)}
                </p>
                {scholar[`bio_${lang}`] && onToggleExpand && (
                    <button className="hero-scholar-toggle" onClick={onToggleExpand}>
                        {expanded ? t('common.seeLess', 'Voir moins') : t('common.seeMore', 'Voir plus')}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </button>
                )}
                {showNext && (
                    <button className="hero-scholar-next" onClick={onNext}>
                        {t('scholars.next', 'Découvrir un autre savant')}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    )
}

function Hero() {
    const { t, i18n } = useTranslation()
    const [currentSlide, setCurrentSlide] = useState(0)
    const [scholars, setScholars] = useState([])
    const [activeIdx, setActiveIdx] = useState(0)
    const [bioExpanded, setBioExpanded] = useState(false)
    const lang = ['fr', 'en', 'ff'].includes(i18n.language) ? i18n.language : 'fr'

    useEffect(() => {
        if (slides.length <= 1) return
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length)
        }, 6000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        fetch(`${API_URL}/api/scholars`)
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    const shuffled = [...data].sort(() => Math.random() - 0.5)
                    setScholars(shuffled)
                }
            })
            .catch(() => {})
    }, [])

    const scholar = scholars[activeIdx] || null
    const scrollRef = useRef(null)

    // Effet rotation cubique au scroll
    useEffect(() => {
        const el = scrollRef.current
        if (!el || scholars.length === 0) return

        const updateCube = () => {
            const W = el.clientWidth
            if (W === 0) return
            const slides = el.querySelectorAll('.hero-scholar-slide')
            slides.forEach((slide, i) => {
                const offset = el.scrollLeft / W - i   // -1..0..1
                const angle = offset * 90               // -90..0..90 degrés
                slide.style.transform = `rotateY(${-angle}deg)`
            })
        }

        el.addEventListener('scroll', updateCube, { passive: true })
        updateCube()
        return () => el.removeEventListener('scroll', updateCube)
    }, [scholars.length])

    const pickNext = () => {
        setBioExpanded(false)
        setActiveIdx(i => (i + 1) % scholars.length)
    }

    return (
        <section className="hero">
            <div className="hero-slides">
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                        style={{ backgroundImage: `url(${slide.image})` }}
                    >
                        <div className="hero-overlay"></div>
                    </div>
                ))}
            </div>

            <div className="hero-content">
                <div className="hero-text">
                    <span className="hero-badge">{t('common.since')}</span>
                    <h1 className="hero-title">
                        {t(slides[currentSlide].titleKey)}
                    </h1>
                    {slides[currentSlide].subtitleKey && (
                        <p className="hero-subtitle">
                            {t(slides[currentSlide].subtitleKey)}
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
                            onClick={() => setCurrentSlide(index)}
                            aria-label={`Slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* Desktop : carte unique avec bouton suivant */}
            {scholar && (
                <ScholarCard
                    scholar={scholar}
                    lang={lang}
                    t={t}
                    showNext={scholars.length > 1}
                    onNext={pickNext}
                    expanded={bioExpanded}
                    onToggleExpand={() => setBioExpanded(v => !v)}
                />
            )}

            {/* Mobile : scroll horizontal avec effet cube */}
            {scholars.length > 0 && (
                <div className="hero-scholars-scroll" ref={scrollRef}>
                    {scholars.map(s => (
                        <div key={s.id} className="hero-scholar-slide">
                            <ScholarCard
                                scholar={s}
                                lang={lang}
                                t={t}
                                showNext={false}
                                onNext={null}
                                expanded={false}
                                onToggleExpand={null}
                            />
                        </div>
                    ))}
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
