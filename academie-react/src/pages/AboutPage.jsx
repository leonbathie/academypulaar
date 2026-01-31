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
                    <p>{t('about.mission')}</p>
                </section>
            </div>
        </div>
    )
}

export default AboutPage
