import { useTranslation } from 'react-i18next'
import './AboutPage.css'
import './HistoirePage.css'

function MissionsPage() {
    const { t } = useTranslation()
    const goals = t('about.goals', { returnObjects: true }) || []
    const pillars = t('about.pillars', { returnObjects: true }) || []

    return (
        <div className="histoire-page">
            <div className="histoire-bg" aria-hidden="true" />

            <div className="container histoire-grid">
                {/* === COLONNE GAUCHE : Article (Manifeste) === */}
                <article className="histoire-article">
                    <span className="histoire-kicker">
                        <span aria-hidden="true">🎯</span>
                        {t('about.missionKicker')}
                    </span>
                    <h1 className="histoire-article-title">{t('about.goalsTitle')}</h1>
                    <div className="histoire-article-divider" />

                    <div className="histoire-article-body">
                        <p className="has-dropcap">{t('about.goalsIntro')}</p>

                        <blockquote className="histoire-quote">
                            <span aria-hidden="true">«&nbsp;</span>
                            {t('about.missionQuote')}
                            <span aria-hidden="true">&nbsp;»</span>
                        </blockquote>

                        <ol className="histoire-goals-list">
                            {Array.isArray(goals) && goals.map((g, i) => (
                                <li key={i}>{g}</li>
                            ))}
                        </ol>
                    </div>
                </article>

                {/* === COLONNE DROITE : 4 Piliers + Horizon === */}
                <aside className="histoire-aside">
                    {/* Les 4 Piliers Strategiques */}
                    <section className="histoire-card histoire-card--soft">
                        <h2 className="histoire-card-title">
                            <span aria-hidden="true">🏛️</span>
                            {t('about.pillarsTitle')}
                        </h2>
                        <p className="histoire-card-help">{t('about.pillarsHelp')}</p>

                        <ul className="histoire-pillars">
                            {Array.isArray(pillars) && pillars.map((p, i) => (
                                <li key={i} className="histoire-pillar">
                                    <span className="histoire-pillar-icon" aria-hidden="true">{p.icon}</span>
                                    <div>
                                        <div className="histoire-pillar-label">{p.label}</div>
                                        <div className="histoire-pillar-desc">{p.desc}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* L'Horizon Mesure (stats) */}
                    <section className="histoire-card histoire-card--dark">
                        <h2 className="histoire-card-title">
                            <span aria-hidden="true">📊</span>
                            {t('about.horizonTitle')}
                        </h2>
                        <p>{t('about.horizonText')}</p>

                        <div className="histoire-scope-stats histoire-scope-stats--3">
                            <div className="histoire-scope-stat">
                                <div className="histoire-scope-value">{goals.length}</div>
                                <div className="histoire-scope-label">{t('about.horizonGoalsLabel')}</div>
                            </div>
                            <div className="histoire-scope-stat">
                                <div className="histoire-scope-value">14</div>
                                <div className="histoire-scope-label">{t('about.horizonCommitteesLabel')}</div>
                            </div>
                            <div className="histoire-scope-stat">
                                <div className="histoire-scope-value">12+</div>
                                <div className="histoire-scope-label">{t('about.horizonCountriesLabel')}</div>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    )
}

export default MissionsPage
