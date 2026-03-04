import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function ScrollToHash() {
    const { hash, pathname } = useLocation()

    useEffect(() => {
        if (hash) {
            // Petit délai pour laisser le DOM se charger
            setTimeout(() => {
                const element = document.querySelector(hash)
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
            }, 100)
        } else {
            // Si pas de hash, scroll en haut
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }, [hash, pathname])

    return null
}

export default ScrollToHash
