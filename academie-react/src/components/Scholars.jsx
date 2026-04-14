import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import scholars from '../data/scholars'
import './Scholars.css'

function Scholars() {
    const { i18n, t } = useTranslation()
    const [scholar, setScholar] = useState(null)
    const lang = ['fr', 'en', 'ff'].includes(i18n.language) ? i18n.language : 'fr'

    useEffect(() => {
        const random = scholars[Math.floor(Math.random() * scholars.length)]
        setScholar(random)
    }, [])

    const pickAnother = () => {
        let next = scholars[Math.floor(Math.random() * scholars.length)]
        while (scholars.length > 1 && next.id === scholar?.id) {
            next = scholars[Math.floor(Math.random() * scholars.length)]
        }
        setScholar(next)
    }

    if (!scholar) return null

    return (
        <section className="scholars-section">
            <div className="container">
                <div className="scholars-header">
                    <span className="section-label">{t('scholars.label', 'Patrimoine')}</span>
                    <h2 className="section-title">
                        {t('scholars.title', 'Nos savants')} <span className="gold-accent">{t('scholars.titleHighlight', 'Fulɓe')}</span>
                    </h2>
                    <p className="section-subtitle">{t('scholars.subtitle', 'Des hommes de savoir qui ont marqué l\'histoire de la langue Fulfulde et de l\'Afrique.')}</p>
                </div>

                <div className="scholar-card">
                    <div className="scholar-image-wrap">
                        <img
                            src={scholar.image}
                            alt={scholar.name}
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x500/1a1f3a/d4af37?text=' + encodeURIComponent(scholar.name) }}
                        />
                    </div>
                    <div className="scholar-content">
                        <h3 className="scholar-name">{scholar.name}</h3>
                        <span className="scholar-years">{scholar.years}</span>
                        <p className="scholar-bio">{scholar.bio[lang] || scholar.bio.fr}</p>
                        <button className="scholar-next-btn" onClick={pickAnother}>
                            {t('scholars.next', 'Découvrir un autre savant')}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Scholars
