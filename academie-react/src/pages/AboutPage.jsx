import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import './AboutPage.css'

function AboutPage() {
    const { t } = useTranslation()

    return (
        <div className="about-page">
            <div className="about-page-header">
                <div className="container">
                    <h1 className="page-title">
                        {t('about.title')} <span className="gold-accent">{t('about.highlight')}</span>
                    </h1>
                    <p className="page-subtitle">{t('about.intro')}</p>
                </div>
            </div>

            <div className="container">
                <section className="about-section">
                    <div className="about-cards">
                        <Link to="/a-propos/histoire" className="about-card">
                            <span className="about-card-icon" aria-hidden="true">📖</span>
                            <h2 className="about-card-title">{t('nav.history')}</h2>
                            <p className="about-card-desc">{t('about.story.creationTitle')}</p>
                            <span className="about-card-link">
                                {t('common.discover')}
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </span>
                        </Link>

                        <Link to="/a-propos/missions" className="about-card">
                            <span className="about-card-icon" aria-hidden="true">🎯</span>
                            <h2 className="about-card-title">{t('nav.missions')}</h2>
                            <p className="about-card-desc">{t('about.goalsTitle')}</p>
                            <span className="about-card-link">
                                {t('common.discover')}
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </span>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default AboutPage
