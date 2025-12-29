import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { API_URL } from '../config'
import './DictionaryPage.css'

function DictionaryPage() {
    const { t, i18n } = useTranslation()
    const [searchParams] = useSearchParams()
    const [searchTerm, setSearchTerm] = useState('')
    const [searchType, setSearchType] = useState('prefix')
    const [results, setResults] = useState([])
    const [allWords, setAllWords] = useState([])
    const [letters, setLetters] = useState([])
    const [selectedLetter, setSelectedLetter] = useState(null)
    const [isSearching, setIsSearching] = useState(false)
    const [loading, setLoading] = useState(true)
    const [playingAudio, setPlayingAudio] = useState(null)
    const audioRef = useRef(null)

    // Lire les paramètres URL au chargement
    useEffect(() => {
        const urlSearch = searchParams.get('search')
        const urlType = searchParams.get('type')
        if (urlSearch) {
            setSearchTerm(urlSearch)
        }
        if (urlType && (urlType === 'prefix' || urlType === 'similar')) {
            setSearchType(urlType)
        }
    }, [searchParams])

    // Charger tous les mots au démarrage
    useEffect(() => {
        loadDictionary()
    }, [])

    const loadDictionary = async () => {
        try {
            const response = await fetch(`${API_URL}/api/dictionary`)
            if (response.ok) {
                const data = await response.json()
                setAllWords(data)

                // Extraire les lettres disponibles
                const uniqueLetters = [...new Set(data.map(w => w.word.charAt(0).toUpperCase()))].sort()
                setLetters(uniqueLetters)
            }
        } catch (error) {
            console.error('Error loading dictionary:', error)
        } finally {
            setLoading(false)
        }
    }

    // Recherche dans les mots
    useEffect(() => {
        if (searchTerm.length >= 1) {
            setIsSearching(true)
            const timer = setTimeout(() => {
                const filtered = allWords.filter(word => {
                    const term = searchTerm.toLowerCase()
                    const wordLower = word.word.toLowerCase()

                    if (searchType === 'prefix') {
                        return wordLower.startsWith(term)
                    } else {
                        // Recherche similaire (contient)
                        return wordLower.includes(term)
                    }
                })
                setResults(filtered)
                setIsSearching(false)
            }, 300)
            return () => clearTimeout(timer)
        } else if (selectedLetter) {
            const filtered = allWords.filter(word =>
                word.word.charAt(0).toUpperCase() === selectedLetter
            )
            setResults(filtered)
        } else {
            setResults([])
        }
    }, [searchTerm, searchType, selectedLetter, allWords])

    const handleLetterClick = (letter) => {
        setSelectedLetter(letter)
        setSearchTerm('')
    }

    const getTranslation = (entry) => {
        switch (i18n.language) {
            case 'en': return entry.translation_en || entry.translation_fr
            case 'ff': return entry.translation_ff || entry.translation_fr
            default: return entry.translation_fr
        }
    }

    const playAudio = (audioUrl, entryId, type) => {
        const fullUrl = `${API_URL}${audioUrl}`

        // Si on clique sur le même audio en cours de lecture, on l'arrête
        if (playingAudio === `${entryId}-${type}`) {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
            setPlayingAudio(null)
            return
        }

        // Arrêter l'audio précédent
        if (audioRef.current) {
            audioRef.current.pause()
        }

        // Jouer le nouvel audio
        const audio = new Audio(fullUrl)
        audioRef.current = audio
        setPlayingAudio(`${entryId}-${type}`)

        audio.play()
        audio.onended = () => {
            setPlayingAudio(null)
            audioRef.current = null
        }
    }

    if (loading) {
        return (
            <div className="dictionary-page">
                <div className="dictionary-page-header">
                    <div className="container">
                        <h1 className="page-title">
                            {t('dictionary.title')} <span className="gold-accent">{t('dictionary.titleHighlight')}</span>
                        </h1>
                    </div>
                </div>
                <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <div className="spinner"></div>
                    <p>Chargement du dictionnaire...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="dictionary-page">
            <div className="dictionary-page-header">
                <div className="container">
                    <h1 className="page-title">
                        {t('dictionary.title')} <span className="gold-accent">{t('dictionary.titleHighlight')}</span>
                    </h1>
                    <p className="page-subtitle">{t('dictionary.intro')}</p>
                </div>
            </div>

            <div className="container">
                <div className="dictionary-search-section">
                    <div className="search-box">
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
                            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setSelectedLetter(null)
                                }}
                                placeholder={t('dictionary.searchPlaceholder')}
                                className="search-input-full"
                            />
                            {isSearching && <span className="search-spinner"></span>}
                        </div>
                    </div>

                    {letters.length > 0 && (
                        <div className="letter-nav">
                            {letters.map((letter) => (
                                <button
                                    key={letter}
                                    className={`letter-btn ${selectedLetter === letter ? 'active' : ''}`}
                                    onClick={() => handleLetterClick(letter)}
                                >
                                    {letter}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="dictionary-results">
                    {results.length > 0 ? (
                        <>
                            <p className="results-count">
                                {results.length} {results.length === 1 ? 'résultat' : 'résultats'}
                            </p>
                            <div className="results-grid">
                                {results.map((entry) => (
                                    <article key={entry.id} className="word-card">
                                        <div className="word-header">
                                            <div className="word-title-group">
                                                <h3 className="word-term">{entry.word}</h3>
                                                {entry.audio_word && (
                                                    <button
                                                        className={`audio-play-btn ${playingAudio === `${entry.id}-word` ? 'playing' : ''}`}
                                                        onClick={() => playAudio(entry.audio_word, entry.id, 'word')}
                                                        title="Écouter la prononciation"
                                                    >
                                                        {playingAudio === `${entry.id}-word` ? (
                                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                                <rect x="6" y="4" width="4" height="16" />
                                                                <rect x="14" y="4" width="4" height="16" />
                                                            </svg>
                                                        ) : (
                                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                                <polygon points="5 3 19 12 5 21 5 3" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                            {entry.category && (
                                                <span className="word-category">{entry.category}</span>
                                            )}
                                        </div>
                                        <p className="word-translation">{getTranslation(entry)}</p>
                                        {entry.example && (
                                            <div className="word-example-group">
                                                <p className="word-example">
                                                    <span className="example-label">Ex:</span> {entry.example}
                                                </p>
                                                {entry.audio_example && (
                                                    <button
                                                        className={`audio-play-btn audio-play-btn--small ${playingAudio === `${entry.id}-example` ? 'playing' : ''}`}
                                                        onClick={() => playAudio(entry.audio_example, entry.id, 'example')}
                                                        title="Écouter l'exemple"
                                                    >
                                                        {playingAudio === `${entry.id}-example` ? (
                                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                                <rect x="6" y="4" width="4" height="16" />
                                                                <rect x="14" y="4" width="4" height="16" />
                                                            </svg>
                                                        ) : (
                                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                                <polygon points="5 3 19 12 5 21 5 3" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </article>
                                ))}
                            </div>
                        </>
                    ) : searchTerm || selectedLetter ? (
                        <div className="no-results">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                                <path d="M8 8l6 6M14 8l-6 6" />
                            </svg>
                            <p>Aucun résultat trouvé</p>
                        </div>
                    ) : (
                        <div className="search-prompt">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                            <p>Tapez un mot ou sélectionnez une lettre pour commencer</p>
                            {allWords.length > 0 && (
                                <p style={{ color: 'var(--primary-gold)', marginTop: '1rem' }}>
                                    {allWords.length} mots disponibles dans le dictionnaire
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DictionaryPage
