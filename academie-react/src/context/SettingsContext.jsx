import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { API_URL } from '../config'

const SettingsContext = createContext()

const API_BASE = `${API_URL}/api`

// Valeurs par défaut : la page terminologie est visible tant que rien
// n'a été chargé (évite un "flash" de page cachée au démarrage).
const DEFAULTS = {
    terminologie_visible: true
}

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(DEFAULTS)
    const [loading, setLoading] = useState(true)

    const fetchSettings = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/settings`)
            if (response.ok) {
                const data = await response.json()
                setSettings({ ...DEFAULTS, ...data })
            }
        } catch (error) {
            console.error('Settings fetch error:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider')
    }
    return context
}
