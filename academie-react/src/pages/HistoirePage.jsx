import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './AboutPage.css'
import './HistoirePage.css'

// Icones par domaine (mapping ordre des comites dans i18n)
const COMMITTEE_ICONS = ['📖', '📰', '✈️', '🕌', '🚀', '💻', '🧬', '⚕️', '🌌', '∑', '⚛️', '👥', '📊', '☁️']

function HistoirePage() {
    const { t } = useTranslation()
    const [activeFounder, setActiveFounder] = useState(0)
    const [activeMethod, setActiveMethod] = useState(1)

    const creationParagraphs = t('about.story.creationParagraphs', { returnObjects: true }) || []
    const committees = t('about.story.committees', { returnObjects: true }) || []
    const founders = t('about.story.founders', { returnObjects: true }) || []
    const method1Steps = t('about.story.method1Steps', { returnObjects: true }) || []

    const f = Array.isArray(founders) && founders[activeFounder] ? founders[activeFounder] : null

    return (
        <div className="histoire-page">
            <div className="histoire-bg" aria-hidden="true" />

            <div className="container histoire-grid">
                {/* === COLONNE GAUCHE : Article === */}
                <article className="histoire-article">
                    <span className="histoire-kicker">
                        <span aria-hidden="true">📅</span>
                        {t('about.story.genesisKicker')}
                    </span>
                    <h1 className="histoire-article-title">{t('about.story.genesisTitle')}</h1>
                    <div className="histoire-article-divider" />

                    <div className="histoire-article-body">
                        {Array.isArray(creationParagraphs) && creationParagraphs.slice(0, 2).map((p, i) => (
                            <p key={i} className={i === 0 ? 'has-dropcap' : ''}>{p}</p>
                        ))}

                        <blockquote className="histoire-quote">
                            <span aria-hidden="true">«&nbsp;</span>
                            {t('about.story.genesisQuote')}
                            <span aria-hidden="true">&nbsp;»</span>
                        </blockquote>

                        {Array.isArray(creationParagraphs) && creationParagraphs.slice(2).map((p, i) => (
                            <p key={'rest' + i}>{p}</p>
                        ))}
                    </div>
                </article>

                {/* === COLONNE DROITE : Cercle Fondateur + Rayonnement === */}
                <aside className="histoire-aside">
                    {/* Cercle Fondateur */}
                    <section className="histoire-card histoire-card--soft">
                        <h2 className="histoire-card-title">
                            <span aria-hidden="true">👥</span>
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
                                                <span className="histoire-hl-check" aria-hidden="true">✓</span>
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
                            <span aria-hidden="true">📍</span>
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

            {/* === SECTION COMITES (en dessous, pleine largeur) === */}
            <div className="container">
                <section className="histoire-section">
                    <div className="histoire-section-head">
                        <h2>{t('about.story.committeesTitle')}</h2>
                        <span className="histoire-count">{committees.length}</span>
                    </div>
                    <ul className="histoire-bento">
                        {Array.isArray(committees) && committees.map((c, i) => (
                            <li key={i} className="histoire-bento-item">
                                <span className="histoire-bento-icon" aria-hidden="true">
                                    {COMMITTEE_ICONS[i] || '✦'}
                                </span>
                                <div className="histoire-bento-domain">{c.domain}</div>
                                <div className="histoire-bento-lead">{c.lead}</div>
                            </li>
                        ))}
                    </ul>
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

                    <p className="histoire-conclusion">{t('about.story.conclusion')}</p>
                </section>
            </div>
        </div>
    )
}

export default HistoirePage
