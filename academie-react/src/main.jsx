import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    }>
      <App />
    </Suspense>
  </StrictMode>,
)
