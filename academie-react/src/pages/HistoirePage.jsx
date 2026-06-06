import { useTranslation } from 'react-i18next'
import './AboutPage.css'
import './HistoirePage.css'

function HistoirePage() {
    const { t } = useTranslation()

    const creationParagraphs = t('about.story.creationParagraphs', { returnObjects: true }) || []
    const committees = t('about.story.committees', { returnObjects: true }) || []
    const method1Steps = t('about.story.method1Steps', { returnObjects: true }) || []

    return (
        <div className="histoire-page">
            <div className="histoire-bg" aria-hidden="true" />

            <div className="container histoire-doc">
                {/* === 1. Création === */}
                <article className="histoire-article">
                    <h1 className="histoire-article-title">{t('about.story.creationTitle')}</h1>
                    <div className="histoire-article-divider" />
                    <div className="histoire-article-body">
                        {Array.isArray(creationParagraphs) && creationParagraphs.map((p, i) => (
                            <p key={i} className={i === 0 ? 'has-dropcap' : ''}>{p}</p>
                        ))}
                    </div>
                </article>

                {/* === 2. Comités === */}
                <section className="histoire-section">
                    <div className="histoire-section-head">
                        <h2>{t('about.story.committeesTitle')}</h2>
                        <span className="histoire-count">{committees.length}</span>
                    </div>
                    <ul className="histoire-bento">
                        {Array.isArray(committees) && committees.map((c, i) => (
                            <li key={i} className="histoire-bento-item">
                                <div className="histoire-bento-domain">{c.domain}</div>
                                <div className="histoire-bento-lead">{c.lead}</div>
                            </li>
                        ))}
                    </ul>
                    <div className="histoire-article-body histoire-doc-after">
                        <p>{t('about.story.hqText')}</p>
                        <p>{t('about.story.branchesText')}</p>
                    </div>
                </section>

                {/* === 3. Méthode === */}
                <section className="histoire-section">
                    <div className="histoire-section-head">
                        <h2>{t('about.story.methodTitle')}</h2>
                    </div>
                    <p className="histoire-method-intro">{t('about.story.methodIntro')}</p>

                    <div className="histoire-method-block">
                        <h3 className="histoire-method-name">{t('about.story.method1Title')}</h3>
                        <p className="histoire-method-intro">{t('about.story.method1Intro')}</p>
                        <ol className="histoire-steps">
                            {Array.isArray(method1Steps) && method1Steps.map((s, i) => (
                                <li key={i}>{s}</li>
                            ))}
                        </ol>
                    </div>

                    <div className="histoire-method-block">
                        <h3 className="histoire-method-name">{t('about.story.method2Title')}</h3>
                        <p className="histoire-method-intro">{t('about.story.method2Text')}</p>
                    </div>

                    <p className="histoire-conclusion">{t('about.story.conclusion')}</p>
                </section>
            </div>
        </div>
    )
}

export default HistoirePage
