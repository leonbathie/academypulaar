import { useTranslation } from 'react-i18next'
import { ArrowUpRight, HeartPulse } from 'lucide-react'
import './Heart3DPage.css'

function Heart3DPage() {
    const { t } = useTranslation()
    const appUrl = `${import.meta.env.BASE_URL}coeur-3d/index.html`

    return (
        <div className="heart-page">
            <div className="heart-page-intro">
                <div className="container heart-page-intro-inner">
                    <span className="heart-kicker"><HeartPulse size={17} aria-hidden="true" /> {t('heart3d.eyebrow')}</span>
                    <h1>{t('heart3d.title')}</h1>
                    <p>{t('heart3d.description')}</p>
                </div>
            </div>
            <section className="container heart-explorer" aria-label={t('heart3d.frameTitle')}>
                <div className="heart-explorer-toolbar">
                    <p>{t('heart3d.hint')}</p>
                    <a href={appUrl} target="_blank" rel="noopener noreferrer">
                        {t('heart3d.open')} <ArrowUpRight size={17} aria-hidden="true" />
                    </a>
                </div>
                <iframe
                    className="heart-explorer-frame"
                    src={appUrl}
                    title={t('heart3d.frameTitle')}
                    allowFullScreen
                />
            </section>
        </div>
    )
}

export default Heart3DPage
