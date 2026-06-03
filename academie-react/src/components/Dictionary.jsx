import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../config'
import './Dictionary.css'

function Dictionary() {
    const { t, i18n } = useTranslation()
    const lang = (i18n.language || 'fr').substring(0, 2)
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState('')
    const [searchType, setSearchType] = useState('prefix')
    const [wordCount, setWordCount] = useState(0)
    const [definedCount, setDefinedCount] = useState(0)
    // Recherche inline directe sur la home
    const [results, setResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const audioRef = useRef(null)
    const [playingId, setPlayingId] = useState(null)

    const loadWordCount = async () => {
        try {
            // Endpoint leger (compteurs uniquement, cache 60s) — evite de
            // telecharger tout le dictionnaire pour afficher 2 nombres.
            const response = await fetch(`${API_URL}/api/dictionary/stats`)
            if (response.ok) {
                const data = await response.json()
                setWordCount(data.total || 0)
                setDefinedCount(data.defined || 0)
            }
        } catch (error) {
            console.error('Error loading word count:', error)
        }
    }

    // Charger le nombre de mots au démarrage
    useEffect(() => {
        loadWordCount()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Recherche en direct (debounce 300ms) : interroge l'API avec limit=6.
    useEffect(() => {
        const term = searchTerm.trim()
        if (term.length < 2) {
            setResults([])
            setHasSearched(false)
            return
        }
        setSearching(true)
        const timer = setTimeout(async () => {
            try {
                const r = await fetch(`${API_URL}/api/dictionary?search=${encodeURIComponent(term)}&limit=6`)
                let data = r.ok ? await r.json() : []
                if (searchType === 'prefix') {
                    const norm = (s) => (s ?? '').toString().normalize('NFC').toLowerCase()
                    const tnorm = norm(term)
                    data = data.filter(w => norm(w.word).startsWith(tnorm))
                }
                setResults(data)
                setHasSearched(true)
            } catch {
                setResults([])
                setHasSearched(true)
            } finally {
                setSearching(false)
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [searchTerm, searchType])

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

    const handleSearch = (e) => {
        e.preventDefault()
        if (searchTerm.trim()) {
            navigate(`/dictionnaire?search=${encodeURIComponent(searchTerm)}&type=${searchType}`)
        } else {
            navigate('/dictionnaire')
        }
    }

    // Format number with spaces
    const formatNumber = (num) => {
        return num.toLocaleString('fr-FR')
    }

    return (
        <section className="dictionary" id="dictionnaire">
            <div className="container">
                <div className="dictionary-hero">
                    <div className="dictionary-content">
                        <span className="section-label">{t('dictionary.sectionLabel')}</span>
                        <h2 className="section-title">
                            {t('dictionary.title')} <span className="gold-accent">{t('dictionary.titleHighlight')}</span>
                        </h2>
                        <p className="dictionary-intro">
                            {t('dictionary.intro')}
                        </p>

                        <form className="dictionary-search" onSubmit={handleSearch}>
                            <div className="search-options">
                                <label className="search-option">
                                    <input
                                        type="radio"
                                        name="searchType"
                                        value="prefix"
                                        checked={searchType === 'prefix'}
                                        onChange={(e) => setSearchType(e.target.value)}
                                    />
                                    <span>{t('dictionary.wordsStartingWith')}</span>
                                </label>
                                <label className="search-option">
                                    <input
                                        type="radio"
                                        name="searchType"
                                        value="similar"
                                        checked={searchType === 'similar'}
                                        onChange={(e) => setSearchType(e.target.value)}
                                    />
                                    <span>{t('dictionary.similarWords')}</span>
                                </label>
                            </div>
                            <div className="search-input-wrapper">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('dictionary.searchPlaceholder')}
                                    className="search-input"
                                />
                                <button type="submit" className="search-submit">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="M21 21l-4.35-4.35" />
                                    </svg>
                                    {t('common.search')}
                                </button>
                            </div>
                        </form>

                        {/* Resultats en direct */}
                        {searchTerm.trim().length >= 2 && (
                            <div className="dict-live-results">
                                {searching && results.length === 0 && (
                                    <div className="dict-live-loading">
                                        <span className="dict-live-spinner" /> {t('common.search')}…
                                    </div>
                                )}
                                {!searching && hasSearched && results.length === 0 && (
                                    <div className="dict-live-empty">
                                        {t('dictionary.noResults', 'Aucun mot trouvé')}
                                    </div>
                                )}
                                {results.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="dict-live-card"
                                        onClick={() => navigate(`/dictionnaire?search=${encodeURIComponent(entry.word)}`)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/dictionnaire?search=${encodeURIComponent(entry.word)}`) }}
                                    >
                                        <div className="dict-live-main">
                                            <span className="dict-live-word">{entry.word}</span>
                                            <span className="dict-live-trans">{getTranslation(entry) || '—'}</span>
                                        </div>
                                        {entry.audio_word && (
                                            <button
                                                type="button"
                                                className={`dict-live-audio ${playingId === entry.id ? 'playing' : ''}`}
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
                                        className="dict-live-all"
                                        onClick={() => navigate(`/dictionnaire?search=${encodeURIComponent(searchTerm)}&type=${searchType}`)}
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

                    <div className="dictionary-visual">
                        <div className="dictionary-book">
                            <div className="book-spine"></div>
                            <div className="book-cover">
                                <div className="book-title">
                                    <span className="book-edition">1</span>
                                    <span className="book-name">{t('dictionary.titleHighlight')}</span>
                                    <span className="book-author">{t('common.siteName')}</span>
                                </div>
                                <div className="book-ornament">
                                    <svg viewBox="0 0 80 80" fill="none">
                                        <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="1" />
                                        <circle cx="40" cy="40" r="25" stroke="currentColor" strokeWidth="1" />
                                        <path d="M40 10 L40 70 M10 40 L70 40" stroke="currentColor" strokeWidth="1" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dictionary-stats">
                    <div className="stat-card">
                        <span className="stat-number">{wordCount > 0 ? formatNumber(wordCount) : '...'}</span>
                        <span className="stat-label">{t('dictionary.editions')}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-number">{definedCount > 0 ? formatNumber(definedCount) : '...'}</span>
                        <span className="stat-label">{t('dictionary.wordsDefined')}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-number">10</span>
                        <span className="stat-label">{t('dictionary.yearsOfWork')}</span>
                    </div>
                </div>

                <div className="dict-countries">
                    <div className="dict-countries-header">
                        <div className="dict-countries-header-text">
                            <h3 className="dict-countries-title">{t('dictionary.countriesLabel')}</h3>
                            <p className="dict-countries-subtitle">{t('dictionary.countriesSubtitle')}</p>
                        </div>
                        <span className="dict-countries-badge">12+</span>
                    </div>
                    <div className="dict-countries-grid">
                        {['mr','ml','sn','gn','bf','ne','cm','td','bj','sd','gw','ng'].map((code, i) => (
                            <div key={i} className="dict-country-card">
                                <div className="dict-country-flag-wrap">
                                    <img
                                        src={`https://flagcdn.com/w80/${code}.png`}
                                        alt={t(`dictionary.countries.${code}`)}
                                        className="dict-country-flag-img"
                                        loading="lazy"
                                    />
                                </div>
                                <span className="dict-country-name">{t(`dictionary.countries.${code}`)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Dictionary
