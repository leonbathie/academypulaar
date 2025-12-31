import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import './LoginPage.css'

function LoginPage() {
    const { login, isAuthenticated, loading } = useAuth()
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    if (loading) {
        return <div className="login-loading">Chargement...</div>
    }

    if (isAuthenticated) {
        return <Navigate to="/admin" replace />
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            await login(username, password)
            navigate('/admin')
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <svg viewBox="0 0 60 60" fill="none" style={{ width: '80px', height: '80px', color: 'var(--primary-gold)', marginBottom: '1rem' }}>
                        <circle cx="30" cy="30" r="28" stroke="currentColor" strokeWidth="2" />
                        <path d="M30 10 L30 50 M15 25 L45 25 M15 35 L45 35" stroke="currentColor" strokeWidth="2" />
                        <circle cx="30" cy="30" r="8" fill="currentColor" />
                    </svg>
                    <h1>Goomu Fulo Wiɗto</h1>
                    <p>Administration</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="login-error">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v4M12 16h.01" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="username">Nom d'utilisateur</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="admin"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mot de passe</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <span className="spinner"></span>
                                Connexion...
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
                                </svg>
                                Se connecter
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <a href="/">← Retour au site</a>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
