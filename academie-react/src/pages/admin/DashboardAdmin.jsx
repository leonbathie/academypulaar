import { useState, useEffect } from 'react'
import { useApi } from '../../context/AuthContext'

function DashboardAdmin() {
    const { apiRequest } = useApi()
    const [stats, setStats] = useState({
        dictionary: 0,
        members: 0,
        news: 0,
        content: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            const [dictionary, members, news, content] = await Promise.all([
                apiRequest('/dictionary'),
                apiRequest('/members'),
                apiRequest('/news'),
                apiRequest('/content/dire')
            ])

            setStats({
                dictionary: dictionary.length,
                members: members.length,
                news: news.length,
                content: content.length
            })
        } catch (error) {
            console.error('Error loading stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="spinner-large"></div>
            </div>
        )
    }

    return (
        <div>
            <h1 style={{ marginBottom: '2rem', fontFamily: 'var(--font-display)' }}>
                Tableau de bord
            </h1>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.dictionary}</h3>
                        <p>Mots dans le dictionnaire</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.members}</h3>
                        <p>Membres / Érudits</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1" />
                            <path d="M21 16V8a2 2 0 0 0-2-2h-2" />
                            <path d="M7 8h4M7 12h8M7 16h6" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.news}</h3>
                        <p>Actualités publiées</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.content}</h3>
                        <p>Expressions "Dire, Ne pas dire"</p>
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <h2>Bienvenue dans l'administration</h2>
                <p style={{ color: 'var(--medium-gray)', lineHeight: 1.7 }}>
                    Utilisez le menu de gauche pour gérer le contenu du site GoomuFuloWiɗto :
                </p>
                <ul style={{ marginTop: '1rem', color: 'var(--dark-gray)', lineHeight: 2 }}>
                    <li><strong>Dictionnaire</strong> - Ajouter, modifier ou supprimer des mots</li>
                    <li><strong>Membres</strong> - Gérer les érudits et leurs biographies</li>
                    <li><strong>Actualités</strong> - Publier des nouvelles et articles</li>
                    <li><strong>Dire, Ne pas dire</strong> - Gérer les expressions linguistiques</li>
                </ul>
            </div>
        </div>
    )
}

export default DashboardAdmin
