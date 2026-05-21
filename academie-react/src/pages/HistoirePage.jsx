import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './AboutPage.css'
import './HistoirePage.css'

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
        <div className="about-page">
            <div className="about-page-header">
                <div className="container">
                    <h1 className="page-title">
                        {t('nav.history')} <span className="gold-accent">{t('about.highlight')}</span>
                    </h1>
                    <p className="page-subtitle">{t('about.story.genesisTitle')}</p>
                </div>
            </div>

            <div className="container">
                {/* Section 1 : Genese & Vision (article + citation) */}
                <section className="about-section">
                    <h2>{t('about.story.creationTitle')}</h2>
                    {Array.isArray(creationParagraphs) && creationParagraphs.slice(0, 2).map((p, i) => (
                        <p key={i} className={i === 0 ? 'has-dropcap' : ''}>{p}</p>
                    ))}
                    <blockquote className="histoire-quote">
                        «&nbsp;{t('about.story.genesisQuote')}&nbsp;»
                    </blockquote>
                    {Array.isArray(creationParagraphs) && creationParagraphs.slice(2).map((p, i) => (
                        <p key={'rest' + i}>{p}</p>
                    ))}
                </section>

                {/* Section 2 : Cercle Fondateur (chips interactifs) */}
                <section className="about-section">
                    <h2>{t('about.story.foundersTitle')}</h2>
                    <p>{t('about.story.foundersHelp')}</p>

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

                {/* Section 3 : Rayonnement (stats) */}
                <section className="about-section">
                    <h2>{t('about.story.scopeTitle')}</h2>
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

                {/* Section 4 : Comites (bento) */}
                <section className="about-section">
                    <h2>
                        {t('about.story.committeesTitle')}
                        <span className="histoire-count">{committees.length}</span>
                    </h2>
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

                {/* Section 5 : Methodes (switcher) */}
                <section className="about-section">
                    <h2>{t('about.story.methodTitle')}</h2>
                    <p>{t('about.story.methodIntro')}</p>

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
