import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import './TerminologyPage.css'

function TerminologyPage() {
    const { t } = useTranslation()

    const domains = [
        { key: 'domScience', icon: '🔬', slug: 'sciences-technologie' },
        { key: 'domHealth', icon: '🏥', slug: 'sante-medecine' },
        { key: 'domHuman', icon: '⚖️', slug: 'sciences-humaines' },
        { key: 'domEdu', icon: '📚', slug: 'education' },
        { key: 'domAgri', icon: '🌾', slug: 'agriculture-environnement' },
        { key: 'domCrafts', icon: '🔨', slug: 'metiers-artisanat' }
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
                            <Link key={dom.key} to={`/terminologie/${dom.slug}`} className="term-domain-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                <span className="term-domain-icon">{dom.icon}</span>
                                <h3>{t(`terminology.${dom.key}`)}</h3>
                                <p>{t(`terminology.${dom.key}Desc`)}</p>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}

export default TerminologyPage
