import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useApi, useAuth } from '../../context/AuthContext'

function DashboardAdmin() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { apiRequest } = useApi()
    const { isSuperAdmin } = useAuth()
    const [stats, setStats] = useState({
        dictionary: 0,
        news: 0,
        content: 0,
        books: 0,
        questions: 0
    })
    const [visitStats, setVisitStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadStats()
        if (isSuperAdmin) loadVisitStats()
    }, [])

    const loadStats = async () => {
        try {
            const [dictionary, news, content, books, questions] = await Promise.all([
                apiRequest('/dictionary'),
                apiRequest('/news'),
                apiRequest('/content/dire'),
                apiRequest('/books'),
                apiRequest('/questions')
            ])

            setStats({
                dictionary: dictionary.length,
                news: news.length,
                content: content.length,
                books: books.length,
                questions: questions.length
            })
        } catch (error) {
            console.error('Error loading stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadVisitStats = async () => {
        try {
            const data = await apiRequest('/visits/stats')
            setVisitStats(data)
        } catch (error) {
            console.error('Error loading visit stats:', error)
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
                {t('admin.dashboard.title')}
            </h1>

            <div className="stats-grid">
                <div className="stat-card stat-card-clickable" onClick={() => navigate('/admin/dictionnaire')}>
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.dictionary}</h3>
                        <p>{t('admin.dashboard.stats.words')}</p>
                    </div>
                </div>

                <div className="stat-card stat-card-clickable" onClick={() => navigate('/admin/actualites')}>
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1" />
                            <path d="M21 16V8a2 2 0 0 0-2-2h-2" />
                            <path d="M7 8h4M7 12h8M7 16h6" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.news}</h3>
                        <p>{t('admin.dashboard.stats.news')}</p>
                    </div>
                </div>

                <div className="stat-card stat-card-clickable" onClick={() => navigate('/admin/contenu')}>
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.content}</h3>
                        <p>{t('admin.dashboard.stats.content')}</p>
                    </div>
                </div>

                <div className="stat-card stat-card-clickable" onClick={() => navigate('/admin/bibliotheque')}>
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.books}</h3>
                        <p>{t('admin.dashboard.stats.books')}</p>
                    </div>
                </div>

                <div className="stat-card stat-card-clickable" onClick={() => navigate('/admin/questions')}>
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <h3>{stats.questions}</h3>
                        <p>{t('admin.dashboard.stats.questions')}</p>
                    </div>
                </div>
            </div>

            {isSuperAdmin && visitStats && (
                <div className="admin-card visitors-panel">
                    <h2>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 24, height: 24, verticalAlign: 'middle', marginRight: 8 }}>
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        {t('admin.dashboard.visitors.title', 'Statistiques des visiteurs')}
                    </h2>

                    <div className="visitors-stats-grid">
                        <div className="visitor-stat-card visitor-today">
                            <div className="visitor-stat-number">{visitStats.today.uniqueVisitors}</div>
                            <div className="visitor-stat-label">{t('admin.dashboard.visitors.today', "Aujourd'hui")}</div>
                            <div className="visitor-stat-detail">{visitStats.today.visits} {t('admin.dashboard.visitors.pageViews', 'pages vues')}</div>
                        </div>
                        <div className="visitor-stat-card visitor-week">
                            <div className="visitor-stat-number">{visitStats.week}</div>
                            <div className="visitor-stat-label">{t('admin.dashboard.visitors.thisWeek', 'Cette semaine')}</div>
                        </div>
                        <div className="visitor-stat-card visitor-month">
                            <div className="visitor-stat-number">{visitStats.month}</div>
                            <div className="visitor-stat-label">{t('admin.dashboard.visitors.thisMonth', 'Ce mois')}</div>
                        </div>
                        <div className="visitor-stat-card visitor-total">
                            <div className="visitor-stat-number">{visitStats.total.uniqueVisitors}</div>
                            <div className="visitor-stat-label">{t('admin.dashboard.visitors.totalUnique', 'Visiteurs uniques')}</div>
                            <div className="visitor-stat-detail">{visitStats.total.visits} {t('admin.dashboard.visitors.totalVisits', 'visites totales')}</div>
                        </div>
                    </div>

                    {visitStats.dailyStats.length > 0 && (
                        <div className="visitors-chart">
                            <h3>{t('admin.dashboard.visitors.last30days', '30 derniers jours')}</h3>
                            <div className="chart-bars">
                                {visitStats.dailyStats.map((day, i) => {
                                    const maxVisits = Math.max(...visitStats.dailyStats.map(d => d.visits), 1)
                                    const height = Math.max((day.visits / maxVisits) * 100, 4)
                                    const date = new Date(day.date)
                                    const label = `${date.getDate()}/${date.getMonth() + 1}`
                                    return (
                                        <div key={i} className="chart-bar-wrapper" title={`${label}: ${day.unique_visitors} visiteurs, ${day.visits} pages`}>
                                            <div className="chart-bar" style={{ height: `${height}%` }}>
                                                <span className="chart-bar-value">{day.unique_visitors}</span>
                                            </div>
                                            {i % 5 === 0 && <span className="chart-bar-label">{label}</span>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {visitStats.topPages.length > 0 && (
                        <div className="visitors-top-pages">
                            <h3>{t('admin.dashboard.visitors.topPages', 'Pages les plus visitées')}</h3>
                            <div className="top-pages-list">
                                {visitStats.topPages.map((page, i) => {
                                    const maxCount = visitStats.topPages[0]?.count || 1
                                    return (
                                        <div key={i} className="top-page-item">
                                            <span className="top-page-rank">#{i + 1}</span>
                                            <span className="top-page-name">{page.page === '/' ? t('admin.dashboard.visitors.homePage', 'Accueil') : page.page}</span>
                                            <div className="top-page-bar-bg">
                                                <div className="top-page-bar" style={{ width: `${(page.count / maxCount) * 100}%` }}></div>
                                            </div>
                                            <span className="top-page-count">{page.unique_count} <small>{t('admin.dashboard.visitors.visitors', 'visiteurs')}</small></span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="admin-card">
                <h2>{t('admin.dashboard.welcomeCard.title')}</h2>
                <p style={{ color: 'var(--medium-gray)', lineHeight: 1.7 }}>
                    {t('admin.dashboard.welcomeCard.text')}
                </p>
                <ul style={{ marginTop: '1rem', color: 'var(--dark-gray)', lineHeight: 2 }}>
                    <li><strong>{t('admin.sidebar.dictionary')}</strong> - {t('admin.dashboard.welcomeCard.dict')}</li>
                    <li><strong>{t('admin.sidebar.news')}</strong> - {t('admin.dashboard.welcomeCard.news')}</li>
                    <li><strong>{t('admin.sidebar.content')}</strong> - {t('admin.dashboard.welcomeCard.content')}</li>
                    <li><strong>{t('admin.sidebar.library')}</strong> - {t('admin.dashboard.welcomeCard.library')}</li>
                    <li><strong>{t('admin.sidebar.questions')}</strong> - {t('admin.dashboard.welcomeCard.questions')}</li>
                </ul>
            </div>
        </div>
    )
}

export default DashboardAdmin
