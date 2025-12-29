import { useState } from 'react'
import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AdminPage.css'

function AdminPage() {
    const { user, logout, isAuthenticated, isAdmin, loading } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(true)

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="spinner-large"></div>
                <p>Chargement...</p>
            </div>
        )
    }

    if (!isAuthenticated || !isAdmin) {
        return <Navigate to="/login" replace />
    }

    return (
        <div className="admin-layout">
            <aside className={`admin-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
                <div className="sidebar-header">
                    <h2>GoomuFuloWiɗto</h2>
                    <span>Administration</span>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/admin" end className="nav-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span>Tableau de bord</span>
                    </NavLink>

                    <NavLink to="/admin/dictionnaire" className="nav-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        <span>Dictionnaire</span>
                    </NavLink>

                    <NavLink to="/admin/membres" className="nav-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span>Membres</span>
                    </NavLink>

                    <NavLink to="/admin/actualites" className="nav-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1" />
                            <path d="M21 16V8a2 2 0 0 0-2-2h-2" />
                            <path d="M7 8h4M7 12h8M7 16h6" />
                        </svg>
                        <span>Actualités</span>
                    </NavLink>

                    <NavLink to="/admin/contenu" className="nav-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span>Dire, Ne pas dire</span>
                    </NavLink>

                    <NavLink to="/admin/bibliotheque" className="nav-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            <path d="M8 7h8M8 11h8M8 15h4" />
                        </svg>
                        <span>Bibliothèque</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <a href="/" className="nav-item" target="_blank">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        <span>Voir le site</span>
                    </a>
                    <button onClick={logout} className="nav-item logout">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Déconnexion</span>
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
                    <div className="header-user">
                        <span>Bienvenue, <strong>{user?.username}</strong></span>
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
