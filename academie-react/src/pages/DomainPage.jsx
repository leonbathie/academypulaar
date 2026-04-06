import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../config'
import './DomainPage.css'

const DOMAIN_CONFIG = {
    'sciences-technologie': {
        icon: '🔬',
        titleKey: 'domScience',
        descKey: 'domScienceDesc',
        filters: ['scientifique', 'mathematiques', 'biologie', 'informatique', 'astronomie', 'botanique'],
        color: '#2563eb'
    },
    'societe-droit': {
        icon: '⚖️',
        titleKey: 'domSociety',
        descKey: 'domSocietyDesc',
        filters: ['droit', 'economie', 'philosophie'],
        color: '#d97706'
    },
    'sante-medecine': {
        icon: '🏥',
        titleKey: 'domHealth',
        descKey: 'domHealthDesc',
        filters: ['sante', 'biologie'],
        color: '#dc2626'
    },
    'education': {
        icon: '📚',
        titleKey: 'domEdu',
        descKey: 'domEduDesc',
        filters: ['dictionnaire', 'elevage', 'agriculture', 'peche', 'forge', 'vivants'],
        color: '#16a34a'
    }
}

function DomainPage() {
    const { domain } = useParams()
    const { t, i18n } = useTranslation()
    const lang = (i18n.language || 'fr').substring(0, 2)
    const config = DOMAIN_CONFIG[domain]

    const [words, setWords] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedSub, setSelectedSub] = useState('')
    const [expandedCards, setExpandedCards] = useState(new Set())
    const [playingAudio, setPlayingAudio] = useState(null)
    const [previewLang, setPreviewLang] = useState('fr')
    const audioRef = useRef(null)

    // Alterner FR/EN en mode Pulaar
    useEffect(() => {
        if (lang !== 'ff') return
        const interval = setInterval(() => {
            setPreviewLang(prev => prev === 'fr' ? 'en' : 'fr')
        }, 3000)
        return () => clearInterval(interval)
    }, [lang])

    useEffect(() => {
        if (!config) return
        const loadWords = async () => {
            try {
                const response = await fetch(`${API_URL}/api/dictionary`)
                if (response.ok) {
                    const data = await response.json()
                    const filtered = data.filter(w => config.filters.includes(w.domain))
                    setWords(filtered)
                }
            } catch (error) {
                console.error('Error loading domain words:', error)
            } finally {
                setLoading(false)
            }
        }
        loadWords()
    }, [config])

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
            if (next.has(id)) next.delete(id)
            else { next.add(id); trackWordInteraction(id) }
            return next
        })
    }, [trackWordInteraction])

    const playAudio = (audioUrl, entryId, type) => {
        const fullUrl = `${API_URL}${audioUrl}`
        trackWordInteraction(entryId)
        if (playingAudio === `${entryId}-${type}`) {
            if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
            setPlayingAudio(null)
            return
        }
        if (audioRef.current) audioRef.current.pause()
        const audio = new Audio(fullUrl)
        audioRef.current = audio
        setPlayingAudio(`${entryId}-${type}`)
        audio.play()
        audio.onended = () => { setPlayingAudio(null); audioRef.current = null }
    }

    const getTranslation = (entry) => {
        switch (lang) {
            case 'en': return entry.translation_en || entry.translation_fr
            case 'ff': return entry.translation_ff || entry.translation_fr
            default: return entry.translation_fr
        }
    }

    if (!config) {
        return (
            <div className="domain-page">
                <div className="container" style={{ textAlign: 'center', padding: '6rem 0' }}>
                    <h1>404</h1>
                    <p>{t('notFound.text')}</p>
                    <Link to="/terminologie" className="domain-back-link">← {t('terminology.title')}</Link>
                </div>
            </div>
        )
    }

    // Filter words
    let filtered = words
    if (searchTerm) {
        const term = searchTerm.toLowerCase()
        filtered = filtered.filter(w =>
            w.word?.toLowerCase().includes(term) ||
            w.translation_fr?.toLowerCase().includes(term) ||
            w.translation_en?.toLowerCase().includes(term) ||
            w.translation_ff?.toLowerCase().includes(term)
        )
    }
    if (selectedSub) {
        filtered = filtered.filter(w => w.domain === selectedSub)
    }

    // Group by sub-domain
    const subDomains = [...new Set(words.map(w => w.domain).filter(Boolean))]

    // Letters available
    const letters = [...new Set(filtered.map(w => w.word.charAt(0).toUpperCase()))].sort()

    return (
        <div className="domain-page">
            <div className="domain-page-header" style={{ '--domain-color': config.color }}>
                <div className="container">
                    <Link to="/terminologie" className="domain-back-link">← {t('terminology.title')}</Link>
                    <span className="domain-page-icon">{config.icon}</span>
                    <h1 className="domain-page-title">{t(`terminology.${config.titleKey}`)}</h1>
                    <p className="domain-page-desc">{t(`terminology.${config.descKey}`)}</p>
                    <div className="domain-page-stats">
                        <div className="domain-stat">
                            <span className="domain-stat-number">{words.length}</span>
                            <span className="domain-stat-label">{t('dictionary.editions')}</span>
                        </div>
                        <div className="domain-stat">
                            <span className="domain-stat-number">{words.filter(w => w.translation_ff && w.translation_ff.trim()).length}</span>
                            <span className="domain-stat-label">{t('dictionary.wordsDefined')}</span>
                        </div>
                        <div className="domain-stat">
                            <span className="domain-stat-number">{subDomains.length}</span>
                            <span className="domain-stat-label">{lang === 'ff' ? 'Cate' : lang === 'en' ? 'Sub-domains' : 'Sous-domaines'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <>
                        {/* Filters */}
                        <div className="domain-filters-bar">
                            <div className="domain-search-box">
                                <svg className="domain-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('dictionary.searchPlaceholder')}
                                    className="domain-search-input"
                                />
                            </div>
                            {subDomains.length > 1 && (
                                <div className="domain-sub-filters">
                                    <button
                                        className={`domain-sub-btn ${selectedSub === '' ? 'active' : ''}`}
                                        onClick={() => setSelectedSub('')}
                                    >
                                        {t('dictionary.allDomains')}
                                    </button>
                                    {subDomains.map(sub => (
                                        <button
                                            key={sub}
                                            className={`domain-sub-btn ${selectedSub === sub ? 'active' : ''}`}
                                            onClick={() => setSelectedSub(sub)}
                                        >
                                            {t(`dictionary.domains.${sub}`, sub)} ({words.filter(w => w.domain === sub).length})
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Letter index */}
                        {letters.length > 0 && (
                            <div className="domain-letter-index">
                                {letters.map(l => (
                                    <a key={l} href={`#letter-${l}`} className="domain-letter-link">{l}</a>
                                ))}
                            </div>
                        )}

                        {/* Results count */}
                        <p className="domain-results-count">
                            {filtered.length} {filtered.length === 1 ? t('dictionary.result') : t('dictionary.results')}
                        </p>

                        {/* Words grouped by letter */}
                        {filtered.length === 0 ? (
                            <div className="domain-empty">
                                <p>{t('dictionary.noResults')}</p>
                            </div>
                        ) : (
                            letters.map(letter => {
                                const letterWords = filtered.filter(w => w.word.charAt(0).toUpperCase() === letter)
                                if (letterWords.length === 0) return null
                                return (
                                    <div key={letter} className="domain-letter-group" id={`letter-${letter}`}>
                                        <h2 className="domain-letter-heading">{letter}</h2>
                                        <div className="domain-words-grid">
                                            {letterWords.map(entry => {
                                                const isExpanded = expandedCards.has(entry.id)
                                                let previewTranslation, previewHint
                                                if (lang === 'ff') {
                                                    const frText = entry.translation_fr
                                                    const enText = entry.translation_en
                                                    if (previewLang === 'en' && enText) {
                                                        previewTranslation = enText; previewHint = 'EN'
                                                    } else {
                                                        previewTranslation = frText || enText; previewHint = frText ? 'FR' : 'EN'
                                                    }
                                                } else {
                                                    previewTranslation = getTranslation(entry); previewHint = null
                                                }
                                                return (
                                                    <article key={entry.id} className={`domain-word-card ${isExpanded ? 'domain-word-card--expanded' : ''}`}>
                                                        <div className="domain-word-top">
                                                            <h3 className="domain-word-term" onClick={() => toggleCard(entry.id)}>{entry.word}</h3>
                                                            <div className="domain-word-actions">
                                                                {entry.audio_word && (
                                                                    <button
                                                                        className={`domain-audio-btn ${playingAudio === `${entry.id}-word` ? 'playing' : ''}`}
                                                                        onClick={() => playAudio(entry.audio_word, entry.id, 'word')}
                                                                        title={t('dictionary.listenPronunciation')}
                                                                    >
                                                                        {playingAudio === `${entry.id}-word` ? (
                                                                            <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                                                                        ) : (
                                                                            <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                                                        )}
                                                                    </button>
                                                                )}
                                                                <button className="domain-toggle-btn" onClick={() => toggleCard(entry.id)}>
                                                                    <span>{isExpanded ? '−' : '+'}</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {previewTranslation && !isExpanded && (
                                                            <p className={`domain-word-preview ${lang === 'ff' ? 'domain-word-preview--animate' : ''}`}>
                                                                {previewHint && <span className="domain-lang-hint">{previewHint}</span>}
                                                                {previewTranslation}
                                                            </p>
                                                        )}

                                                        {(entry.category || entry.domain) && (
                                                            <div className="domain-word-badges">
                                                                {entry.category && <span className="domain-badge domain-badge--cat">{t(`dictionary.categories.${entry.category}`, entry.category)}</span>}
                                                                {entry.domain && <span className="domain-badge domain-badge--dom">{t(`dictionary.domains.${entry.domain}`, entry.domain)}</span>}
                                                            </div>
                                                        )}

                                                        {isExpanded && (
                                                            <div className="domain-word-details">
                                                                {entry.translation_fr && (
                                                                    <div className="domain-trans-row">
                                                                        <span className="domain-trans-flag domain-trans-flag--fr">FR</span>
                                                                        <span>{entry.translation_fr}</span>
                                                                    </div>
                                                                )}
                                                                {entry.translation_en && (
                                                                    <div className="domain-trans-row">
                                                                        <span className="domain-trans-flag domain-trans-flag--en">EN</span>
                                                                        <span>{entry.translation_en}</span>
                                                                    </div>
                                                                )}
                                                                {entry.translation_ff && (
                                                                    <div className="domain-trans-row">
                                                                        <span className="domain-trans-flag domain-trans-flag--ff">{lang === 'ff' ? 'Anndinoore' : 'FF'}</span>
                                                                        <span>{entry.translation_ff}</span>
                                                                    </div>
                                                                )}
                                                                {entry.example && (
                                                                    <div className="domain-example-block">
                                                                        <p><strong>{lang === 'ff' ? 'Yeru :' : 'Ex :'}</strong> {entry.example}</p>
                                                                        {entry.audio_example && (
                                                                            <button
                                                                                className={`domain-audio-btn domain-audio-btn--sm ${playingAudio === `${entry.id}-example` ? 'playing' : ''}`}
                                                                                onClick={() => playAudio(entry.audio_example, entry.id, 'example')}
                                                                            >
                                                                                {playingAudio === `${entry.id}-example` ? (
                                                                                    <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                                                                                ) : (
                                                                                    <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                    </article>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default DomainPage
