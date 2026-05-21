import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
    CalendarDays, Users, MapPin, CheckCircle2, Sparkles,
    BookOpen, Newspaper, Plane, Moon, Rocket, Cpu,
    Dna, Stethoscope, Telescope, Calculator, Atom,
    UsersRound, Database, CloudSun, Quote, ArrowRight,
    Search, Filter
} from 'lucide-react'
import './AboutPage.css'
import './HistoirePage.css'

// Icones par domaine (mapping ordre des 14 comites dans i18n)
const COMMITTEE_ICONS = [
    BookOpen,    // Grammaire & orthographe
    Newspaper,   // Journalisme / Medias
    Plane,       // Sciences aerodynamiques
    Moon,        // Sciences islamiques
    Rocket,      // Sciences spatiales
    Cpu,         // IT
    Dna,         // Sciences biologiques
    Stethoscope, // Sante & medecine
    Telescope,   // Astronomie & geologie
    Calculator,  // Mathematiques
    Atom,        // Physique
    UsersRound,  // Sociologie & droits
    Database,    // Collecte de donnees
    CloudSun     // Meteorologie
]

// Categorisation des comites (par index)
const COMMITTEE_CATEGORIES = [
    'letters',  // 0 Grammaire
    'letters',  // 1 Journalisme
    'applied',  // 2 Aero
    'human',    // 3 Islamique
    'applied',  // 4 Spatial
    'applied',  // 5 IT
    'earth',    // 6 Bio
    'earth',    // 7 Sante
    'earth',    // 8 Astro
    'exact',    // 9 Math
    'exact',    // 10 Physique
    'human',    // 11 Socio
    'applied',  // 12 Donnees
    'earth'     // 13 Meteo
]

function HistoirePage() {
    const { t } = useTranslation()
    const [activeFounder, setActiveFounder] = useState(0)
    const [activeMethod, setActiveMethod] = useState(1)
    const [committeeFilter, setCommitteeFilter] = useState('all')
    const [committeeSearch, setCommitteeSearch] = useState('')

    const creationParagraphs = t('about.story.creationParagraphs', { returnObjects: true }) || []
    const committees = t('about.story.committees', { returnObjects: true }) || []
    const founders = t('about.story.founders', { returnObjects: true }) || []
    const method1Steps = t('about.story.method1Steps', { returnObjects: true }) || []
    const timeline = t('about.story.timeline', { returnObjects: true }) || []
    const categories = t('about.story.committeesCategories', { returnObjects: true }) || {}

    const f = Array.isArray(founders) && founders[activeFounder] ? founders[activeFounder] : null

    // Comites filtres (recherche + categorie active)
    const committeesFiltered = useMemo(() => {
        const list = Array.isArray(committees) ? committees : []
        const term = committeeSearch.trim().toLowerCase()
        return list
            .map((c, i) => ({ ...c, _idx: i, _cat: COMMITTEE_CATEGORIES[i] }))
            .filter(c => committeeFilter === 'all' || c._cat === committeeFilter)
            .filter(c => !term
                || (c.domain || '').toLowerCase().includes(term)
                || (c.lead || '').toLowerCase().includes(term))
    }, [committees, committeeFilter, committeeSearch])

    // Liste des categories disponibles + nombre de comites par categorie
    const categoryList = useMemo(() => {
        const counts = {}
        COMMITTEE_CATEGORIES.forEach(c => { counts[c] = (counts[c] || 0) + 1 })
        const keys = ['letters', 'applied', 'exact', 'earth', 'human']
            .filter(k => counts[k] > 0)
        return keys.map(k => ({ key: k, label: categories[k] || k, count: counts[k] }))
    }, [categories])

    // Initiales du directeur pour le medallion (ex: "Pr. Aamadu Tijjaani Kan" -> "AT")
    const directorInitials = (lead) => {
        if (!lead) return '·'
        const cleaned = lead.replace(/^(Pr\.?|Dr\.?|Ing\.?|Ceerno|Mme?\.?|M\.?)\s+/i, '')
        const parts = cleaned.split(/\s+/).filter(Boolean)
        const a = parts[0]?.[0] || ''
        const b = parts[parts.length - 1]?.[0] || ''
        return (a + b).toUpperCase().slice(0, 2)
    }

    return (
        <div className="histoire-page">
            <div className="histoire-bg" aria-hidden="true" />

            <div className="container histoire-grid">
                {/* === COLONNE GAUCHE : Article === */}
                <article className="histoire-article">
                    <span className="histoire-kicker">
                        <CalendarDays size={14} aria-hidden="true" strokeWidth={2.5} />
                        {t('about.story.genesisKicker')}
                    </span>
                    <h1 className="histoire-article-title">{t('about.story.genesisTitle')}</h1>
                    <div className="histoire-article-divider" />

                    <div className="histoire-article-body">
                        {Array.isArray(creationParagraphs) && creationParagraphs.slice(0, 2).map((p, i) => (
                            <p key={i} className={i === 0 ? 'has-dropcap' : ''}>{p}</p>
                        ))}

                        <blockquote className="histoire-quote">
                            <Quote size={20} className="histoire-quote-icon" aria-hidden="true" />
                            {t('about.story.genesisQuote')}
                        </blockquote>

                        {Array.isArray(creationParagraphs) && creationParagraphs.slice(2).map((p, i) => (
                            <p key={'rest' + i}>{p}</p>
                        ))}
                    </div>

                    {/* Timeline chronologique */}
                    {Array.isArray(timeline) && timeline.length > 0 && (
                        <div className="histoire-timeline">
                            <h3 className="histoire-timeline-title">
                                <Sparkles size={18} aria-hidden="true" strokeWidth={2.2} />
                                {t('about.story.timelineTitle')}
                            </h3>
                            <ol className="histoire-timeline-list">
                                {timeline.map((tl, i) => (
                                    <li key={i} className="histoire-timeline-item">
                                        <span className="histoire-timeline-year">{tl.year}</span>
                                        <div className="histoire-timeline-content">
                                            <div className="histoire-timeline-label">{tl.label}</div>
                                            <div className="histoire-timeline-text">{tl.text}</div>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                </article>

                {/* === COLONNE DROITE : Cercle Fondateur + Rayonnement === */}
                <aside className="histoire-aside">
                    {/* Cercle Fondateur */}
                    <section className="histoire-card histoire-card--soft">
                        <h2 className="histoire-card-title">
                            <Users size={20} aria-hidden="true" strokeWidth={2.2} />
                            {t('about.story.foundersTitle')}
                        </h2>
                        <p className="histoire-card-help">{t('about.story.foundersHelp')}</p>

                        <div className="histoire-founders-chips">
                            {Array.isArray(founders) && founders.map((fd, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={`histoire-chip ${i === activeFounder ? 'is-active' : ''}`}
                                    onClick={() => setActiveFounder(i)}
                                >
                                    {fd.shortName}
                                </button>
                            ))}
                        </div>

                        {f && (
                            <div className="histoire-founder-panel" key={activeFounder}>
                                <div className="histoire-founder-head">
                                    <h3 className="histoire-founder-name">{f.fullName}</h3>
                                    {f.tag && <span className="histoire-founder-tag">{f.tag}</span>}
                                </div>
                                <div className="histoire-founder-role">{f.role}</div>
                                <p className="histoire-founder-bio">{f.bio}</p>
                                {Array.isArray(f.highlights) && f.highlights.length > 0 && (
                                    <ul className="histoire-founder-highlights">
                                        {f.highlights.map((h, i) => (
                                            <li key={i}>
                                                <CheckCircle2 size={16} aria-hidden="true" strokeWidth={2.2} />
                                                {h}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Rayonnement Transspatial */}
                    <section className="histoire-card histoire-card--dark">
                        <h2 className="histoire-card-title">
                            <MapPin size={20} aria-hidden="true" strokeWidth={2.2} />
                            {t('about.story.scopeTitle')}
                        </h2>
                        <p>{t('about.story.hqText')}</p>
                        <p>{t('about.story.branchesText')}</p>

                        <div className="histoire-scope-stats">
                            <div className="histoire-scope-stat">
                                <div className="histoire-scope-value">Nouakchott</div>
                                <div className="histoire-scope-label">{t('about.story.scopeHqLabel')}</div>
                            </div>
                            <div className="histoire-scope-stat">
                                <div className="histoire-scope-value">{t('about.story.scopeCountriesValue')}</div>
                                <div className="histoire-scope-label">{t('about.story.scopeCountriesLabel')}</div>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>

            {/* === SECTION COMITES (pleine largeur) === */}
            <div className="container">
                <section className="histoire-section">
                    <div className="histoire-section-head">
                        <h2>{t('about.story.committeesTitle')}</h2>
                        <span className="histoire-count">{committees.length}</span>
                    </div>

                    {/* Barre de filtres : search + categories */}
                    <div className="histoire-bento-toolbar">
                        <div className="histoire-bento-search">
                            <Search size={16} strokeWidth={2} aria-hidden="true" />
                            <input
                                type="text"
                                placeholder={t('about.story.committeesSearchPlaceholder', 'Rechercher un comité ou un directeur…')}
                                value={committeeSearch}
                                onChange={e => setCommitteeSearch(e.target.value)}
                                aria-label={t('about.story.committeesSearchPlaceholder', 'Rechercher')}
                            />
                        </div>
                        <div className="histoire-bento-filters" role="tablist">
                            <button
                                type="button"
                                className={`histoire-bento-filter ${committeeFilter === 'all' ? 'is-active' : ''}`}
                                onClick={() => setCommitteeFilter('all')}
                            >
                                <Filter size={13} strokeWidth={2.2} aria-hidden="true" />
                                {t('about.story.committeesFilterAll', 'Tous')} <span className="histoire-bento-filter-count">{committees.length}</span>
                            </button>
                            {categoryList.map(cat => (
                                <button
                                    key={cat.key}
                                    type="button"
                                    className={`histoire-bento-filter histoire-bento-filter--${cat.key} ${committeeFilter === cat.key ? 'is-active' : ''}`}
                                    onClick={() => setCommitteeFilter(cat.key)}
                                >
                                    {cat.label}
                                    <span className="histoire-bento-filter-count">{cat.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bento grid */}
                    {committeesFiltered.length > 0 ? (
                        <ul className="histoire-bento">
                            {committeesFiltered.map((c) => {
                                const Icon = COMMITTEE_ICONS[c._idx] || Sparkles
                                const catLabel = c._cat ? categories[c._cat] : null
                                return (
                                    <li key={c._idx} className={`histoire-bento-item histoire-bento-item--${c._cat || 'default'}`}>
                                        <div className="histoire-bento-top">
                                            <span className="histoire-bento-icon" aria-hidden="true">
                                                <Icon size={22} strokeWidth={1.8} />
                                            </span>
                                            {catLabel && (
                                                <div className={`histoire-bento-cat histoire-bento-cat--${c._cat}`}>
                                                    {catLabel}
                                                </div>
                                            )}
                                        </div>
                                        <div className="histoire-bento-domain">{c.domain}</div>
                                        <div className="histoire-bento-director">
                                            <span className="histoire-bento-medallion" aria-hidden="true">
                                                {directorInitials(c.lead)}
                                            </span>
                                            <span className="histoire-bento-lead">{c.lead}</span>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    ) : (
                        <div className="histoire-bento-empty">
                            <Search size={28} strokeWidth={1.5} aria-hidden="true" />
                            <p>{t('about.story.committeesEmpty', 'Aucun comité ne correspond à votre recherche.')}</p>
                        </div>
                    )}
                </section>

                {/* === SECTION METHODES === */}
                <section className="histoire-section">
                    <div className="histoire-section-head">
                        <h2>{t('about.story.methodTitle')}</h2>
                    </div>
                    <p className="histoire-method-intro">{t('about.story.methodIntro')}</p>

                    <div className="histoire-methods-tabs" role="tablist">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeMethod === 1}
                            className={`histoire-method-tab ${activeMethod === 1 ? 'is-active' : ''}`}
                            onClick={() => setActiveMethod(1)}
                        >
                            <span className="histoire-method-tab-num">MÉTHODE 01</span>
                            <span className="histoire-method-tab-label">{t('about.story.method1Title').replace(/^1\)\s*/, '')}</span>
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeMethod === 2}
                            className={`histoire-method-tab ${activeMethod === 2 ? 'is-active' : ''}`}
                            onClick={() => setActiveMethod(2)}
                        >
                            <span className="histoire-method-tab-num">MÉTHODE 02</span>
                            <span className="histoire-method-tab-label">{t('about.story.method2Title').replace(/^2\)\s*/, '')}</span>
                        </button>
                    </div>

                    {activeMethod === 1 && (
                        <div className="histoire-method-panel" key="m1">
                            <p>{t('about.story.method1Intro')}</p>
                            <ol className="histoire-steps">
                                {Array.isArray(method1Steps) && method1Steps.map((s, i) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {activeMethod === 2 && (
                        <div className="histoire-method-panel" key="m2">
                            <p>{t('about.story.method2Text')}</p>
                        </div>
                    )}

                    <p className="about-conclusion">{t('about.story.conclusion')}</p>
                </section>
            </div>
        </div>
    )
}

export default HistoirePage
