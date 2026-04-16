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
        const load = async () => {
            try {
                const res = await fetch(`${API_URL}/api/scholars`)
                if (!res.ok) return
                const data = await res.json()
                if (Array.isArray(data) && data.length > 0) setScholars(data)
            } catch (e) {}
        }
        load()
    }, [])

    useEffect(() => {
        if (scholars.length <= 1) return
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % scholars.length)
        }, 6000)
        return () => clearInterval(timer)
    }, [scholars.length])

    const getImage = (s) => {
        if (!s.image) return ''
        return s.image.startsWith('/uploads') ? `${API_URL}${s.image}` : s.image
    }

    const getBio = (s) => s[`bio_${lang}`] || s.bio_fr || ''

    const scholar = scholars[currentSlide] || null

    return (
        <section className="hero">
            {/* Slides - fond = photo du savant */}
            <div className="hero-slides">
                {scholars.map((s, index) => (
                    <div
                        key={s.id}
                        className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                        style={{ backgroundImage: getImage(s) ? `url(${getImage(s)})` : 'none' }}
                    >
                        <div className="hero-overlay"></div>
                    </div>
                ))}
            </div>

            {/* Contenu texte + indicateurs */}
            <div className="hero-content">
                <div className="hero-text">
                    <span className="hero-badge">{t('common.since')}</span>
                    <h1 className="hero-title">
                        {scholar ? scholar.name : t('hero.title2')}
                    </h1>
                    {scholar?.years && (
                        <p className="hero-subtitle" style={{ fontSize: '1.1rem', marginBottom: 'var(--space-lg)' }}>
                            {scholar.years}
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
                    {scholars.map((_, index) => (
                        <button
                            key={index}
                            className={`indicator ${index === currentSlide ? 'active' : ''}`}
                            onClick={() => setCurrentSlide(index)}
                            aria-label={`Slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* Carte savant - même savant que le slide courant */}
            {scholar && (
                <div className="hero-scholar">
                    <div className="hero-scholar-image">
                        <img
                            src={getImage(scholar) || `https://via.placeholder.com/300x400/1a1f3a/d4af37?text=${encodeURIComponent(scholar.name)}`}
                            alt={scholar.name}
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x400/1a1f3a/d4af37?text=' + encodeURIComponent(scholar.name) }}
                        />
                    </div>
                    <div className="hero-scholar-info">
                        <span className="hero-scholar-label">{t('scholars.label', 'Patrimoine')}</span>
                        <h3 className="hero-scholar-name">{scholar.name}</h3>
                        {scholar.years && <span className="hero-scholar-years">{scholar.years}</span>}
                        <p className="hero-scholar-bio">{getBio(scholar)}</p>
                        <button
                            className="hero-scholar-next"
                            onClick={() => setCurrentSlide(prev => (prev + 1) % scholars.length)}
                        >
                            {t('scholars.next', 'Découvrir un autre savant')}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
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
