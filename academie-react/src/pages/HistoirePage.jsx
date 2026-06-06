import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './AboutPage.css'
import './HistoirePage.css'

// Icones par domaine (mapping ordre des comites dans i18n) — purement visuel
const COMMITTEE_ICONS = ['📖', '📰', '✈️', '🕌', '🚀', '💻', '🧬', '⚕️', '🌌', '∑', '⚛️', '👥', '📊', '☁️']

function HistoirePage() {
    const { t } = useTranslation()
    const [activeMethod, setActiveMethod] = useState(1)

    const creationParagraphs = t('about.story.creationParagraphs', { returnObjects: true }) || []
    const committees = t('about.story.committees', { returnObjects: true }) || []
    const method1Steps = t('about.story.method1Steps', { returnObjects: true }) || []

    return (
        <div className="histoire-page">
            <div className="histoire-bg" aria-hidden="true" />

            <div className="container histoire-doc">
                {/* === 1. Création === */}
                <article className="histoire-article">
                    <h1 className="histoire-article-title">{t('about.story.creationTitle')}</h1>
                    <div className="histoire-article-divider" />
                    <div className="histoire-article-body">
                        {Array.isArray(creationParagraphs) && creationParagraphs.map((p, i) => (
                            <p key={i} className={i === 0 ? 'has-dropcap' : ''}>{p}</p>
                        ))}
                    </div>
                </article>

                {/* === 2. Comités === */}
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

                    <section className="histoire-card histoire-card--dark histoire-doc-scope">
                        <p>{t('about.story.hqText')}</p>
                        <p>{t('about.story.branchesText')}</p>
                    </section>
                </section>

                {/* === 3. Méthode === */}
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
                            <span className="histoire-method-tab-label">{t('about.story.method1Title')}</span>
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeMethod === 2}
                            className={`histoire-method-tab ${activeMethod === 2 ? 'is-active' : ''}`}
                            onClick={() => setActiveMethod(2)}
                        >
                            <span className="histoire-method-tab-label">{t('about.story.method2Title')}</span>
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
