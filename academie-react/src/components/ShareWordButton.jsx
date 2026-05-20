import { useState, useRef, useEffect } from 'react'
import { API_URL } from '../config'

/**
 * Bouton de partage social pour une carte de mot du dictionnaire.
 *
 * - L'URL partagee est /share/word/:id (backend) qui retourne du HTML
 *   avec des balises Open Graph + une image PNG generee a la volee.
 *   Quand colle sur FB/WhatsApp/Twitter, l'apercu affiche la jolie image.
 *
 * - Sur mobile (et navigateurs supportant la Web Share API) : ouvre le
 *   menu natif de partage du systeme.
 * - Sinon : popover avec boutons WhatsApp, Facebook, Twitter, Copier le lien.
 */
function ShareWordButton({ entry, t }) {
    const [open, setOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const popoverRef = useRef(null)
    const btnRef = useRef(null)

    // PUBLIC_BASE_URL : on derive depuis API_URL (https://goomufulo.com/api -> https://goomufulo.com)
    // En fallback : window.location.origin
    const publicBase = (() => {
        try {
            const u = new URL(API_URL)
            return u.origin
        } catch (_) {
            return typeof window !== 'undefined' ? window.location.origin : ''
        }
    })()

    const shareUrl = `${publicBase}/share/word/${entry.id}`
    const shareText = `${entry.word}${entry.translation_fr ? ' — ' + entry.translation_fr : ''}`

    // Fermer le popover au clic exterieur
    useEffect(() => {
        if (!open) return
        const onDocClick = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)
                && btnRef.current && !btnRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        const onEsc = (e) => { if (e.key === 'Escape') setOpen(false) }
        document.addEventListener('mousedown', onDocClick)
        document.addEventListener('keydown', onEsc)
        return () => {
            document.removeEventListener('mousedown', onDocClick)
            document.removeEventListener('keydown', onEsc)
        }
    }, [open])

    const handleClick = async () => {
        // Web Share API : disponible sur mobile + Safari/Chrome desktop recent.
        // IMPORTANT : on passe UNIQUEMENT l'URL (pas de text ni title) car
        // WhatsApp et plusieurs clients combinent les 3 champs en message
        // texte unique et NE GENERENT PAS l'apercu Open Graph dans ce cas.
        // En ne passant que l'URL, WhatsApp la traite comme un vrai lien et
        // declenche son scraper d'apercu.
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({ url: shareUrl })
                return
            } catch (err) {
                // L'utilisateur a annule le partage natif : on ne fallback pas
                if (err && err.name === 'AbortError') return
                // Autre erreur : fallback sur le popover
            }
        }
        setOpen(o => !o)
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
        } catch (_) {
            // Fallback : selectionner via input
            const input = document.createElement('input')
            input.value = shareUrl
            document.body.appendChild(input)
            input.select()
            try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch (_) {}
            document.body.removeChild(input)
        }
    }

    // WhatsApp deeplink : URL SEULE (pas de texte avant) pour que WhatsApp
    // genere bien l'apercu Open Graph au lieu de l'inclure dans du texte.
    const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareUrl)}`
    const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    const twitterHref = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`

    return (
        <div className="word-share-wrap">
            <button
                ref={btnRef}
                type="button"
                className="word-share-btn"
                onClick={handleClick}
                aria-label={t ? t('common.share', 'Partager') : 'Partager'}
                aria-expanded={open}
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>{t ? t('common.share', 'Partager') : 'Partager'}</span>
            </button>

            {open && (
                <div className="word-share-popover" ref={popoverRef} role="menu">
                    <a className="word-share-opt word-share-opt--wa" href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
                        <span aria-hidden="true">💬</span> WhatsApp
                    </a>
                    <a className="word-share-opt word-share-opt--fb" href={facebookHref} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
                        <span aria-hidden="true">📘</span> Facebook
                    </a>
                    <a className="word-share-opt word-share-opt--tw" href={twitterHref} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
                        <span aria-hidden="true">🐦</span> X / Twitter
                    </a>
                    <button type="button" className="word-share-opt word-share-opt--copy" onClick={handleCopy}>
                        <span aria-hidden="true">🔗</span> {copied ? (t ? t('common.copied', 'Copié !') : 'Copié !') : (t ? t('common.copyLink', 'Copier le lien') : 'Copier le lien')}
                    </button>
                </div>
            )}
        </div>
    )
}

export default ShareWordButton
