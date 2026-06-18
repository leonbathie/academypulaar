import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../config'
import { useSettings } from '../context/SettingsContext'
import './Hero.css'

// Melange de Fisher-Yates (copie, ne mute pas l'original)
const shuffle = (arr) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

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
    const { t, i18n } = useTranslation()
    const lang = (i18n.language || 'fr').substring(0, 2)
    const navigate = useNavigate()
    const { settings } = useSettings()
    const [currentSlide, setCurrentSlide] = useState(0)
    // Fond video du hero : aleatoirement le zebu, le patre (gaynaako) ou le mouton.
    // ?v=2 = cache-busting (force le rechargement des versions 540px reorientees).
    const [heroBgVideo] = useState(() => {
        const vids = ['/zebu.webm?v=2', '/gaynaako.webm?v=3', '/mouton.webm?v=2']
        return vids[Math.floor(Math.random() * vids.length)]
    })
    const [heroSearch, setHeroSearch] = useState('')
    // Resultats en direct
    const [results, setResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const audioRef = useRef(null)
    const [playingId, setPlayingId] = useState(null)
    const searchBoxRef = useRef(null)
    const resultsRef = useRef(null)

    useEffect(() => {
        if (slides.length <= 1) return
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % slides.length)
        }, 6000)
        return () => clearInterval(timer)
    }, [])

    // Recherche en direct (debounce 300ms)
    useEffect(() => {
        const term = heroSearch.trim()
        if (term.length < 2) {
            setResults([])
            setHasSearched(false)
            return
        }
        setSearching(true)
        const timer = setTimeout(async () => {
            try {
                const r = await fetch(`${API_URL}/api/dictionary?search=${encodeURIComponent(term)}&limit=6`)
                const data = r.ok ? await r.json() : []
                setResults(data)
                setHasSearched(true)
                setShowResults(true)
            } catch {
                setResults([])
                setHasSearched(true)
            } finally {
                setSearching(false)
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [heroSearch])

    // Fermer le panneau au clic exterieur
    useEffect(() => {
        const onClick = (e) => {
            if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
                setShowResults(false)
            }
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [])

    // Limiter la hauteur du panneau a l'espace disponible sous la barre,
    // pour qu'il ne soit jamais coupe par le bas de l'ecran.
    useEffect(() => {
        if (!showResults || !resultsRef.current) return
        const adjust = () => {
            if (!resultsRef.current) return
            const top = resultsRef.current.getBoundingClientRect().top
            const avail = window.innerHeight - top - 16
            resultsRef.current.style.maxHeight = Math.max(160, avail) + 'px'
        }
        adjust()
        window.addEventListener('resize', adjust)
        return () => window.removeEventListener('resize', adjust)
    }, [showResults, results])

    const getTranslation = (entry) => {
        switch (lang) {
            case 'en': return entry.translation_en || entry.translation_fr
            case 'ff': return entry.translation_ff || entry.translation_fr
            default: return entry.translation_fr
        }
    }

    const playAudio = (entry) => {
        if (!entry.audio_word) return
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
        if (playingId === entry.id) { setPlayingId(null); return }
        const a = new Audio(`${API_URL}${entry.audio_word}`)
        audioRef.current = a
        setPlayingId(entry.id)
        a.onended = () => setPlayingId(null)
        a.play().catch(() => setPlayingId(null))
    }

    const submitHeroSearch = (e) => {
        e.preventDefault()
        const q = heroSearch.trim()
        navigate(q ? `/dictionnaire?search=${encodeURIComponent(q)}` : '/dictionnaire')
    }

    // "Decouvrir" : a chaque clic, emmene vers une partie essentielle du site,
    // au hasard. On utilise une file melangee : toutes les parties sont vues
    // (ordre aleatoire) avant qu'une ne se repete.
    const discoverQueue = useRef([])
    const handleDiscover = () => {
        const routes = [
            '/dictionnaire',
            '/terminologie',
            '/bibliotheque',
            '/dire',
            '/questions-langue',
            '/a-propos',
            '/a-propos/histoire',
            '/a-propos/missions'
        ].filter(r => r !== '/terminologie' || settings.terminologie_visible !== false)

        if (discoverQueue.current.length === 0) {
            discoverQueue.current = shuffle(routes)
        }
        const next = discoverQueue.current.shift()
        window.scrollTo({ top: 0 })
        navigate(next)
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

            {/* Fond video (zebu, patre ou mouton, aleatoire) : sur tous les ecrans */}
            <video
                className="hero-bg-video"
                src={heroBgVideo}
                key={heroBgVideo}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                aria-hidden="true"
            />
            <div className="hero-bg-video-overlay" aria-hidden="true" />

            <div className="hero-content">
                <div className="hero-text">
                    <div className="hero-heading">
                        <span className="hero-badge">{t('common.since')}</span>
                        <h1 className="hero-title">{t(slides[currentSlide].titleKey)}</h1>
                        {slides[currentSlide].subtitleKey && (
                            <p className="hero-subtitle">{t(slides[currentSlide].subtitleKey)}</p>
                        )}
                    </div>
                    {/* Bloc actions (recherche + boutons) — pousse en bas sur mobile */}
                    <div className="hero-actions">
                    {/* Petite barre de recherche du dictionnaire, directement dans le Hero */}
                    <div className="hero-search-box" ref={searchBoxRef}>
                        <form className="hero-search" onSubmit={submitHeroSearch} role="search">
                            <svg className="hero-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                value={heroSearch}
                                onChange={(e) => setHeroSearch(e.target.value)}
                                onFocus={() => { if (results.length > 0) setShowResults(true) }}
                                placeholder={t('dictionary.searchPlaceholder', 'Rechercher un mot…')}
                                aria-label={t('dictionary.searchPlaceholder', 'Rechercher un mot')}
                            />
                            <button type="submit" aria-label={t('common.search', 'Rechercher')}>
                                {t('common.search', 'Rechercher')}
                            </button>
                        </form>

                        {/* Resultats en direct */}
                        {showResults && heroSearch.trim().length >= 2 && (
                            <div className="hero-results" ref={resultsRef}>
                                {searching && results.length === 0 && (
                                    <div className="hero-results-msg">
                                        <span className="hero-results-spinner" /> {t('common.search')}…
                                    </div>
                                )}
                                {!searching && hasSearched && results.length === 0 && (
                                    <div className="hero-results-msg">{t('dictionary.noResults', 'Aucun mot trouvé')}</div>
                                )}
                                {results.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="hero-result"
                                        onClick={() => navigate(`/dictionnaire?word=${entry.id}`)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/dictionnaire?word=${entry.id}`) }}
                                    >
                                        <div className="hero-result-main">
                                            <span className="hero-result-word">{entry.word}</span>
                                            <span className="hero-result-trans">{getTranslation(entry) || '—'}</span>
                                        </div>
                                        {entry.audio_word && (
                                            <button
                                                type="button"
                                                className={`hero-result-audio ${playingId === entry.id ? 'playing' : ''}`}
                                                onClick={(e) => { e.stopPropagation(); playAudio(entry) }}
                                                aria-label={t('dictionary.listenPronunciation', 'Écouter')}
                                            >
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    {playingId === entry.id
                                                        ? <><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>
                                                        : <polygon points="5 3 19 12 5 21 5 3" />}
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {results.length > 0 && (
                                    <button
                                        type="button"
                                        className="hero-results-all"
                                        onClick={() => navigate(`/dictionnaire?search=${encodeURIComponent(heroSearch)}`)}
                                    >
                                        {t('dictionary.seeAllResults', 'Voir tous les résultats')}
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="hero-buttons">
                        <button type="button" className="btn btn-primary" onClick={handleDiscover}>
                            {t('common.discover')}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                        <a href="#dictionnaire" className="btn btn-secondary">
                            {t('hero.consultDictionary')}
                        </a>
                    </div>
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
