import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './AboutPage.css'
import './HistoirePage.css'

// Icones par domaine (mapping de l'ordre des comites dans i18n)
const COMMITTEE_ICONS = ['📖', '📰', '✈️', '🕌', '🚀', '💻', '🧬', '⚕️', '🌌', '∑', '⚛️', '👥', '📊', '☁️']

function HistoirePage() {
    const { t } = useTranslation()
    const [activeMethod, setActiveMethod] = useState(1) // 1 = generale, 2 = Campbell

    const creationParagraphs = t('about.story.creationParagraphs', { returnObjects: true }) || []
    const committees = t('about.story.committees', { returnObjects: true }) || []
    const method1Steps = t('about.story.method1Steps', { returnObjects: true }) || []

    return (
        <div className="about-page histoire-redesign">
            <div className="about-page-header">
                <div className="container">
                    <span className="histoire-hero-badge">
                        <span aria-hidden="true">📜</span>
                        {t('nav.history')} · Académie GFW
                    </span>
                    <h1 className="page-title">
                        {t('nav.history')} <span className="gold-accent">{t('about.highlight')}</span>
                    </h1>
                    <p className="page-subtitle">{t('about.story.creationTitle')}</p>

                    {/* 3 stat cards : date, siege, portee */}
                    <div className="histoire-facts">
                        <div className="histoire-fact">
                            <span className="histoire-fact-icon" aria-hidden="true">📅</span>
                            <div className="histoire-fact-value">19 Sept. 2016</div>
                            <div className="histoire-fact-label">Date de création</div>
                        </div>
                        <div className="histoire-fact">
                            <span className="histoire-fact-icon" aria-hidden="true">🏛️</span>
                            <div className="histoire-fact-value">Nouakchott</div>
                            <div className="histoire-fact-label">Siège · Mauritanie</div>
                        </div>
                        <div className="histoire-fact">
                            <span className="histoire-fact-icon" aria-hidden="true">🌍</span>
                            <div className="histoire-fact-value">12+ pays</div>
                            <div className="histoire-fact-label">Portée africaine</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                {/* 1. Quand le GFW a-t-il ete cree ? */}
                <section className="about-section">
                    <h2>{t('about.story.creationTitle')}</h2>
                    {Array.isArray(creationParagraphs) && creationParagraphs.map((p, i) => (
                        <p key={i}>{p}</p>
                    ))}
                </section>

                {/* 2. Quels sont les comites ? — Bento grid */}
                <section className="about-section histoire-committees-section">
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

                    <div className="histoire-hq-grid">
                        <div className="histoire-hq-card">
                            <span className="histoire-hq-icon" aria-hidden="true">🏛️</span>
                            <p>{t('about.story.hqText')}</p>
                        </div>
                        <div className="histoire-hq-card">
                            <span className="histoire-hq-icon" aria-hidden="true">🌐</span>
                            <p>{t('about.story.branchesText')}</p>
                        </div>
                    </div>
                </section>

                {/* 3. Methode de traduction — Switcher 2 methodes */}
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
