import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import logoGif from '../assets/logo-academie.gif'
import './Footer.css'

function Footer() {
    const { t } = useTranslation()

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
                                    <img src={logoGif} alt="Goomu Fulo Wiɗto" className="logo-image" />
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
                            <h4 className="footer-title">{t('footer.language')}</h4>
                            <ul className="footer-links">
                                <li>
                                    <Link to="/dictionnaire">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                        {t('nav.dictionary')}
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/dire">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                        {t('nav.sayDontSay')}
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/questions-langue">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                                        {t('nav.languageQuestions')}
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/terminologie">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                                        {t('nav.terminology')}
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
                                    <span>Dakar, Sénégal</span>
                                </div>
                                <div className="contact-item">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                    <a href="mailto:contact@goomufulowidto.org">contact@goomufulowidto.org</a>
                                </div>
                            </div>

                            <div className="footer-social">
                                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                </a>
                                <a href="#" className="social-link" aria-label="RSS">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
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
