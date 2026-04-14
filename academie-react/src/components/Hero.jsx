import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import scholars from '../data/scholars'
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

function Hero() {
    const { t, i18n } = useTranslation()
    const [currentSlide, setCurrentSlide] = useState(0)
    const [scholar, setScholar] = useState(null)
    const lang = ['fr', 'en', 'ff'].includes(i18n.language) ? i18n.language : 'fr'

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length)
        }, 6000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        setScholar(scholars[Math.floor(Math.random() * scholars.length)])
    }, [])

    const pickAnotherScholar = () => {
        let next = scholars[Math.floor(Math.random() * scholars.length)]
        while (scholars.length > 1 && next.id === scholar?.id) {
            next = scholars[Math.floor(Math.random() * scholars.length)]
        }
        setScholar(next)
    }

    const goToSlide = (index) => {
        setCurrentSlide(index)
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

                {scholar && (
                    <div className="hero-scholar">
                        <div className="hero-scholar-image">
                            <img
                                src={scholar.image}
                                alt={scholar.name}
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/300x400/1a1f3a/d4af37?text=' + encodeURIComponent(scholar.name) }}
                            />
                        </div>
                        <div className="hero-scholar-info">
                            <span className="hero-scholar-label">{t('scholars.label', 'Patrimoine')}</span>
                            <h3 className="hero-scholar-name">{scholar.name}</h3>
                            <span className="hero-scholar-years">{scholar.years}</span>
                            <p className="hero-scholar-bio">{scholar.bio[lang] || scholar.bio.fr}</p>
                            <button className="hero-scholar-next" onClick={pickAnotherScholar}>
                                {t('scholars.next', 'Découvrir un autre savant')}
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                )}

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
