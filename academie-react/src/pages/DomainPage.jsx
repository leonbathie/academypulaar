import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../config'
import { useSettings } from '../context/SettingsContext'
import domainContent from '../data/domainContent'
import './DomainPage.css'

const DOMAIN_CONFIG = {
    'sciences-technologie': {
        icon: '🔬',
        titleKey: 'domScience',
        descKey: 'domScienceDesc',
        filters: ['scientifique', 'mathematiques'],
        color: '#2563eb'
    },
    'informatique': {
        icon: '💻',
        titleKey: 'domTech',
        descKey: 'domTechDesc',
        filters: ['informatique'],
        color: '#0891b2'
    },
    'astronomie': {
        icon: '🔭',
        titleKey: 'domSpace',
        descKey: 'domSpaceDesc',
        filters: ['astronomie'],
        color: '#4f46e5'
    },
    'sante-medecine': {
        icon: '🏥',
        titleKey: 'domHealth',
        descKey: 'domHealthDesc',
        filters: ['biologie'],
        color: '#dc2626'
    },
    'etres-vivants': {
        icon: '🦋',
        titleKey: 'domLiving',
        descKey: 'domLivingDesc',
        filters: ['vivants'],
        color: '#0d9488'
    },
    'arbres-plantes': {
        icon: '🌳',
        titleKey: 'domPlants',
        descKey: 'domPlantsDesc',
        filters: ['botanique'],
        color: '#65a30d'
    },
    'sciences-humaines': {
        icon: '⚖️',
        titleKey: 'domHuman',
        descKey: 'domHumanDesc',
        filters: ['philosophie', 'economie', 'droit'],
        color: '#d97706'
    },
    'education': {
        icon: '📚',
        titleKey: 'domEdu',
        descKey: 'domEduDesc',
        filters: ['dictionnaire'],
        color: '#16a34a'
    },
    'agriculture-environnement': {
        icon: '🌾',
        titleKey: 'domAgri',
        descKey: 'domAgriDesc',
        filters: ['agriculture', 'elevage', 'peche'],
        color: '#059669'
    },
    'metiers-artisanat': {
        icon: '🔨',
        titleKey: 'domCrafts',
        descKey: 'domCraftsDesc',
        filters: ['forge'],
        color: '#7c3aed'
    }
}

function DomainPage() {
    const { domain } = useParams()
    const { t, i18n } = useTranslation()
    const { settings } = useSettings()
    const lang = (i18n.language || 'fr').substring(0, 2)
    // Onglet "Apprendre" : activable/desactivable par domaine via l'admin.
    // Desactive => masque pour tout le monde (l'admin gere le contenu dans l'admin).
    const showLearn = settings[`learn_visible_${domain}`] !== false
    const normalizeFulfuldeText = (value) => (value ?? '').toString().normalize('NFC').trim()
    const searchNormalizer = (value) => normalizeFulfuldeText(value).toLowerCase()
    const config = DOMAIN_CONFIG[domain]
    // Multi-domaines : un mot peut appartenir a plusieurs domaines.
    const wordDomains = (w) => (Array.isArray(w.domains) && w.domains.length > 0)
        ? w.domains
        : (w.domain ? [w.domain] : [])
    const wordHasDomain = (w, d) => wordDomains(w).includes(d)

    const [words, setWords] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedSub, setSelectedSub] = useState('')
    const [expandedCards, setExpandedCards] = useState(new Set())
    const [playingAudio, setPlayingAudio] = useState(null)
    const [previewLang, setPreviewLang] = useState('fr')
    const [activeTab, setActiveTab] = useState('words')
    const audioRef = useRef(null)

    const [remoteContent, setRemoteContent] = useState(null)
    const fallbackContent = domainContent[domain]?.[lang] || domainContent[domain]?.fr
    const content = (remoteContent && Object.keys(remoteContent).length > 0) ? remoteContent : fallbackContent

    useEffect(() => {
        if (!config) return
        let cancelled = false
        fetch(`${API_URL}/api/domain-content/${domain}`, { cache: 'no-store' })
            .then(r => (r.ok ? r.json() : {}))
            .then(data => {
                if (cancelled) return
                const byLang = data && typeof data === 'object' ? (data[lang] || data.fr) : null
                setRemoteContent(byLang && Object.keys(byLang).length > 0 ? byLang : null)
            })
            .catch(() => {})
        return () => { cancelled = true }
    }, [domain, lang, config])

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
                    const filtered = data.filter(w => wordDomains(w).some(d => config.filters.includes(d)))
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

    const [showScrollTop, setShowScrollTop] = useState(false)
    useEffect(() => {
        const onScroll = () => setShowScrollTop(window.scrollY > 400)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // Si l'onglet Apprendre est masque pour ce domaine, revenir au dictionnaire.
    useEffect(() => {
        if (!showLearn && activeTab === 'learn') setActiveTab('words')
    }, [showLearn, activeTab])

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
        const term = searchNormalizer(searchTerm)
        filtered = filtered.filter(w =>
            searchNormalizer(w.word).includes(term) ||
            searchNormalizer(w.translation_fr).includes(term) ||
            searchNormalizer(w.translation_en).includes(term) ||
            searchNormalizer(w.translation_ff).includes(term)
        )
    }
    if (selectedSub) {
        filtered = filtered.filter(w => wordHasDomain(w, selectedSub))
    }

    // Sous-domaines presents, restreints a ceux du meta-domaine courant
    // (un mot multi-domaines peut aussi appartenir a un autre meta).
    const subDomains = [...new Set(
        words.flatMap(w => wordDomains(w)).filter(d => config.filters.includes(d))
    )]

    // Letters available
    const letters = [...new Set(filtered.map(w => w.word.charAt(0).toUpperCase()))].sort()

    const definedCount = words.filter(w => w.translation_ff && w.translation_ff.trim()).length

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
                            <span className="domain-stat-number">{definedCount}</span>
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
                {/* Tab navigation */}
                <nav className="domain-tabs">
                    <button className={`domain-tab ${activeTab === 'words' ? 'active' : ''}`} onClick={() => setActiveTab('words')}>
                        📖 {lang === 'ff' ? 'Kelme' : lang === 'en' ? 'Dictionary' : 'Dictionnaire'}
                        <span className="domain-tab-badge">{words.length}</span>
                    </button>
                    {showLearn && (
                        <button className={`domain-tab ${activeTab === 'learn' ? 'active' : ''}`} onClick={() => setActiveTab('learn')}>
                            🎓 {lang === 'ff' ? 'Ekkitol' : lang === 'en' ? 'Learn' : 'Apprendre'}
                        </button>
                    )}
                </nav>

                {/* LEARN TAB */}
                {activeTab === 'learn' && showLearn && content && (
                    <div className="domain-learn-tab">
                        {/* Introduction */}
                        <section className="domain-intro-section">
                            <h2 className="domain-section-title">{content.introduction.title}</h2>
                            {content.introduction.paragraphs.map((p, i) => (
                                <p key={i} className="domain-intro-text">{p}</p>
                            ))}
                        </section>

                        {/* Did You Know */}
                        <section className="domain-dyk-section">
                            <h2 className="domain-section-title">
                                💡 {lang === 'ff' ? 'Aɗa anndi ?' : lang === 'en' ? 'Did you know?' : 'Le saviez-vous ?'}
                            </h2>
                            <div className="domain-dyk-grid">
                                {content.didYouKnow.map((item, i) => (
                                    <div key={i} className="domain-dyk-card">
                                        <span className="domain-dyk-icon">{item.icon}</span>
                                        <h3 className="domain-dyk-title">{item.title}</h3>
                                        <p className="domain-dyk-text">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Example Sentences */}
                        <section className="domain-examples-section">
                            <h2 className="domain-section-title">
                                💬 {lang === 'ff' ? 'Yeru kelme' : lang === 'en' ? 'Example Sentences' : 'Exemples de phrases'}
                            </h2>
                            <div className="domain-examples-list">
                                {content.exampleSentences.map((ex, i) => (
                                    <div key={i} className="domain-example-card">
                                        <div className="domain-example-context">{ex.context}</div>
                                        <div className="domain-example-sentence domain-example-sentence--ff">
                                            <span className="domain-example-lang">FF</span>
                                            <span>{ex.ff}</span>
                                        </div>
                                        <div className="domain-example-sentence domain-example-sentence--tr">
                                            <span className="domain-example-lang">{lang === 'en' ? 'EN' : 'FR'}</span>
                                            <span>{ex[lang === 'en' ? 'en' : 'fr'] || ex.fr}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Methodology */}
                        <section className="domain-method-section">
                            <h2 className="domain-section-title">⚙️ {content.methodology.title}</h2>
                            <div className="domain-method-steps">
                                {content.methodology.steps.map((step) => (
                                    <div key={step.num} className="domain-method-step">
                                        <div className="domain-method-num">{step.num}</div>
                                        <div className="domain-method-content">
                                            <h3 className="domain-method-step-title">{step.title}</h3>
                                            <p className="domain-method-step-desc">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {/* WORDS TAB */}
                {activeTab === 'words' && (
                <>
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
                                {searchTerm && (
                                    <button className="domain-search-clear" onClick={() => setSearchTerm('')} aria-label="Clear">×</button>
                                )}
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
                                            {t(`dictionary.domains.${sub}`, sub)} ({words.filter(w => wordHasDomain(w, sub)).length})
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
                                <span className="domain-empty-icon">🔍</span>
                                <h3 className="domain-empty-title">{t('dictionary.noResults')}</h3>
                                <p className="domain-empty-text">
                                    {lang === 'ff' ? 'Etee helmere woɗnde' : lang === 'en' ? 'Try a different search term' : 'Essayez un autre terme de recherche'}
                                </p>
                                {(searchTerm || selectedSub) && (
                                    <button className="domain-empty-reset" onClick={() => { setSearchTerm(''); setSelectedSub('') }}>
                                        {lang === 'ff' ? 'Momtu cakkitle' : lang === 'en' ? 'Reset filters' : 'Réinitialiser les filtres'}
                                    </button>
                                )}
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
                                                            <div className="domain-word-name">
                                                                <h3 className="domain-word-term" onClick={() => toggleCard(entry.id)}>{entry.word}</h3>
                                                                {entry.audio_word && (
                                                                    <button
                                                                        className={`domain-audio-btn ${playingAudio === `${entry.id}-word` ? 'playing' : ''}`}
                                                                        onClick={() => playAudio(entry.audio_word, entry.id, 'word')}
                                                                        title={t('dictionary.listenPronunciation')}
                                                                    >
                                                                        {playingAudio === `${entry.id}-word` ? (
                                                                            <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                                                                        ) : (
                                                                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8.5v7a4.5 4.5 0 0 0 2.5-3.5z"/></svg>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <button className="domain-toggle-btn" onClick={() => toggleCard(entry.id)}>
                                                                <span>{isExpanded ? '−' : '+'}</span>
                                                            </button>
                                                        </div>

                                                        {previewTranslation && !isExpanded && (
                                                            <p className={`domain-word-preview ${lang === 'ff' ? 'domain-word-preview--animate' : ''}`}>
                                                                {previewHint && <span className="domain-lang-hint">{previewHint}</span>}
                                                                {previewTranslation}
                                                            </p>
                                                        )}

                                                        {(entry.category || wordDomains(entry).length > 0) && (
                                                            <div className="domain-word-badges">
                                                                {entry.category && <span className="domain-badge domain-badge--cat">{t(`dictionary.categories.${entry.category}`, entry.category)}</span>}
                                                                {wordDomains(entry).map(d => (
                                                                    <span key={d} className="domain-badge domain-badge--dom">{t(`dictionary.domains.${d}`, d)}</span>
                                                                ))}
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
                </>
                )}
            </div>

            {/* Scroll to top */}
            {showScrollTop && (
                <button
                    className="domain-scroll-top"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    aria-label="Scroll to top"
                >
                    ↑
                </button>
            )}
        </div>
    )
}

export default DomainPage
