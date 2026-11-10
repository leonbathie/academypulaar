import { useTranslation } from 'react-i18next'
import Hero from '../components/Hero'
import News from '../components/News'
import Patrimoine from '../components/Patrimoine'
import Dictionary from '../components/Dictionary'
import './HomePage.css'

function HomePage() {
    const { t } = useTranslation()

    return (
        <>
            <Hero />
            <Patrimoine />
            <News />
            <Dictionary />
            <section className="cardio-discovery" aria-labelledby="cardio-discovery-title">
                <div className="container">
                    <div className="cardio-discovery-card">
                        <div>
                            <span className="section-label">{t('cardioDiscovery.label')}</span>
                            <h2 id="cardio-discovery-title">{t('cardioDiscovery.title')}</h2>
                            <p>{t('cardioDiscovery.description')}</p>
                            <a className="btn btn-primary" href={`${import.meta.env.BASE_URL}cardioatlas/index.html`}>
                                {t('cardioDiscovery.action')} <span aria-hidden="true">→</span>
                            </a>
                        </div>
                        <div className="cardio-discovery-visual" aria-hidden="true">
                            <img src={`${import.meta.env.BASE_URL}cardioatlas/coeur-complet.jpg`} alt="" loading="lazy" />
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default HomePage
