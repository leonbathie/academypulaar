import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './Hero.css'

const slides = [
    {
        image: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=1920",
        titleKey: "hero.title1",
        subtitleKey: "hero.subtitle1"
    },
    {
        image: "https://images.unsplash.com/photo-1568667256549-094345857637?w=1920",
        titleKey: "hero.title2",
        subtitleKey: "hero.subtitle2"
    },
    {
        image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1920",
        titleKey: "hero.title3",
        subtitleKey: "hero.subtitle3"
    },
    {
        image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920",
        titleKey: "hero.title4",
        subtitleKey: "hero.subtitle4"
    }
]

function Hero() {
    const { t } = useTranslation()
    const [currentSlide, setCurrentSlide] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length)
        }, 6000)
        return () => clearInterval(timer)
    }, [])

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
                    <p className="hero-subtitle">
                        {t(slides[currentSlide].subtitleKey)}
                    </p>
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

            <div className="hero-scroll">
                <span>{t('hero.scroll')}</span>
                <div className="scroll-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                </div>
            </div>
        </section>
    )
}

export default Hero
