import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, HeartPulse } from 'lucide-react'
import './Heart3DFeature.css'

function Heart3DFeature() {
    const { t } = useTranslation()

    return (
        <section className="heart-feature">
            <div className="container">
                <div className="heart-feature-card">
                    <div className="heart-feature-icon" aria-hidden="true"><HeartPulse size={48} strokeWidth={1.4} /></div>
                    <div className="heart-feature-copy">
                        <span>{t('heart3d.featureLabel')}</span>
                        <h2>{t('heart3d.featureTitle')}</h2>
                        <p>{t('heart3d.featureText')}</p>
                    </div>
                    <Link to="/explorer-coeur" className="heart-feature-link">{t('heart3d.featureAction')} <ArrowRight size={18} aria-hidden="true" /></Link>
                </div>
            </div>
        </section>
    )
}

export default Heart3DFeature
