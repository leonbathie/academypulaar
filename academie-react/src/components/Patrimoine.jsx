import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../config'
import { renderBio } from '../utils/renderBio'
import './Patrimoine.css'

// Section dediee "Patrimoine" : met en avant un savant a la fois,
// avec bouton pour decouvrir le suivant. Affichee sur la page d'accueil
// entre les Actualites et le Dictionnaire.
function Patrimoine() {
    const { t, i18n } = useTranslation()
    const lang = ['fr', 'en', 'ff'].includes(i18n.language) ? i18n.language : 'fr'
    const [scholars, setScholars] = useState([])
    const [activeIdx, setActiveIdx] = useState(0)
    const [expanded, setExpanded] = useState(false)

    useEffect(() => {
        fetch(`${API_URL}/api/scholars`)
            .then(r => (r.ok ? r.json() : []))
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setScholars([...data].sort(() => Math.random() - 0.5))
                }
            })
            .catch(() => {})
    }, [])

    const scholar = scholars[activeIdx] || null
    if (!scholar) return null

    const bio = scholar[`bio_${lang}`] || (lang !== 'fr' ? null : scholar.bio_fr)
    const bioFallback = !scholar[`bio_${lang}`] && lang !== 'fr'

    const pickNext = () => {
        setExpanded(false)
        setActiveIdx(i => (i + 1) % scholars.length)
    }

    return (
        <section className="patrimoine" id="patrimoine">
            <div className="container">
                <div className="patrimoine-head">
                    <span className="section-label">{t('scholars.label', 'Patrimoine')}</span>
                    <h2 className="section-title">{t('scholars.title', 'Nos savants')}</h2>
                    {t('scholars.subtitle', '') && (
                        <p className="patrimoine-subtitle">{t('scholars.subtitle')}</p>
                    )}
                </div>

                <article className={`patrimoine-card ${expanded ? 'is-expanded' : ''}`}>
                    <div className="patrimoine-image">
                        <img
                            src={scholar.image
                                ? `${API_URL}${scholar.image}`
                                : `https://via.placeholder.com/400x500/1a1f3a/d4af37?text=${encodeURIComponent(scholar.name)}`}
                            alt={scholar.name}
                            loading="lazy"
                            style={{ objectPosition: scholar.image_position || '50% 20%' }}
                            onError={(e) => {
                                e.target.src = `https://via.placeholder.com/400x500/1a1f3a/d4af37?text=${encodeURIComponent(scholar.name)}`
                            }}
                        />
                    </div>

                    <div className="patrimoine-info">
                        <h3 className="patrimoine-name">{scholar.name}</h3>
                        {scholar.years && <span className="patrimoine-years">{scholar.years}</span>}

                        <div
                            className={`patrimoine-bio ${expanded ? 'expanded' : ''}`}
                            style={bioFallback ? { color: 'var(--medium-gray)', fontStyle: 'italic' } : undefined}
                        >
                            {bioFallback
                                ? <p className="bio-para">{t('common.noTranslation')}</p>
                                : (expanded ? renderBio(bio) : <p className="bio-para">{bio}</p>)
                            }
                        </div>

                        <div className="patrimoine-actions">
                            {bio && !bioFallback && (
                                <button className="patrimoine-toggle" onClick={() => setExpanded(v => !v)}>
                                    {expanded ? t('common.seeLess', 'Voir moins') : t('common.seeMore', 'Voir plus')}
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                        style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </button>
                            )}
                            {scholars.length > 1 && (
                                <button className="patrimoine-next" onClick={pickNext}>
                                    {t('scholars.next', 'Découvrir un autre savant')}
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </article>
            </div>
        </section>
    )
}

export default Patrimoine
