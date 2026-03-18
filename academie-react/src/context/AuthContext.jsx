import { createContext, useContext, useState, useEffect } from 'react'
import { API_URL, GOOGLE_CLIENT_ID } from '../config'

const AuthContext = createContext()

const API_BASE = `${API_URL}/api`

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(() => localStorage.getItem('token'))
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (token) {
            fetchUser()
        } else {
            setLoading(false)
        }
    }, [token])

    const fetchUser = async () => {
        try {
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const userData = await response.json()
                setUser(userData)
            } else {
                logout()
            }
        } catch (error) {
            console.error('Auth error:', error)
            logout()
        } finally {
            setLoading(false)
        }
    }

    const login = async (username, password) => {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Erreur de connexion')
        }

        localStorage.setItem('token', data.token)
        setToken(data.token)
        setUser(data.user)
        return data
    }

    const loginWithGoogle = async (credential) => {
        const response = await fetch(`${API_BASE}/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ credential })
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Erreur de connexion Google')
        }

        localStorage.setItem('token', data.token)
        setToken(data.token)
        setUser(data.user)
        return data
    }

    const logout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
    }

    const isAuthenticated = !!user
    const isAdmin = user?.role === 'admin'
    const isSuperAdmin = !!user?.isSuperAdmin
    const canWrite = user?.role === 'admin' || user?.role === 'moderateur'
    const canRead = !!user

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            loginWithGoogle,
            logout,
            isAuthenticated,
            isAdmin,
            isSuperAdmin,
            canWrite,
            canRead,
            GOOGLE_CLIENT_ID
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

// Hook pour les requêtes API authentifiées
export function useApi() {
    const { token } = useAuth()

    const apiRequest = async (endpoint, options = {}, retries = 2) => {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await fetch(`${API_BASE}${endpoint}`, {
                    ...options,
                    headers
                })

                // Retry on 408 (connection reuse race condition)
                if (response.status === 408 && attempt < retries) {
                    await new Promise(r => setTimeout(r, 300 * (attempt + 1)))
                    continue
                }

                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || 'Erreur API')
                }

                return data
            } catch (error) {
                if (attempt < retries && (error.name === 'TypeError' || error.message?.includes('408'))) {
                    await new Promise(r => setTimeout(r, 300 * (attempt + 1)))
                    continue
                }
                throw error
            }
        }
    }

    return { apiRequest, token }
}
