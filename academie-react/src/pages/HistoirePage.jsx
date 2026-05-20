import { useTranslation } from 'react-i18next'
import './AboutPage.css'

function HistoirePage() {
    const { t } = useTranslation()

    const creationParagraphs = t('about.story.creationParagraphs', { returnObjects: true }) || []
    const committees = t('about.story.committees', { returnObjects: true }) || []
    const method1Steps = t('about.story.method1Steps', { returnObjects: true }) || []

    return (
        <div className="about-page">
            <div className="about-page-header">
                <div className="container">
                    <h1 className="page-title">
                        {t('nav.history')} <span className="gold-accent">{t('about.highlight')}</span>
                    </h1>
                    <p className="page-subtitle">{t('about.story.creationTitle')}</p>
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

                {/* 2. Quels sont les comites ? */}
                <section className="about-section">
                    <h2>{t('about.story.committeesTitle')}</h2>
                    <ul className="committees-list">
                        {Array.isArray(committees) && committees.map((c, i) => (
                            <li key={i}>
                                <strong>{c.domain}</strong>
                                <span className="committee-lead"> — {c.lead}</span>
                            </li>
                        ))}
                    </ul>
                    <p>{t('about.story.hqText')}</p>
                    <p>{t('about.story.branchesText')}</p>
                </section>

                {/* 3. Methode de traduction */}
                <section className="about-section">
                    <h2>{t('about.story.methodTitle')}</h2>
                    <p>{t('about.story.methodIntro')}</p>

                    <h3 className="about-subhead">{t('about.story.method1Title')}</h3>
                    <p>{t('about.story.method1Intro')}</p>
                    <ul className="method-steps">
                        {Array.isArray(method1Steps) && method1Steps.map((s, i) => (
                            <li key={i}>{s}</li>
                        ))}
                    </ul>

                    <h3 className="about-subhead">{t('about.story.method2Title')}</h3>
                    <p>{t('about.story.method2Text')}</p>

                    <p className="about-conclusion">{t('about.story.conclusion')}</p>
                </section>
            </div>
        </div>
    )
}

export default HistoirePage
