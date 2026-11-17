import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams, Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { API_URL, resolveMediaUrl, formatParagraphs } from '../config'
import { DICTIONARY_DOMAINS } from '../data/domains'
import ShareWordButton from '../components/ShareWordButton'
import './DictionaryPage.css'

const normalizeFulfuldeText = (value) => (value ?? '').toString().normalize('NFC').trim()
const searchNormalizer = (value) => normalizeFulfuldeText(value).toLowerCase()

function DictionaryPage() {
    const { t, i18n } = useTranslation()
    const lang = (i18n.language || 'fr').substring(0, 2)
    const collator = useMemo(
        () => new Intl.Collator(lang === 'ff' ? 'ff' : undefined, { sensitivity: 'base', numeric: true }),
        [lang]
    )

    // Multi-domaines : un mot peut avoir plusieurs domaines (tableau `domains`),
    // avec fallback sur l'ancien champ `domain` unique.
    const wordDomains = useCallback((w) => (
        Array.isArray(w.domains) && w.domains.length > 0
            ? w.domains
            : (w.domain ? [w.domain] : [])
    ), [])

    const wordHasDomain = useCallback((w, d) => wordDomains(w).includes(d), [wordDomains])

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
    const [failedImages, setFailedImages] = useState(() => new Set())
    const [lightbox, setLightbox] = useState(null)
    const audioRef = useRef(null)

    // Alterner FR/EN en mode Pulaar
    useEffect(() => {
        if (lang !== 'ff') return
        const interval = setInterval(() => {
            setPreviewLang(prev => prev === 'fr' ? 'en' : 'fr')
        }, 3000)
        return () => clearInterval(interval)
    }, [lang])

    // Fermer la visionneuse d'image avec Echap
    useEffect(() => {
        if (!lightbox) return
        const onKey = (e) => { if (e.key === 'Escape') setLightbox(null) }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [lightbox])

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

    // Lien direct vers un mot précis : /dictionnaire?word=<id|texte>
    const urlWordId = searchParams.get('word')
    const isDirectWordLink = !!urlWordId && !searchTerm && !selectedLetter && !selectedDomain

    // Lire les paramètres URL au chargement
    useEffect(() => {
        const urlSearch = searchParams.get('search')
        const urlType = searchParams.get('type')
        const urlDomain = searchParams.get('domain')
        if (urlSearch) {
            setSearchTerm(urlSearch)
        }
        if (urlType && (urlType === 'prefix' || urlType === 'similar')) {
            setSearchType(urlType)
        }
        if (urlDomain) {
            setSelectedDomain(urlDomain)
        }
    }, [searchParams])

    const loadDictionary = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/dictionary`)
            if (response.ok) {
                const data = await response.json()
                setAllWords(data)

                const uniqueLetters = [...new Set(
                    data.map(w => (w.word || '').charAt(0).toUpperCase()).filter(Boolean)
                )].sort((a, b) => a.localeCompare(b))
                setLetters(uniqueLetters)
            }
        } catch (error) {
            console.error('Error loading dictionary:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadDictionary()
    }, [loadDictionary])

    // Comptage rapide des mots par domaine (mémoïsé en un seul passage O(N))
    const domainCounts = useMemo(() => {
        const counts = {}
        for (const w of allWords) {
            for (const d of wordDomains(w)) {
                if (d) counts[d] = (counts[d] || 0) + 1
            }
        }
        return counts
    }, [allWords, wordDomains])

    // Liste complète des domaines (officiels + éventuels domaines personnalisés en base), triée
    const sortedDomains = useMemo(() => {
        const knownKeys = new Set(DICTIONARY_DOMAINS.map(d => d.key))
        const extras = Object.keys(domainCounts)
            .filter(k => !knownKeys.has(k))
            .map(k => ({ key: k }))

        return [...DICTIONARY_DOMAINS, ...extras]
            .map(d => ({
                key: d.key,
                label: t(`dictionary.domains.${d.key}`, d.key),
                count: domainCounts[d.key] || 0
            }))
            .sort((a, b) => collator.compare(a.label, b.label))
    }, [domainCounts, t, collator])

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
            }, 250)
            return () => clearTimeout(timer)
        } else if (selectedLetter) {
            let filtered = allWords.filter(word =>
                (word.word || '').charAt(0).toUpperCase() === selectedLetter
            )
            if (selectedDomain) {
                filtered = filtered.filter(w => wordHasDomain(w, selectedDomain))
            }
            setResults(filtered)
        } else if (selectedDomain) {
            const filtered = allWords.filter(w => wordHasDomain(w, selectedDomain))
            setResults(filtered)
        } else if (urlWordId) {
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
    }, [searchTerm, searchType, selectedLetter, selectedDomain, allWords, urlWordId, wordHasDomain])

    const handleLetterClick = (letter) => {
        setSelectedLetter(prev => prev === letter ? null : letter)
        setSearchTerm('')
    }

    const resetAllFilters = () => {
        setSearchTerm('')
        setSelectedLetter(null)
        setSelectedDomain('')
    }

    const getTranslation = (entry) => {
        switch (lang) {
            case 'en': return entry.translation_en || entry.translation_fr
            case 'ff': return entry.translation_ff || entry.translation_fr
            default: return entry.translation_fr
        }
    }

    const playAudio = (audioUrl, entryId, type) => {
        const fullUrl = resolveMediaUrl(audioUrl)
        if (!fullUrl) return

        trackWordInteraction(entryId)

        if (playingAudio === `${entryId}-${type}`) {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
            setPlayingAudio(null)
            return
        }

        if (audioRef.current) {
            audioRef.current.pause()
        }

        const audio = new Audio(fullUrl)
        audioRef.current = audio
        setPlayingAudio(`${entryId}-${type}`)

        audio.onended = () => {
            setPlayingAudio(null)
            audioRef.current = null
        }
        audio.onerror = () => {
            setPlayingAudio(null)
            audioRef.current = null
        }
        audio.play().catch(() => {
            setPlayingAudio(null)
            audioRef.current = null
        })
    }

    const hasActiveFilter = Boolean(searchTerm || selectedLetter || selectedDomain)

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
                    <span className="dictionary-header-kicker">Goomu Fulo & Wiɗto</span>
                    <h1 className="page-title">
                        {t('dictionary.title')} <span className="gold-accent">{t('dictionary.titleHighlight')}</span>
                    </h1>
                    <p className="page-subtitle">{t('dictionary.intro')}</p>
                    {allWords.length > 0 && (
                        <div className="dictionary-header-pills">
                            <span className="dictionary-header-pill">
                                <strong>{allWords.length.toLocaleString('fr-FR')}</strong> {t('dictionary.editions')}
                            </span>
                            <span className="dictionary-header-pill">
                                <strong>{sortedDomains.length}</strong> {t('dictionary.wordsDefined')}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="container">
                {!isDirectWordLink && (
                <div className="dictionary-search-section">
                    {/* Panneau de filtrage par domaine */}
                    <div className="domain-filters-panel">
                        <div className="domain-filters-header">
                            <span className="domain-filters-label">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                </svg>
                                {t('dictionary.filterByDomain', 'Explorer par domaine')}
                            </span>
                            {hasActiveFilter && (
                                <button type="button" className="domain-reset-btn" onClick={resetAllFilters}>
                                    ✕ {t('dictionary.resetFilters', 'Réinitialiser')}
                                </button>
                            )}
                        </div>
                        <div className="domain-filters">
                            <button
                                type="button"
                                className={`domain-btn domain-btn--all ${selectedDomain === '' ? 'active' : ''}`}
                                onClick={() => setSelectedDomain('')}
                            >
                                <span className="domain-btn-label">{t('dictionary.allDomains')}</span>
                                <span className="domain-count">{allWords.length}</span>
                            </button>
                            {sortedDomains.map(({ key: domain, label, count }) => (
                                <button
                                    key={domain}
                                    type="button"
                                    className={`domain-btn ${selectedDomain === domain ? 'active' : ''} ${count === 0 ? 'domain-btn--empty' : ''}`}
                                    onClick={() => setSelectedDomain(selectedDomain === domain ? '' : domain)}
                                >
                                    <span className="domain-btn-label">{label}</span>
                                    <span className="domain-count">{count}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="search-box">
                        <div className="search-options" role="radiogroup" aria-label={t('common.search')}>
                            <label className={`search-option ${searchType === 'prefix' ? 'is-checked' : ''}`}>
                                <input
                                    type="radio"
                                    name="searchType"
                                    value="prefix"
                                    checked={searchType === 'prefix'}
                                    onChange={(e) => setSearchType(e.target.value)}
                                />
                                <span>{t('dictionary.wordsStartingWith')}</span>
                            </label>
                            <label className={`search-option ${searchType === 'similar' ? 'is-checked' : ''}`}>
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
                            {searchTerm && !isSearching && (
                                <button
                                    type="button"
                                    className="search-clear-btn"
                                    onClick={() => setSearchTerm('')}
                                    aria-label="Effacer"
                                >
                                    ×
                                </button>
                            )}
                            {isSearching && <span className="search-spinner"></span>}
                        </div>

                        {letters.length > 0 && (
                            <div className="letter-nav">
                                {letters.map((letter) => (
                                    <button
                                        key={letter}
                                        type="button"
                                        className={`letter-btn ${selectedLetter === letter ? 'active' : ''}`}
                                        onClick={() => handleLetterClick(letter)}
                                    >
                                        {letter}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                )}

                <div className={`dictionary-results ${isDirectWordLink ? 'dictionary-results--single' : ''}`}>
                    {results.length > 0 ? (
                        <>
                            {!isDirectWordLink && (
                                <div className="results-toolbar">
                                    <p className="results-count">
                                        <strong>{results.length}</strong> {results.length === 1 ? t('dictionary.result') : t('dictionary.results')}
                                        {selectedDomain && (
                                            <span className="results-active-domain">
                                                {' · '}
                                                {t(`dictionary.domains.${selectedDomain}`, selectedDomain)}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}
                            {isDirectWordLink && (
                                <Link to="/dictionnaire" className="word-detail-back">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <path d="M19 12H5M12 19l-7-7 7-7" />
                                    </svg>
                                    {t('dictionary.backToDictionary', 'Retour au dictionnaire')}
                                </Link>
                            )}
                            <div className={`results-grid ${isDirectWordLink ? 'results-grid--single' : ''}`}>
                                {results.map((entry) => {
                                    const isExpanded = expandedCards.has(entry.id)
                                    const imgSrc = entry.image && !failedImages.has(entry.id)
                                        ? resolveMediaUrl(entry.image)
                                        : ''

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

                                    const previewClean = formatParagraphs(previewTranslation).join(' ')
                                    const frParas = formatParagraphs(entry.translation_fr)
                                    const enParas = formatParagraphs(entry.translation_en)
                                    const ffParas = formatParagraphs(entry.translation_ff)
                                    const exampleParas = formatParagraphs(entry.example)
                                    const exampleTransParas = formatParagraphs(entry.example_translation)
                                    const entryDomains = wordDomains(entry)

                                    return (
                                        <article key={entry.id} id={`word-${entry.id}`} className={`word-card ${isExpanded ? 'word-card--expanded' : ''} ${isDirectWordLink ? 'word-card--detail' : ''}`}>
                                            {/* Image illustrative du mot (optionnelle) */}
                                            {imgSrc && (
                                                <div className="word-image">
                                                    <img
                                                        src={imgSrc}
                                                        alt={entry.word}
                                                        loading="lazy"
                                                        decoding="async"
                                                        onClick={() => { trackWordInteraction(entry.id); toggleCard(entry.id) }}
                                                        onError={() => setFailedImages(prev => new Set(prev).add(entry.id))}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="word-image-zoom"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            trackWordInteraction(entry.id)
                                                            setLightbox({ src: imgSrc, title: entry.word })
                                                        }}
                                                        aria-label={entry.word}
                                                        title="Agrandir l'image"
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="15 3 21 3 21 9" />
                                                            <polyline points="9 21 3 21 3 15" />
                                                            <line x1="21" y1="3" x2="14" y2="10" />
                                                            <line x1="3" y1="21" x2="10" y2="14" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}

                                            {/* En-tête : mot + audio */}
                                            <div className="word-card-top">
                                                <h3 className="word-term" onClick={() => { trackWordInteraction(entry.id); toggleCard(entry.id) }}>{entry.word}</h3>
                                                {entry.audio_word && (
                                                    <button
                                                        type="button"
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

                                            {/* Traduction aperçu (justifiée si paragraphe) */}
                                            {previewClean && !isExpanded && (
                                                <p className={`word-preview ${previewClean.length > 75 ? 'word-preview--para' : ''} ${lang === 'ff' ? 'word-preview--animate' : ''}`}>
                                                    {previewHint && <span className={`word-lang-hint word-lang-hint--${previewHint.toLowerCase()}`}>{previewHint}</span>}
                                                    {previewClean}
                                                </p>
                                            )}

                                            {/* Badges — en vue "lien direct", on affiche aussi le domaine proprement */}
                                            {(entry.category || entryDomains.length > 0) && (
                                                <div className="word-badges">
                                                    {entry.category && (
                                                        <span className="word-badge word-badge--cat">{t(`dictionary.categories.${entry.category}`, entry.category)}</span>
                                                    )}
                                                    {entryDomains.map(d => (
                                                        <span key={d} className="word-badge word-badge--domain">
                                                            {t(`dictionary.domains.${d}`, d)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Détails dépliés : paragraphes justifiés comme dans un dictionnaire académique */}
                                            {isExpanded && (
                                                <div className="word-details">
                                                    {ffParas.length > 0 && (
                                                        <div className="word-def-block">
                                                            <span className="word-trans-flag word-trans-flag--ff">
                                                                {lang === 'ff' ? 'Anndinoore' : 'Fulfulde'}
                                                            </span>
                                                            <div className="word-def-paragraphs">
                                                                {ffParas.map((p, idx) => (
                                                                    <p key={idx} className="word-para-justified">{p}</p>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {(frParas.length > 0 || enParas.length > 0) && (
                                                        <div className="word-trans-box">
                                                            {frParas.length > 0 && (
                                                                <div className="word-trans-row">
                                                                    <span className="word-trans-flag word-trans-flag--fr">FR</span>
                                                                    <div className="word-trans-text">
                                                                        {frParas.map((p, idx) => (
                                                                            <p key={idx} className={p.length > 75 ? 'word-para-justified' : ''}>{p}</p>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {enParas.length > 0 && (
                                                                <div className="word-trans-row">
                                                                    <span className="word-trans-flag word-trans-flag--en">EN</span>
                                                                    <div className="word-trans-text">
                                                                        {enParas.map((p, idx) => (
                                                                            <p key={idx} className={p.length > 75 ? 'word-para-justified' : ''}>{p}</p>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {exampleParas.length > 0 && (
                                                        <div className="word-example-block">
                                                            <div className="word-example-body">
                                                                <p className="word-example">
                                                                    <span className="example-label">{lang === 'ff' ? 'Yeru :' : 'Ex :'}</span>{' '}
                                                                    {exampleParas.join(' ')}
                                                                </p>
                                                                {exampleTransParas.length > 0 && (
                                                                    <p className="word-example-trans">
                                                                        {exampleTransParas.join(' ')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {entry.audio_example && (
                                                                <button
                                                                    type="button"
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
                                                <button type="button" className="word-toggle-btn" onClick={() => toggleCard(entry.id)}>
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
                    ) : searchTerm || selectedLetter || selectedDomain || urlWordId ? (
                        <div className="no-results">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                                <path d="M8 8l6 6M14 8l-6 6" />
                            </svg>
                            <p>{t('dictionary.noResults')}</p>
                            {hasActiveFilter && (
                                <button type="button" className="no-results-reset" onClick={resetAllFilters}>
                                    {t('dictionary.resetFilters', 'Réinitialiser')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="search-prompt">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                            <p>{t('dictionary.searchPrompt')}</p>
                            {allWords.length > 0 && (
                                <p style={{ color: 'var(--primary-gold)', marginTop: '0.75rem', fontWeight: 600 }}>
                                    {allWords.length.toLocaleString('fr-FR')} {t('dictionary.availableWords')}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {lightbox && createPortal(
                <div className="word-lightbox-overlay" onClick={() => setLightbox(null)} role="dialog" aria-modal="true" aria-label={lightbox.title}>
                    <div className="word-lightbox-content" onClick={e => e.stopPropagation()}>
                        <button type="button" className="word-lightbox-close" onClick={() => setLightbox(null)} aria-label="Fermer">
                            ✕
                        </button>
                        <img src={lightbox.src} alt={lightbox.title} />
                        {lightbox.title && <p className="word-lightbox-caption">{lightbox.title}</p>}
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}

export default DictionaryPage
