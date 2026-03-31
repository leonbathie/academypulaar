import { useState, useEffect, useCallback, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import logoGif from '../assets/logo-academie.gif'
import './LoginPage.css'

function LoginPage() {
    const { login, loginWithGoogle, isAuthenticated, loading, GOOGLE_CLIENT_ID } = useAuth()
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const googleBtnRef = useRef(null)

    const handleGoogleCallback = useCallback(async (response) => {
        setError('')
        setIsLoading(true)
        try {
            await loginWithGoogle(response.credential)
            navigate('/admin')
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }, [loginWithGoogle, navigate])

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || isAuthenticated) return

        const renderGoogleButton = () => {
            if (!window.google?.accounts?.id || !googleBtnRef.current) return
            // Vider le conteneur avant re-render (GSI ne supporte pas le re-render sur un div déjà rendu)
            googleBtnRef.current.innerHTML = ''
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCallback
            })
            window.google.accounts.id.renderButton(googleBtnRef.current, {
                theme: 'outline',
                size: 'large',
                width: Math.min(googleBtnRef.current.offsetWidth || 320, 400),
                text: 'signin_with',
                locale: i18n.language === 'ff' ? 'fr' : i18n.language
            })
        }

        // Load Google Identity Services script
        const existingScript = document.getElementById('google-gsi')
        if (existingScript) {
            renderGoogleButton()
            return
        }

        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.id = 'google-gsi'
        script.async = true
        script.defer = true
        script.onload = renderGoogleButton
        script.onerror = () => console.error('Failed to load Google Sign-In')
        document.head.appendChild(script)
    }, [GOOGLE_CLIENT_ID, isAuthenticated, handleGoogleCallback, i18n.language])

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
                    <img src={logoGif} alt="Goomu Fulo Wiɗto" className="login-logo" />
                    <h1>Goomu Fulo Wiɗto</h1>
                    <p>{t('admin.loginTitle', 'Administration')}</p>
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
                        <label htmlFor="username">{t('admin.login.username', "Nom d'utilisateur")}</label>
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
                        <label htmlFor="password">{t('admin.login.password', 'Mot de passe')}</label>
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
                                {t('admin.login.connecting', 'Connexion...')}
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
                                </svg>
                                {t('admin.login.submit', 'Se connecter')}
                            </>
                        )}
                    </button>
                </form>

                {GOOGLE_CLIENT_ID && (
                    <>
                        <div className="login-divider">
                            <span>{t('admin.login.or', 'ou')}</span>
                        </div>
                        {i18n.language === 'ff' && (
                            <p className="google-label-ff">{t('admin.login.googleLogin', 'Seŋoraade Google')}</p>
                        )}
                        <div ref={googleBtnRef} className="google-btn-container"></div>
                    </>
                )}

                <div className="login-footer">
                    <a href="/">← {t('admin.login.backToSite', 'Retour au site')}</a>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
