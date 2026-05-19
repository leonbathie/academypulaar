import { useTranslation } from 'react-i18next'
import './AboutPage.css'

function AboutPage() {
    const { t } = useTranslation()

    // i18next : returnObjects pour recuperer les arrays / objets
    const creationParagraphs = t('about.story.creationParagraphs', { returnObjects: true }) || []
    const committees = t('about.story.committees', { returnObjects: true }) || []
    const method1Steps = t('about.story.method1Steps', { returnObjects: true }) || []
    const goals = t('about.goals', { returnObjects: true }) || []

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
                {/* === Mission + objectifs (ancre #missions) === */}
                <section className="about-section" id="missions">
                    <h2>{t('about.missionTitle')}</h2>
                    <p>{t('about.mission')}</p>

                    <h3 className="about-subhead">{t('about.goalsTitle')}</h3>
                    <p>{t('about.goalsIntro')}</p>
                    <ul className="goals-list">
                        {Array.isArray(goals) && goals.map((g, i) => (
                            <li key={i}>{g}</li>
                        ))}
                    </ul>
                </section>

                {/* === Histoire (ancre #histoire depuis le menu Academie GFW > L'histoire) === */}
                <section className="about-section" id="histoire">
                    <h2>{t('about.story.creationTitle')}</h2>
                    {Array.isArray(creationParagraphs) && creationParagraphs.map((p, i) => (
                        <p key={i}>{p}</p>
                    ))}
                </section>

                <section className="about-section" id="comites">
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

                <section className="about-section" id="methode">
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

export default AboutPage
