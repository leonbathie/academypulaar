import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './NotFoundPage.css'

function NotFoundPage() {
    const { i18n } = useTranslation()

    const content = {
        fr: {
            title: 'Page non trouvée',
            message: 'La page que vous recherchez n\'existe pas ou a été déplacée.',
            back: 'Retour à l\'accueil'
        },
        en: {
            title: 'Page not found',
            message: 'The page you are looking for does not exist or has been moved.',
            back: 'Back to home'
        },
        ff: {
            title: 'Taƴre yiytaaka',
            message: 'Taƴre nde njiɗ-ɗaa ndee tawaaka walla egginaama.',
            back: 'Rutto jaɓɓorgo'
        }
    }

    const c = content[i18n.language] || content.fr

    return (
        <div className="not-found-page">
            <div className="not-found-content">
                <div className="not-found-code">404</div>
                <h1 className="not-found-title">{c.title}</h1>
                <p className="not-found-message">{c.message}</p>
                <Link to="/" className="btn btn-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    {c.back}
                </Link>
            </div>
        </div>
    )
}

export default NotFoundPage
