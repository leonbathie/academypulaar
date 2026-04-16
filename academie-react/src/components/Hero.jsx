import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../config'
import './Hero.css'

function Hero() {
    const { t, i18n } = useTranslation()
    const [currentSlide, setCurrentSlide] = useState(0)
    const [scholars, setScholars] = useState([])
    const lang = ['fr', 'en', 'ff'].includes(i18n.language) ? i18n.language : 'fr'

    useEffect(() => {
        const loadScholars = async () => {
            try {
                const res = await fetch(`${API_URL}/api/scholars`)
                if (!res.ok) return
                const data = await res.json()
                if (Array.isArray(data) && data.length > 0) {
                    setScholars(data)
                }
            } catch (e) {
                // Pas de savants disponibles
            }
        }
        loadScholars()
    }, [])

    useEffect(() => {
        if (scholars.length <= 1) return
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % scholars.length)
        }, 6000)
        return () => clearInterval(timer)
    }, [scholars.length])

    const goToSlide = (index) => {
        setCurrentSlide(index)
    }

    const getImage = (scholar) => {
        if (!scholar.image) return ''
        if (scholar.image.startsWith('/uploads')) return `${API_URL}${scholar.image}`
        return scholar.image
    }

    const getBio = (scholar) => {
        return scholar[`bio_${lang}`] || scholar.bio_fr || ''
    }

    const currentScholar = scholars[currentSlide]

    return (
        <section className="hero">
            <div className="hero-slides">
                {scholars.map((scholar, index) => (
                    <div
                        key={scholar.id}
                        className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                        style={{ backgroundImage: getImage(scholar) ? `url(${getImage(scholar)})` : 'none' }}
                    >
                        <div className="hero-overlay"></div>
                    </div>
                ))}
            </div>

            <div className="hero-content">
                <div className="hero-text">
                    <span className="hero-badge">{t('common.since')}</span>
                    {currentScholar && (
                        <>
                            <h1 className="hero-title">{currentScholar.name}</h1>
                            {currentScholar.years && (
                                <p className="hero-years">{currentScholar.years}</p>
                            )}
                            {getBio(currentScholar) && (
                                <p className="hero-subtitle">{getBio(currentScholar)}</p>
                            )}
                        </>
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
                    {scholars.map((_, index) => (
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
