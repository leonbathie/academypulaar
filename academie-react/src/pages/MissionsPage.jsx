import { useTranslation } from 'react-i18next'
import './AboutPage.css'

function MissionsPage() {
    const { t } = useTranslation()
    const goals = t('about.goals', { returnObjects: true }) || []

    return (
        <div className="about-page">
            <div className="about-page-header">
                <div className="container">
                    <h1 className="page-title">
                        {t('nav.missions')} <span className="gold-accent">{t('about.highlight')}</span>
                    </h1>
                    <p className="page-subtitle">{t('about.goalsTitle')}</p>
                </div>
            </div>

            <div className="container">
                <section className="about-section">
                    <h2>{t('about.goalsTitle')}</h2>
                    <p>{t('about.goalsIntro')}</p>
                    <ul className="goals-list">
                        {Array.isArray(goals) && goals.map((g, i) => (
                            <li key={i}>{g}</li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    )
}

export default MissionsPage
