import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { API_URL, resolveMediaUrl } from '../config'
import { renderBio } from '../utils/renderBio'
import './Patrimoine.css'

// Avatar SVG inline (aucune dépendance externe, ne casse jamais hors-ligne ou si via.placeholder.com est bloqué)
function scholarPlaceholder(name = '') {
    const initials = String(name || 'GFW')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(w => w.charAt(0).toUpperCase())
        .join('') || 'GF'
    const safeInitials = initials.replace(/[<>&"']/g, '')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
        <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#1A1A2E"/>
                <stop offset="55%" stop-color="#241c38"/>
                <stop offset="100%" stop-color="#431c2c"/>
            </linearGradient>
        </defs>
        <rect width="400" height="500" fill="url(#bg)"/>
        <circle cx="200" cy="215" r="88" fill="rgba(212,165,55,0.12)" stroke="#D4A537" stroke-width="2.5"/>
        <text x="200" y="236" text-anchor="middle" fill="#D4A537" font-family="Georgia, serif" font-size="60" font-weight="700">${safeInitials}</text>
        <line x1="140" y1="340" x2="260" y2="340" stroke="rgba(212,165,55,0.45)" stroke-width="2"/>
    </svg>`
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

// Apercu texte court : retire la syntaxe Markdown et tronque.
function bioPreview(text, max = 120) {
    if (!text) return ''
    const clean = String(text)
        .replace(/^#{2,3}\s+/gm, '')   // titres
        .replace(/^[-*]\s+/gm, '')      // listes
        .replace(/\*+/g, '')            // gras **...** et *...* (WhatsApp)
        .replace(/\s+/g, ' ')
        .trim()
    return clean.length > max ? clean.slice(0, max).trim() + '…' : clean
}

// Section "Patrimoine" : galerie de cartes savants. Clic sur une carte
// -> modal avec la biographie complete. Affichee sur la page d'accueil.
function Patrimoine() {
    const { t, i18n } = useTranslation()
    const lang = ['fr', 'en', 'ff'].includes(i18n.language) ? i18n.language : 'fr'
    const [scholars, setScholars] = useState([])
    const [selected, setSelected] = useState(null)

    useEffect(() => {
        fetch(`${API_URL}/api/scholars`)
            .then(r => (r.ok ? r.json() : []))
            .then(data => {
                if (Array.isArray(data) && data.length > 0) setScholars(data)
            })
            .catch(() => {})
    }, [])

    // Fermeture du modal : Echap + blocage du scroll de fond
    useEffect(() => {
        if (!selected) return
        const onKey = (e) => { if (e.key === 'Escape') setSelected(null) }
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [selected])

    if (scholars.length === 0) return null

    const getBio = (s) => s[`bio_${lang}`] || (lang !== 'fr' ? null : s.bio_fr)
    const isFallback = (s) => !s[`bio_${lang}`] && lang !== 'fr'

    const placeholder = (name) => scholarPlaceholder(name)

    const selBio = selected ? getBio(selected) : null
    const selFallback = selected ? isFallback(selected) : false

    return (
        <section className="patrimoine" id="patrimoine">
            <div className="container">
                <div className="patrimoine-head">
                    <span className="section-label">{t('scholars.label', 'Patrimoine')}</span>
                    <h2 className="section-title">{t('scholars.title', 'Nos savants')}</h2>
                    {t('scholars.subtitle', '') && (
                        <p className="patrimoine-subtitle">{t('scholars.subtitle')}</p>
                    )}
                </div>

                <div className="savants-grid">
                    {scholars.map((s) => {
                        const bio = getBio(s)
                        const fallback = isFallback(s)
                        const imgSrc = s.image ? resolveMediaUrl(s.image) : placeholder(s.name)
                        return (
                            <article
                                key={s.id}
                                className="savant-card"
                                onClick={() => setSelected(s)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(s) } }}
                            >
                                <div className="savant-card-img">
                                    <img
                                        src={imgSrc}
                                        alt={s.name}
                                        loading="lazy"
                                        decoding="async"
                                        style={{ objectPosition: s.image_position || '50% 20%' }}
                                        onError={(e) => {
                                            e.currentTarget.onerror = null
                                            e.currentTarget.src = placeholder(s.name)
                                        }}
                                    />
                                </div>
                                <div className="savant-card-body">
                                    <h3 className="savant-card-name">{s.name}</h3>
                                    {s.years && <span className="savant-card-years">{s.years}</span>}
                                    <p className="savant-card-preview">
                                        {fallback ? t('common.noTranslation') : bioPreview(bio)}
                                    </p>
                                    <span className="savant-card-more">
                                        {t('scholars.readBio', 'Lire la biographie')}
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </span>
                                </div>
                            </article>
                        )
                    })}
                </div>
            </div>

            {/* Modal biographie — rendu via portal sur document.body pour
                echapper a tout contexte d'empilement/overflow parent */}
            {selected && createPortal(
                <div className="savant-modal-overlay" onClick={() => setSelected(null)}>
                    <div className="savant-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={selected.name}>
                        <button className="savant-modal-close" onClick={() => setSelected(null)} aria-label={t('common.close', 'Fermer')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                        <div className="savant-modal-img">
                            <img
                                src={selected.image ? resolveMediaUrl(selected.image) : placeholder(selected.name)}
                                alt={selected.name}
                                style={{ objectPosition: selected.image_position || '50% 20%' }}
                                onError={(e) => {
                                    e.currentTarget.onerror = null
                                    e.currentTarget.src = placeholder(selected.name)
                                }}
                            />
                        </div>
                        <div className="savant-modal-body">
                            <span className="savant-modal-kicker">{t('scholars.label', 'Patrimoine')}</span>
                            <h3 className="savant-modal-name">{selected.name}</h3>
                            {selected.years && <span className="savant-modal-years">{selected.years}</span>}
                            <div className="savant-modal-bio" style={selFallback ? { color: 'var(--medium-gray)', fontStyle: 'italic' } : undefined}>
                                {selFallback
                                    ? <p className="bio-para">{t('common.noTranslation')}</p>
                                    : renderBio(selBio)}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </section>
    )
}

export default Patrimoine
