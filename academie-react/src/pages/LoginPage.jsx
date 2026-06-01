import { useEffect, useCallback, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import logoGif from '../assets/logo-academie.webp'
import './LoginPage.css'

function LoginPage() {
    const { loginWithGoogle, isAuthenticated, loading, GOOGLE_CLIENT_ID } = useAuth()
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
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
            // Vider le conteneur avant re-render (GSI ne supporte pas le re-render sur un div deja rendu)
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

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <img src={logoGif} alt="Goomu Fulo Wiɗto" className="login-logo" />
                    <h1>Goomu Fulo Wiɗto</h1>
                    <p>{t('admin.loginTitle', 'Administration')}</p>
                </div>

                {error && (
                    <div className="login-error">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v4M12 16h.01" />
                        </svg>
                        {error}
                    </div>
                )}

                {GOOGLE_CLIENT_ID ? (
                    <div className="login-google-only">
                        {i18n.language === 'ff' && (
                            <p className="google-label-ff">{t('admin.login.googleLogin', 'Seŋoraade Google')}</p>
                        )}
                        <div ref={googleBtnRef} className="google-btn-container" aria-busy={isLoading}></div>
                        {isLoading && (
                            <p className="login-loading-text">
                                <span className="spinner"></span>
                                {t('admin.login.connecting', 'Connexion...')}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="login-error">
                        Google Sign-In n'est pas configuré (GOOGLE_CLIENT_ID manquant). Contactez l'administrateur.
                    </div>
                )}

                <div className="login-footer">
                    <a href="/">← {t('admin.login.backToSite', 'Retour au site')}</a>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
