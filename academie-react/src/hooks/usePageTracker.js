import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { API_URL } from '../config'

export default function usePageTracker() {
    const location = useLocation()

    useEffect(() => {
        // Ne pas tracker les pages admin
        if (location.pathname.startsWith('/admin') || location.pathname === '/login') return

        const timer = setTimeout(() => {
            fetch(`${API_URL}/api/visits/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ page: location.pathname })
            }).catch(() => {})
        }, 500)

        return () => clearTimeout(timer)
    }, [location.pathname])
}
