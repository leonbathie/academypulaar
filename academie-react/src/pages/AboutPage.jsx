import { useTranslation } from 'react-i18next'
import './AboutPage.css'

function AboutPage() {
    const { t, i18n } = useTranslation()

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
                    <h2>{t('about.missionTitle')}</h2>
                    <p>{t('about.mission')}</p>
                </section>

                <section className="about-section">
                    <h2>{t('about.historyTitle')}</h2>
                    <p>{t('about.history')}</p>
                </section>

                <section className="about-section values-section">
                    <h2>{t('about.valuesTitle')}</h2>
                    <div className="values-grid">
                        {/* Valeur 1: Préservation */}
                        <div className="value-card">
                            <div className="value-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <h3>{t('about.values.preservation.title')}</h3>
                            <p>{t('about.values.preservation.desc')}</p>
                        </div>

                        {/* Valeur 2: Éducation */}
                        <div className="value-card">
                            <div className="value-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                </svg>
                            </div>
                            <h3>{t('about.values.education.title')}</h3>
                            <p>{t('about.values.education.desc')}</p>
                        </div>

                        {/* Valeur 3: Innovation */}
                        <div className="value-card">
                            <div className="value-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                            </div>
                            <h3>{t('about.values.innovation.title')}</h3>
                            <p>{t('about.values.innovation.desc')}</p>
                        </div>

                        {/* Valeur 4: Unité */}
                        <div className="value-card">
                            <div className="value-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <h3>{t('about.values.unity.title')}</h3>
                            <p>{t('about.values.unity.desc')}</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default AboutPage
