import { useState, useEffect } from 'react'
import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import logoGif from '../assets/logo-academie.gif'
import './AdminPage.css'

function AdminPage() {
    const { t, i18n } = useTranslation()
    const { user, logout, isAuthenticated, isAdmin, loading } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768)
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)

    const languages = [
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'ff', name: 'Fulfulde', flag: '🇸🇳' }
    ]

    const currentLang = languages.find(l => l.code === i18n.language) || languages[0]

    const changeLanguage = (langCode) => {
        i18n.changeLanguage(langCode)
        setIsLangMenuOpen(false)
    }

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setSidebarOpen(false)
            } else {
                setSidebarOpen(true)
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
    const closeSidebarMobile = () => {
        if (window.innerWidth <= 768) {
            setSidebarOpen(false)
        }
    }

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="spinner-large"></div>
                <p>{t('admin.header.loading')}</p>
            </div>
        )
    }

    if (!isAuthenticated || !isAdmin) {
        return <Navigate to="/login" replace />
    }

    return (
        <div className="admin-layout">
            {/* Overlay pour mobile */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            <aside className={`admin-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
                <div className="sidebar-header">
                    <img src={logoGif} alt="Goomu Fulo Wiɗto" className="admin-sidebar-logo" />
                    <h2>Goomu Fulo Wiɗto</h2>
                    <span>{t('admin.header.welcome')}</span>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/admin" end className="nav-item" onClick={closeSidebarMobile}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span>{t('admin.sidebar.dashboard')}</span>
                    </NavLink>

                    <NavLink to="/admin/dictionnaire" className="nav-item" onClick={closeSidebarMobile}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        <span>{t('admin.sidebar.dictionary')}</span>
                    </NavLink>

                    <NavLink to="/admin/actualites" className="nav-item" onClick={closeSidebarMobile}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1" />
                            <path d="M21 16V8a2 2 0 0 0-2-2h-2" />
                            <path d="M7 8h4M7 12h8M7 16h6" />
                        </svg>
                        <span>{t('admin.sidebar.news')}</span>
                    </NavLink>

                    <NavLink to="/admin/contenu" className="nav-item" onClick={closeSidebarMobile}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span>{t('admin.sidebar.content')}</span>
                    </NavLink>

                    <NavLink to="/admin/bibliotheque" className="nav-item" onClick={closeSidebarMobile}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            <path d="M8 7h8M8 11h8M8 15h4" />
                        </svg>
                        <span>{t('admin.sidebar.library')}</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <a href="/" className="nav-item" target="_blank" onClick={closeSidebarMobile}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        <span>{t('admin.sidebar.viewSite')}</span>
                    </a>
                    <button onClick={() => { logout(); closeSidebarMobile(); }} className="nav-item logout">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>{t('admin.sidebar.logout')}</span>
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <button
                        className="sidebar-toggle"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                    <div className="header-right">
                        <div className="admin-lang-selector">
                            <button
                                className="admin-lang-btn"
                                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                            >
                                <span className="admin-lang-flag">{currentLang.flag}</span>
                                <span className="admin-lang-code">{currentLang.code.toUpperCase()}</span>
                                <svg className={`chevron ${isLangMenuOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </button>
                            {isLangMenuOpen && (
                                <ul className="admin-lang-menu">
                                    {languages.map((lang) => (
                                        <li key={lang.code}>
                                            <button
                                                className={`admin-lang-option ${i18n.language === lang.code ? 'active' : ''}`}
                                                onClick={() => changeLanguage(lang.code)}
                                            >
                                                <span className="admin-lang-flag">{lang.flag}</span>
                                                <span className="admin-lang-name">{lang.name}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="header-user">
                            <span>{t('admin.header.welcome')}, <strong>{user?.username}</strong></span>
                        </div>
                    </div>
                </header>

                <div className="admin-content">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

export default AdminPage
