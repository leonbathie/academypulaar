import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import './TerminologyPage.css'

function TerminologyPage() {
    const { t } = useTranslation()

    const domains = [
        { key: 'domScience', icon: '🔬' },
        { key: 'domSociety', icon: '⚖️' },
        { key: 'domHealth', icon: '🏥' },
        { key: 'domEdu', icon: '📚' }
    ]

    return (
        <div className="term-page">
            <div className="term-header">
                <div className="container">
                    <h1 className="page-title">
                        {t('terminology.title')} <span className="gold-accent">{t('terminology.titleHighlight')}</span>
                    </h1>
                    <p className="page-subtitle">{t('terminology.intro')}</p>
                </div>
            </div>

            <div className="container">
                {/* Why section */}
                <section className="term-section">
                    <h2>{t('terminology.why')}</h2>
                    <p>{t('terminology.whyText')}</p>
                </section>

                {/* Method section */}
                <section className="term-section">
                    <h2>{t('terminology.method')}</h2>
                    <p>{t('terminology.methodText')}</p>
                </section>

                {/* Domains grid */}
                <section className="term-section">
                    <h2>{t('terminology.domains')}</h2>
                    <div className="term-domains-grid">
                        {domains.map((dom) => (
                            <div key={dom.key} className="term-domain-card">
                                <span className="term-domain-icon">{dom.icon}</span>
                                <h3>{t(`terminology.${dom.key}`)}</h3>
                                <p>{t(`terminology.${dom.key}Desc`)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="term-cta">
                    <h2>{t('terminology.explore')}</h2>
                    <p>{t('terminology.exploreText')}</p>
                    <Link to="/dictionnaire" className="btn-cta">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        {t('nav.dictionary')}
                    </Link>
                </section>
            </div>
        </div>
    )
}

export default TerminologyPage
