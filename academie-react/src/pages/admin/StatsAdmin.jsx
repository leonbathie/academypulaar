import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi, useAuth } from '../../context/AuthContext'
import { Navigate } from 'react-router-dom'

function StatsAdmin() {
    const { t } = useTranslation()
    const { apiRequest } = useApi()
    const { isSuperAdmin } = useAuth()
    const [visitStats, setVisitStats] = useState(null)
    const [searchStats, setSearchStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('visitors')

    const loadVisitStats = async () => {
        try {
            const data = await apiRequest('/visits/stats')
            setVisitStats(data)
        } catch (error) {
            console.error('Error loading visit stats:', error)
        }
    }

    const loadSearchStats = async () => {
        try {
            const data = await apiRequest('/dictionary/search-stats')
            setSearchStats(data)
        } catch (error) {
            console.error('Error loading search stats:', error)
        }
    }

    useEffect(() => {
        if (!isSuperAdmin) return
        Promise.all([loadVisitStats(), loadSearchStats()]).finally(() => setLoading(false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!isSuperAdmin) return <Navigate to="/admin" replace />

    if (loading) {
        return <div className="admin-loading"><div className="spinner-large"></div></div>
    }

    return (
        <div>
            <h1 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 28, height: 28, verticalAlign: 'middle', marginRight: 10 }}>
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                {t('admin.stats.pageTitle', 'Statistiques')}
            </h1>

            {/* Tabs */}
            <div className="stats-tabs">
                <button
                    className={`stats-tab ${activeTab === 'visitors' ? 'active' : ''}`}
                    onClick={() => setActiveTab('visitors')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    {t('admin.stats.visitorsTab', 'Visiteurs')}
                </button>
                <button
                    className={`stats-tab ${activeTab === 'searches' ? 'active' : ''}`}
                    onClick={() => setActiveTab('searches')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    {t('admin.stats.searchesTab', 'Recherches')}
                    {searchStats && <span className="stats-tab-badge">{searchStats.totalSearches}</span>}
                </button>
            </div>

            {/* Visiteurs */}
            {activeTab === 'visitors' && visitStats && (
                <div className="stats-section">
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
                        <div className="admin-card">
                            <h2>{t('admin.dashboard.visitors.last30days', '30 derniers jours')}</h2>
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
                                            {i % 3 === 0 && <span className="chart-bar-label">{label}</span>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {visitStats.topPages.length > 0 && (
                        <div className="admin-card">
                            <h2>{t('admin.dashboard.visitors.topPages', 'Pages les plus visitées')}</h2>
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

            {/* Recherches */}
            {activeTab === 'searches' && searchStats && (
                <div className="stats-section">
                    <div className="search-stats-columns">
                        <div className="admin-card search-stats-col-card">
                            <h3>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, verticalAlign: 'middle', marginRight: 6 }}>
                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                    <polyline points="17 6 23 6 23 12" />
                                </svg>
                                {t('admin.dashboard.search.topSearches', 'Termes les plus recherchés')}
                            </h3>
                            {searchStats.topSearches.length > 0 ? (
                                <div className="search-list">
                                    {searchStats.topSearches.map((s, i) => (
                                        <div key={i} className="search-list-item">
                                            <span className="search-rank">#{i + 1}</span>
                                            <span className="search-term">"{s.term}"</span>
                                            <span className="search-count">{s.count}x</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="search-empty">{t('admin.dashboard.search.noData', 'Pas encore de données')}</p>
                            )}
                        </div>

                        <div className="admin-card search-stats-col-card">
                            <h3>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, verticalAlign: 'middle', marginRight: 6 }}>
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                </svg>
                                {t('admin.dashboard.search.topWords', 'Mots les plus consultés')}
                            </h3>
                            {searchStats.topWords.length > 0 ? (
                                <div className="search-list">
                                    {searchStats.topWords.map((w, i) => (
                                        <div key={i} className="search-list-item">
                                            <span className="search-rank">#{i + 1}</span>
                                            <span className="search-term">
                                                <strong>{w.word}</strong>
                                                {w.translation_fr && <small> — {w.translation_fr}</small>}
                                            </span>
                                            <span className="search-count">{w.view_count}x</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="search-empty">{t('admin.dashboard.search.noData', 'Pas encore de données')}</p>
                            )}
                        </div>

                        <div className="admin-card search-stats-col-card">
                            <h3>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, verticalAlign: 'middle', marginRight: 6 }}>
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                {t('admin.dashboard.search.recentSearches', 'Recherches récentes')}
                            </h3>
                            {searchStats.recentSearches.length > 0 ? (
                                <div className="search-list search-list-recent">
                                    {searchStats.recentSearches.map((s, i) => (
                                        <div key={i} className="search-list-item search-recent-item">
                                            <span className="search-term">"{s.term}"</span>
                                            <span className="search-results-count">
                                                {s.results_count} {t('admin.dashboard.search.results', 'résultats')}
                                            </span>
                                            <span className="search-time">
                                                {new Date(s.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="search-empty">{t('admin.dashboard.search.noData', 'Pas encore de données')}</p>
                            )}
                        </div>

                        <div className="admin-card search-stats-col-card search-stats-col-card--notfound">
                            <h3>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, verticalAlign: 'middle', marginRight: 6 }}>
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    <line x1="8" y1="8" x2="14" y2="14" />
                                    <line x1="14" y1="8" x2="8" y2="14" />
                                </svg>
                                {t('admin.dashboard.search.notFound', 'Termes non trouvés')}
                            </h3>
                            {searchStats.notFoundSearches && searchStats.notFoundSearches.length > 0 ? (
                                <div className="search-list">
                                    {searchStats.notFoundSearches.map((s, i) => (
                                        <div key={i} className="search-list-item search-notfound-item">
                                            <span className="search-rank">#{i + 1}</span>
                                            <span className="search-term search-term--notfound">"{s.term}"</span>
                                            <span className="search-count">{s.count}x</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="search-empty">{t('admin.dashboard.search.allFound', 'Tous les termes ont eu des résultats')}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default StatsAdmin
