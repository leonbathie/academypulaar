import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { API_URL } from '../config'
import ShareWordButton from '../components/ShareWordButton'
import './DictionaryPage.css'

function DictionaryPage() {
    const { t, i18n } = useTranslation()
    const lang = (i18n.language || 'fr').substring(0, 2)
    const normalizeFulfuldeText = (value) => (value ?? '').toString().normalize('NFC').trim()
    const searchNormalizer = (value) => normalizeFulfuldeText(value).toLowerCase()
    const collator = new Intl.Collator(lang === 'ff' ? 'ff' : undefined, { sensitivity: 'base', numeric: true })
    // Multi-domaines : un mot peut avoir plusieurs domaines (tableau `domains`),
    // avec fallback sur l'ancien champ `domain` unique.
    const wordHasDomain = (w, d) => Array.isArray(w.domains) && w.domains.length > 0
        ? w.domains.includes(d)
        : w.domain === d
    const [searchParams] = useSearchParams()
    const [searchTerm, setSearchTerm] = useState('')
    const [searchType, setSearchType] = useState('prefix')
    const [results, setResults] = useState([])
    const [allWords, setAllWords] = useState([])
    const [letters, setLetters] = useState([])
    const [selectedLetter, setSelectedLetter] = useState(null)
    const [isSearching, setIsSearching] = useState(false)
    const [loading, setLoading] = useState(true)
    const [selectedDomain, setSelectedDomain] = useState('')
    const [playingAudio, setPlayingAudio] = useState(null)
    const [expandedCards, setExpandedCards] = useState(new Set())
    const [previewLang, setPreviewLang] = useState('fr')
    const audioRef = useRef(null)

    // Alterner FR/EN chaque seconde en mode Pulaar
    useEffect(() => {
        if (lang !== 'ff') return
        const interval = setInterval(() => {
            setPreviewLang(prev => prev === 'fr' ? 'en' : 'fr')
        }, 3000)
        return () => clearInterval(interval)
    }, [lang])

    // Tracker une interaction avec un mot (éviter doublons rapides)
    const trackedWords = useRef(new Set())
    const trackWordInteraction = useCallback((id) => {
        if (trackedWords.current.has(id)) return
        trackedWords.current.add(id)
        fetch(`${API_URL}/api/dictionary/track-view/${id}`, { method: 'POST' }).catch(() => {})
        setTimeout(() => trackedWords.current.delete(id), 30000)
    }, [])

    const toggleCard = useCallback((id) => {
        setExpandedCards(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
                trackWordInteraction(id)
            }
            return next
        })
    }, [trackWordInteraction])

    // Lien direct vers un mot precis : /dictionnaire?word=<id|texte>
    const urlWordId = searchParams.get('word')
    // Vue "lien direct" (depuis une suggestion / un partage) : on affiche
    // uniquement le mot, sans les badges de domaine.
    const isDirectWordLink = !!urlWordId && !searchTerm && !selectedLetter && !selectedDomain

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

    // Tracker une recherche (avec debounce long pour éviter le spam)
    useEffect(() => {
        if (searchTerm.length < 2) return
        const trackTimer = setTimeout(() => {
            fetch(`${API_URL}/api/dictionary/track-search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ term: searchTerm, resultsCount: results.length })
            }).catch(() => {})
        }, 2000)
        return () => clearTimeout(trackTimer)
    }, [searchTerm, results.length])

    // Recherche dans les mots (Fulfulde, Français, Anglais, Définition Fulfulde)
    useEffect(() => {
        if (searchTerm.length >= 1) {
            setIsSearching(true)
            const timer = setTimeout(() => {
                let filtered = allWords.filter(word => {
                    const term = searchNormalizer(searchTerm)
                    const wordLower = searchNormalizer(word.word)
                    const frLower = searchNormalizer(word.translation_fr)
                    const enLower = searchNormalizer(word.translation_en)
                    const ffLower = searchNormalizer(word.translation_ff)

                    if (searchType === 'prefix') {
                        return wordLower.startsWith(term) ||
                               frLower.startsWith(term) ||
                               enLower.startsWith(term) ||
                               ffLower.startsWith(term)
                    } else {
                        return wordLower.includes(term) ||
                               frLower.includes(term) ||
                               enLower.includes(term) ||
                               ffLower.includes(term)
                    }
                })
                if (selectedDomain) {
                    filtered = filtered.filter(w => wordHasDomain(w, selectedDomain))
                }
                setResults(filtered)
                setIsSearching(false)
            }, 300)
            return () => clearTimeout(timer)
        } else if (selectedLetter) {
            let filtered = allWords.filter(word =>
                word.word.charAt(0).toUpperCase() === selectedLetter
            )
            if (selectedDomain) {
                filtered = filtered.filter(w => wordHasDomain(w, selectedDomain))
            }
            setResults(filtered)
        } else if (selectedDomain) {
            const filtered = allWords.filter(w => wordHasDomain(w, selectedDomain))
            setResults(filtered)
        } else if (urlWordId) {
            // Lien direct vers UN mot (?word=id OU ?word=texte) : afficher ce mot
            // seul, deplie. On accepte l'id numerique ET le texte du mot, car les
            // liens de partage (/share/word/:id) redirigent vers ?word=<texte>.
            const entry = allWords.find(w =>
                String(w.id) === String(urlWordId) ||
                searchNormalizer(w.word) === searchNormalizer(urlWordId)
            )
            if (entry) {
                setResults([entry])
                setExpandedCards(new Set([entry.id]))
                setTimeout(() => {
                    const el = document.getElementById(`word-${entry.id}`)
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }, 200)
            } else {
                setResults([])
            }
        } else {
            setResults([])
        }
    }, [searchTerm, searchType, selectedLetter, selectedDomain, allWords, urlWordId])

    const handleLetterClick = (letter) => {
        setSelectedLetter(letter)
        setSearchTerm('')
    }

    const getTranslation = (entry) => {
        switch (lang) {
            case 'en': return entry.translation_en || entry.translation_fr
            case 'ff': return entry.translation_ff || entry.translation_fr
            default: return entry.translation_fr
        }
    }

    const playAudio = (audioUrl, entryId, type) => {
        const fullUrl = `${API_URL}${audioUrl}`

        // Tracker l'écoute audio
        trackWordInteraction(entryId)

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
                    <p>{t('admin.header.loadingDictionary')}</p>
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
                {!isDirectWordLink && (
                <div className="dictionary-search-section">
                    {/* Filtres par domaine */}
                    <div className="domain-filters">
                        <button
                            className={`domain-btn ${selectedDomain === '' ? 'active' : ''}`}
                            onClick={() => setSelectedDomain('')}
                        >
                            {t('dictionary.allDomains')}
                        </button>
                        {['scientifique', 'mathematiques', 'biologie', 'philosophie', 'economie', 'droit', 'astronomie', 'informatique', 'botanique', 'vivants', 'elevage', 'agriculture', 'peche', 'forge', 'dictionnaire', 'general']
                            .map(d => ({ key: d, label: t(`dictionary.domains.${d}`) }))
                                    .sort((a, b) => collator.compare(a.label, b.label))
                            .map(({ key: domain }) => {
                            const count = allWords.filter(w => wordHasDomain(w, domain)).length
                            if (count === 0) return null
                            return (
                                <button
                                    key={domain}
                                    className={`domain-btn ${selectedDomain === domain ? 'active' : ''}`}
                                    onClick={() => setSelectedDomain(domain)}
                                >
                                    {t(`dictionary.domains.${domain}`)} <span className="domain-count">{count}</span>
                                </button>
                            )
                        })}
                    </div>

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
                )}

                <div className="dictionary-results">
                    {results.length > 0 ? (
                        <>
                            <p className="results-count">
                                {results.length} {results.length === 1 ? t('dictionary.result') : t('dictionary.results')}
                            </p>
                            <div className="results-grid">
                                {results.map((entry) => {
                                    const isExpanded = expandedCards.has(entry.id)
                                    // En Pulaar : alterner FR/EN en aperçu
                                    let previewTranslation, previewHint
                                    if (lang === 'ff') {
                                        const frText = entry.translation_fr
                                        const enText = entry.translation_en
                                        if (previewLang === 'en' && enText) {
                                            previewTranslation = enText
                                            previewHint = 'EN'
                                        } else {
                                            previewTranslation = frText || enText
                                            previewHint = frText ? 'FR' : 'EN'
                                        }
                                    } else {
                                        previewTranslation = getTranslation(entry)
                                        previewHint = null
                                    }
                                    return (
                                        <article key={entry.id} id={`word-${entry.id}`} className={`word-card ${isExpanded ? 'word-card--expanded' : ''}`}>
                                            {/* Image illustrative du mot (optionnelle) */}
                                            {entry.image && (
                                                <div className="word-image">
                                                    <img
                                                        src={`${API_URL}${entry.image}`}
                                                        alt={entry.word}
                                                        loading="lazy"
                                                        onClick={() => { trackWordInteraction(entry.id); toggleCard(entry.id) }}
                                                    />
                                                </div>
                                            )}
                                            {/* En-tête : mot + audio */}
                                            <div className="word-card-top">
                                                <h3 className="word-term" onClick={() => { trackWordInteraction(entry.id); toggleCard(entry.id) }} style={{ cursor: 'pointer' }}>{entry.word}</h3>
                                                {entry.audio_word && (
                                                    <button
                                                        className={`audio-play-btn ${playingAudio === `${entry.id}-word` ? 'playing' : ''}`}
                                                        onClick={() => playAudio(entry.audio_word, entry.id, 'word')}
                                                        title={t('dictionary.listenPronunciation')}
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

                                            {/* Traduction aperçu */}
                                            {previewTranslation && !isExpanded && (
                                                <p className={`word-preview ${lang === 'ff' ? 'word-preview--animate' : ''}`}>
                                                    {previewHint && <span className={`word-lang-hint word-lang-hint--${previewHint.toLowerCase()}`}>{previewHint}</span>}
                                                    {previewTranslation}
                                                </p>
                                            )}

                                            {/* Badges — en vue "lien direct", on masque les domaines */}
                                            {(entry.category || (!isDirectWordLink && ((Array.isArray(entry.domains) && entry.domains.length > 0) || entry.domain))) && (
                                                <div className="word-badges">
                                                    {entry.category && (
                                                        <span className="word-badge word-badge--cat">{t(`dictionary.categories.${entry.category}`, entry.category)}</span>
                                                    )}
                                                    {!isDirectWordLink && (
                                                        Array.isArray(entry.domains) && entry.domains.length > 0
                                                            ? entry.domains.map(d => (
                                                                <span key={d} className="word-badge word-badge--domain">
                                                                    {t(`dictionary.domains.${d}`, d)}
                                                                </span>
                                                              ))
                                                            : entry.domain && (
                                                                <span className="word-badge word-badge--domain">{t(`dictionary.domains.${entry.domain}`, entry.domain)}</span>
                                                              )
                                                    )}
                                                </div>
                                            )}

                                            {/* Détails dépliés */}
                                            {isExpanded && (
                                                <div className="word-details">
                                                    {entry.translation_fr && (
                                                        <div className="word-trans-row">
                                                            <span className="word-trans-flag word-trans-flag--fr">FR</span>
                                                            <span className="word-trans-text">{entry.translation_fr}</span>
                                                        </div>
                                                    )}
                                                    {entry.translation_en && (
                                                        <div className="word-trans-row">
                                                            <span className="word-trans-flag word-trans-flag--en">EN</span>
                                                            <span className="word-trans-text">{entry.translation_en}</span>
                                                        </div>
                                                    )}
                                                    {entry.translation_ff && (
                                                        <div className="word-trans-row">
                                                            <span className="word-trans-flag word-trans-flag--ff">{lang === 'ff' ? 'Anndinoore' : 'FF'}</span>
                                                            <span className="word-trans-text">{entry.translation_ff}</span>
                                                        </div>
                                                    )}
                                                    {entry.example && (
                                                        <div className="word-example-block">
                                                            <p className="word-example">
                                                                <span className="example-label">{lang === 'ff' ? 'Yeru :' : 'Ex :'}</span> {entry.example}
                                                            </p>
                                                            {entry.audio_example && (
                                                                <button
                                                                    className={`audio-play-btn audio-play-btn--small ${playingAudio === `${entry.id}-example` ? 'playing' : ''}`}
                                                                    onClick={() => playAudio(entry.audio_example, entry.id, 'example')}
                                                                    title={t('dictionary.listenExample')}
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
                                                </div>
                                            )}

                                            {/* Boutons : voir plus/moins + partager */}
                                            <div className="word-card-actions">
                                                <button className="word-toggle-btn" onClick={() => toggleCard(entry.id)}>
                                                    <span>{isExpanded ? t('admin.dictionary.seeLess') : t('admin.dictionary.seeMore')}</span>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isExpanded ? 'chevron-up' : ''}>
                                                        <polyline points="6 9 12 15 18 9" />
                                                    </svg>
                                                </button>
                                                <ShareWordButton entry={entry} t={t} />
                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                        </>
                    ) : searchTerm || selectedLetter ? (
                        <div className="no-results">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                                <path d="M8 8l6 6M14 8l-6 6" />
                            </svg>
                            <p>{t('dictionary.noResults')}</p>
                        </div>
                    ) : (
                        <div className="search-prompt">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                            <p>{t('dictionary.searchPrompt')}</p>
                            {allWords.length > 0 && (
                                <p style={{ color: 'var(--primary-gold)', marginTop: '1rem' }}>
                                    {allWords.length} {t('dictionary.availableWords')}
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
