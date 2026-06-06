import { useTranslation } from 'react-i18next'
import {
    Sparkles, GraduationCap, Microscope, BookOpen,
    Globe, Languages, Compass
} from 'lucide-react'
import './AboutPage.css'
import './HistoirePage.css'

// Icones lucide pour chacun des 7 objectifs (purement visuel)
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

    return (
        <div className="histoire-page">
            <div className="histoire-bg" aria-hidden="true" />

            <div className="container histoire-doc">
                <article className="histoire-article">
                    <h1 className="histoire-article-title">{t('about.goalsTitle')}</h1>
                    <div className="histoire-article-divider" />
                    <div className="histoire-article-body">
                        <p className="has-dropcap">{t('about.goalsIntro')}</p>
                    </div>

                    {/* Les 7 objectifs */}
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
            </div>
        </div>
    )
}

export default MissionsPage
