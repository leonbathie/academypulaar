import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import logoGif from '../assets/logo-academie.webp'
import { useSettings } from '../context/SettingsContext'
import { useAuth } from '../context/AuthContext'
import './Footer.css'

function Footer() {
    const { t } = useTranslation()
    const { settings } = useSettings()
    const { isAdmin } = useAuth()
    const showTerminologie = settings.terminologie_visible !== false || isAdmin

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <footer className="footer">
            {/* Decorative top border */}
            <div className="footer-accent-bar"></div>

            <div className="footer-main">
                <div className="container">
                    <div className="footer-grid">
                        {/* Brand Column */}
                        <div className="footer-brand">
                            <Link to="/" className="footer-logo">
                                <div className="logo-icon">
                                    <img
                                        src={logoGif}
                                        alt="Goomu Fulo Wiɗto"
                                        className="logo-image"
                                        width="100"
                                        height="100"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                                <div className="logo-text">
                                    <span className="logo-title">{t('common.siteName')}</span>
                                    <span className="logo-subtitle">{t('common.siteSlogan')}</span>
                                </div>
                            </Link>
                            <p className="footer-description">
                                {t('footer.description')}
                            </p>
                        </div>

                        {/* Navigation Column */}
                        <div className="footer-nav-col">
                            <h4 className="footer-title">FULFULDE</h4>
                            <ul className="footer-links">
                                <li>
                                    <Link to="/dictionnaire">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                        {t('nav.dictionary')}
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/questions-langue">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                                        {t('nav.languageQuestions')}
                                    </Link>
                                </li>
                                {showTerminologie && (
                                    <li>
                                        <Link to="/terminologie">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                                            Kelmeendi
                                        </Link>
                                    </li>
                                )}
                                <li>
                                    <Link to="/dire">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                        {t('nav.sayDontSay')}
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Contact & Social Column */}
                        <div className="footer-contact-col">
                            <h4 className="footer-title">{t('footer.contactTitle')}</h4>
                            <div className="footer-contact-info">
                                <div className="contact-item">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                    <span>Mauritanie</span>
                                </div>
                                <div className="contact-item">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                    <a href="mailto:goomufulo@gmail.com">goomufulo@gmail.com</a>
                                </div>
                            </div>

                            <div className="footer-social">
                                <a href="https://www.facebook.com/share/18qA7up8yf/" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                                    </svg>
                                </a>
                                <a href="https://www.tiktok.com/@goomu.fulo.wito" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="TikTok">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                                    </svg>
                                </a>
                                <a href="https://youtube.com/channel/UC7ky0AVMGiaspJzKAOAFVoQ" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="YouTube">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="footer-bottom">
                <div className="container">
                    <div className="footer-bottom-content">
                        <p className="footer-copyright">
                            © {new Date().getFullYear()} {t('footer.copyright')}
                        </p>
                        <nav className="footer-legal">
                            <Link to="/mentions-legales">{t('footer.legalNotice')}</Link>
                            <span className="legal-separator">•</span>
                            <Link to="/confidentialite">{t('footer.privacy')}</Link>
                        </nav>
                        <button className="back-to-top" onClick={scrollToTop} aria-label="Retour en haut">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="m18 15-6-6-6 6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
