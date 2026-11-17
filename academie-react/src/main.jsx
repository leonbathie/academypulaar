import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App.jsx'

// Mise à jour immédiate du Service Worker PWA après chaque déploiement :
// dès que le nouveau SW prend le contrôle (skipWaiting + clientsClaim), on
// recharge une seule fois la page pour remplacer les anciens chunks précachés.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    try {
      const last = +(sessionStorage.getItem('swReloadAt') || 0)
      if (Date.now() - last < 8000) return
      sessionStorage.setItem('swReloadAt', String(Date.now()))
    } catch { /* ignore */ }
    refreshing = true
    window.location.reload()
  })

  const checkSwUpdate = () => {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) reg.update().catch(() => {})
    }).catch(() => {})
  }
  window.addEventListener('load', checkSwUpdate)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkSwUpdate()
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Chargement / Loading / Heɓtude...</p>
      </div>
    }>
      <App />
    </Suspense>
  </StrictMode>,
)
