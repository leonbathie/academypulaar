import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './Hero.css'

// Images Hero : qualite 70 + dimension capee a 1280px (suffit pour 99% des
// ecrans, gain ~50% de taille vs w=1920).
const slides = [
    {
        image: "https://images.unsplash.com/photo-1568667256549-094345857637?w=1280&q=70&auto=format&fit=crop",
        titleKey: "hero.title2"
    },
    {
        image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1280&q=70&auto=format&fit=crop",
        titleKey: "hero.title3",
        subtitleKey: "hero.subtitle3"
    }
]

function Hero() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [currentSlide, setCurrentSlide] = useState(0)
    const [heroSearch, setHeroSearch] = useState('')

    useEffect(() => {
        if (slides.length <= 1) return
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % slides.length)
        }, 6000)
        return () => clearInterval(timer)
    }, [])

    const submitHeroSearch = (e) => {
        e.preventDefault()
        const q = heroSearch.trim()
        navigate(q ? `/dictionnaire?search=${encodeURIComponent(q)}` : '/dictionnaire')
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
                    <h1 className="hero-title">{t(slides[currentSlide].titleKey)}</h1>
                    {slides[currentSlide].subtitleKey && (
                        <p className="hero-subtitle">{t(slides[currentSlide].subtitleKey)}</p>
                    )}
                    {/* Petite barre de recherche du dictionnaire, directement dans le Hero */}
                    <form className="hero-search" onSubmit={submitHeroSearch} role="search">
                        <svg className="hero-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            value={heroSearch}
                            onChange={(e) => setHeroSearch(e.target.value)}
                            placeholder={t('dictionary.searchPlaceholder', 'Rechercher un mot…')}
                            aria-label={t('dictionary.searchPlaceholder', 'Rechercher un mot')}
                        />
                        <button type="submit" aria-label={t('common.search', 'Rechercher')}>
                            {t('common.search', 'Rechercher')}
                        </button>
                    </form>

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
