import { useTranslation } from 'react-i18next'
import {
    Compass, Quote, ArrowRight, Sparkles,
    GraduationCap, Microscope, BookOpen, Globe,
    Languages, TrendingUp, Target, Lightbulb,
    BarChart3, Layers
} from 'lucide-react'
import './AboutPage.css'
import './HistoirePage.css'

// Icones lucide professionnelles pour les 4 piliers (ordre i18n)
const PILLAR_ICONS = [GraduationCap, Microscope, BookOpen, Globe]

// Icones lucide pour chacun des 7 objectifs
const GOAL_ICONS = [
    Languages,     // 1. Academie linguistique : unification grammaire/terminologie
    Compass,       // 2. Recherche : dialectes, origines, histoire
    Globe,         // 3. Traduction du savoir moderne
    BookOpen,      // 4. Supports pedagogiques primaire->universitaire
    GraduationCap, // 5. Formations professionnelles
    Microscope,    // 6. Laboratoires scientifiques
    Sparkles       // 7. Recherches de pointe
]

function MissionsPage() {
    const { t } = useTranslation()
    const goals = t('about.goals', { returnObjects: true }) || []
    const pillars = t('about.pillars', { returnObjects: true }) || []

    return (
        <div className="histoire-page">
            <div className="histoire-bg" aria-hidden="true" />

            <div className="container histoire-grid">
                {/* === COLONNE GAUCHE : Manifeste === */}
                <article className="histoire-article">
                    <span className="histoire-kicker">
                        <Compass size={14} aria-hidden="true" strokeWidth={2.5} />
                        {t('about.missionKicker')}
                    </span>
                    <h1 className="histoire-article-title">{t('about.goalsTitle')}</h1>
                    <div className="histoire-article-divider" />

                    <div className="histoire-article-body">
                        <p className="has-dropcap">{t('about.goalsIntro')}</p>

                        <blockquote className="histoire-quote">
                            <Quote size={20} className="histoire-quote-icon" aria-hidden="true" />
                            {t('about.missionQuote')}
                        </blockquote>
                    </div>

                    {/* Manifeste : 7 objectifs numerotes avec icones pro */}
                    <ol className="missions-manifesto">
                        {Array.isArray(goals) && goals.map((g, i) => {
                            const Icon = GOAL_ICONS[i] || Sparkles
                            return (
                                <li key={i} className="missions-manifesto-item">
                                    <span className="missions-manifesto-num">
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <span className="missions-manifesto-icon" aria-hidden="true">
                                        <Icon size={20} strokeWidth={1.9} />
                                    </span>
                                    <span className="missions-manifesto-text">{g}</span>
                                </li>
                            )
                        })}
                    </ol>
                </article>

                {/* === COLONNE DROITE : 4 Piliers + Horizon === */}
                <aside className="histoire-aside">
                    {/* Les 4 Piliers Strategiques */}
                    <section className="histoire-card histoire-card--soft">
                        <h2 className="histoire-card-title">
                            <Target size={20} aria-hidden="true" strokeWidth={2.2} />
                            {t('about.pillarsTitle')}
                        </h2>
                        <p className="histoire-card-help">{t('about.pillarsHelp')}</p>

                        <ul className="missions-pillars">
                            {Array.isArray(pillars) && pillars.map((p, i) => {
                                const Icon = PILLAR_ICONS[i] || Layers
                                return (
                                    <li key={i} className="missions-pillar">
                                        <span className="missions-pillar-icon" aria-hidden="true">
                                            <Icon size={22} strokeWidth={1.9} />
                                        </span>
                                        <div className="missions-pillar-body">
                                            <div className="missions-pillar-label">{p.label}</div>
                                            <div className="missions-pillar-desc">{p.desc}</div>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </section>

                    {/* L'Horizon Mesure (stats) */}
                    <section className="histoire-card histoire-card--dark">
                        <h2 className="histoire-card-title">
                            <TrendingUp size={20} aria-hidden="true" strokeWidth={2.2} />
                            {t('about.horizonTitle')}
                        </h2>
                        <p>{t('about.horizonText')}</p>

                        <div className="histoire-scope-stats missions-horizon-stats">
                            <div className="histoire-scope-stat">
                                <div className="histoire-scope-value">{Array.isArray(goals) ? goals.length : 7}</div>
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

            {/* === Bandeau final : Pont vers la page Histoire === */}
            <div className="container">
                <section className="missions-cta">
                    <div className="missions-cta-icon" aria-hidden="true">
                        <Lightbulb size={28} strokeWidth={1.8} />
                    </div>
                    <div className="missions-cta-body">
                        <h3 className="missions-cta-title">{t('about.story.creationTitle')}</h3>
                        <p className="missions-cta-text">{t('about.story.conclusion')}</p>
                    </div>
                    <a href="/a-propos/histoire" className="missions-cta-link">
                        {t('nav.history')}
                        <ArrowRight size={16} strokeWidth={2.2} />
                    </a>
                </section>
            </div>
        </div>
    )
}

export default MissionsPage
