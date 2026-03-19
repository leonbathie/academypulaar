import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../context/AuthContext'

function DashboardAdmin() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { apiRequest } = useApi()
    const [stats, setStats] = useState({
        dictionary: 0,
        news: 0,
        content: 0,
        books: 0,
        questions: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadStats()
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
