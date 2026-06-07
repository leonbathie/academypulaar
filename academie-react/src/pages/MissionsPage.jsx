import { useTranslation } from 'react-i18next'
import './AboutPage.css'
import './HistoirePage.css'

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
                        {Array.isArray(goals) && goals.map((g, i) => (
                            <li key={i} className="missions-manifesto-item">
                                <span className="missions-manifesto-num">
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <span className="missions-manifesto-text">{g}</span>
                            </li>
                        ))}
                    </ol>
                </article>
            </div>
        </div>
    )
}

export default MissionsPage
