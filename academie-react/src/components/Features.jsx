import { useTranslation } from 'react-i18next'
import './Features.css'

function Features() {
    const { t } = useTranslation()

    const features = [
        {
            icon: (
                <svg viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" />
                    <path d="M32 16v32M22 26l10-10 10 10M22 38l10 10 10-10" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            titleKey: "features.institution.title",
            descriptionKey: "features.institution.description",
            link: "#institution"
        },
        {
            icon: (
                <svg viewBox="0 0 64 64" fill="none">
                    <rect x="12" y="8" width="40" height="48" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M20 20h24M20 28h24M20 36h16" stroke="currentColor" strokeWidth="2" />
                    <circle cx="44" cy="44" r="8" fill="currentColor" opacity="0.2" />
                    <path d="M42 44l2 2 4-4" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            titleKey: "features.dictionary.title",
            descriptionKey: "features.dictionary.description",
            link: "#dictionnaire"
        },
        {
            icon: (
                <svg viewBox="0 0 64 64" fill="none">
                    <path d="M32 8l6 12 14 2-10 10 2 14-12-6-12 6 2-14-10-10 14-2z" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.1" />
                </svg>
            ),
            titleKey: "features.prizes.title",
            descriptionKey: "features.prizes.description",
            link: "#prix"
        },
        {
            icon: (
                <svg viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="24" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M16 52c0-8.8 7.2-16 16-16s16 7.2 16 16" stroke="currentColor" strokeWidth="2" />
                    <path d="M32 34v4M28 52v-8M36 52v-8" stroke="currentColor" strokeWidth="2" />
                </svg>
            ),
            titleKey: "features.immortals.title",
            descriptionKey: "features.immortals.description",
            link: "#immortels"
        }
    ]

    return (
        <section className="features" id="decouvrir">
            <div className="container">
                <div className="features-header">
                    <span className="section-label">{t('features.sectionLabel')}</span>
                    <h2 className="section-title">
                        {t('features.title')} <span className="gold-accent">{t('features.titleHighlight')}</span>
                    </h2>
                    <p className="section-description">
                        {t('features.description')}
                    </p>
                </div>

                <div className="features-grid">
                    {features.map((feature, index) => (
                        <a
                            href={feature.link}
                            key={index}
                            className="feature-card"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="feature-icon">
                                {feature.icon}
                            </div>
                            <h3 className="feature-title">{t(feature.titleKey)}</h3>
                            <p className="feature-description">{t(feature.descriptionKey)}</p>
                            <span className="feature-link">
                                {t('common.learnMore')}
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </span>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Features
