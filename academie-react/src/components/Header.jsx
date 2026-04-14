import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../context/ThemeContext'
import logoGif from '../assets/logo-academie.gif'
import './Header.css'

const languages = [
    { code: 'fr', name: 'Français', flag: 'FR' },
    { code: 'en', name: 'English', flag: 'En' },
    { code: 'ff', name: 'Fulfulde', flag: 'FF' }
]

function Header() {
    const { t, i18n } = useTranslation()
    const { isDark, toggleTheme } = useTheme()
    const location = useLocation()
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [activeSubmenu, setActiveSubmenu] = useState(null)
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)

    const currentLang = languages.find(l => l.code === i18n.language) || languages[0]

    // Pages with light backgrounds need dark header text
    const darkPages = ['/', '/admin']
    const isLightPage = !darkPages.some(p => location.pathname === p || (p === '/admin' && location.pathname.startsWith('/admin')))

    const menuItems = [
        {
            title: t('nav.institution'),
            submenu: [
                { title: t('nav.history'), link: "/a-propos" },
                { title: t('nav.missions'), link: "/a-propos" }
            ]
        },
        {
            title: t('nav.dictionary'),
            link: "/dictionnaire"
        },
        {
            title: t('nav.terminology'),
            link: "/terminologie"
        },
        {
            title: t('nav.languageQuestions'),
            link: "/questions-langue"
        },
        {
            title: t('common.library'),
            link: "/bibliotheque"
        },
        {
            title: t('common.contact'),
            link: "/contact"
        }
    ]

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        // Close mobile menu on route change
        setIsMobileMenuOpen(false)
        setActiveSubmenu(null)
    }, [location])

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
        setActiveSubmenu(null)
    }

    const handleSubmenuToggle = (index) => {
        setActiveSubmenu(activeSubmenu === index ? null : index)
    }

    const changeLanguage = (langCode) => {
        i18n.changeLanguage(langCode)
        setIsLangMenuOpen(false)
    }

    return (
        <>
            <header className={`header ${isScrolled ? 'scrolled' : ''} ${isLightPage && !isDark ? 'light-page' : ''}`}>
                <div className="header-container">
                    <Link to="/" className="logo">
                        <div className="logo-icon">
                            <img src={logoGif} alt="Goomu Fulo Wiɗto" className="logo-image" />
                        </div>
                        <div className="logo-text">
                            <span className="logo-title">{t('common.siteName')}</span>
                            <span className="logo-subtitle">{t('common.siteSlogan')}</span>
                        </div>
                    </Link>

                    <nav className="nav nav-desktop">
                        <ul className="nav-list">
                            {menuItems.map((item, index) => (
                                <li
                                    key={index}
                                    className={`nav-item ${item.submenu ? 'has-submenu' : ''}`}
                                    onMouseEnter={() => item.submenu && setActiveSubmenu(index)}
                                    onMouseLeave={() => setActiveSubmenu(null)}
                                >
                                    {item.submenu ? (
                                        <>
                                            <button
                                                className="nav-link"
                                                onClick={() => handleSubmenuToggle(index)}
                                                aria-expanded={activeSubmenu === index}
                                            >
                                                {item.title}
                                                <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M6 9l6 6 6-6" />
                                                </svg>
                                            </button>
                                            <ul className={`submenu ${activeSubmenu === index ? 'open' : ''}`}>
                                                {item.submenu.map((subItem, subIndex) => (
                                                    <li key={subIndex}>
                                                        <Link to={subItem.link} className="submenu-link">
                                                            {subItem.title}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    ) : (
                                        <Link to={item.link} className="nav-link">{item.title}</Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="header-actions">
                        <button
                            className="theme-toggle"
                            onClick={toggleTheme}
                            aria-label={isDark ? 'Mode clair' : 'Mode sombre'}
                        >
                            {isDark ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="5" />
                                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                </svg>
                            )}
                        </button>

                        <div className="lang-selector">
                            <button
                                className="lang-btn"
                                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                                aria-label="Changer la langue"
                            >
                                <span className="lang-flag">{currentLang.flag}</span>
                                <span className="lang-code">{currentLang.code.toUpperCase()}</span>
                                <svg className={`chevron ${isLangMenuOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </button>
                            <ul className={`lang-menu ${isLangMenuOpen ? 'open' : ''}`}>
                                {languages.map((lang) => (
                                    <li key={lang.code}>
                                        <button
                                            className={`lang-option ${i18n.language === lang.code ? 'active' : ''}`}
                                            onClick={() => changeLanguage(lang.code)}
                                        >
                                            <span className="lang-flag">{lang.flag}</span>
                                            <span className="lang-name">{lang.name}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            className={`mobile-menu-btn ${isMobileMenuOpen ? 'open' : ''}`}
                            onClick={toggleMobileMenu}
                            aria-label="Menu"
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Nav mobile HORS du header pour éviter le stacking context */}
            <nav className={`nav nav-mobile ${isMobileMenuOpen ? 'open' : ''}`}>
                <ul className="nav-list">
                    {menuItems.map((item, index) => (
                        <li
                            key={index}
                            className={`nav-item ${item.submenu ? 'has-submenu' : ''}`}
                        >
                            {item.submenu ? (
                                <>
                                    <button
                                        className="nav-link"
                                        onClick={() => handleSubmenuToggle(index)}
                                        aria-expanded={activeSubmenu === index}
                                    >
                                        {item.title}
                                        <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M6 9l6 6 6-6" />
                                        </svg>
                                    </button>
                                    <ul className={`submenu ${activeSubmenu === index ? 'open' : ''}`}>
                                        {item.submenu.map((subItem, subIndex) => (
                                            <li key={subIndex}>
                                                <Link to={subItem.link} className="submenu-link" onClick={() => setIsMobileMenuOpen(false)}>
                                                    {subItem.title}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <Link to={item.link} className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>{item.title}</Link>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    )
}

export default Header
