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

    const [loading, setLoading] = useState(false)

    /**
     * Strategie de partage en 3 niveaux (priorite) :
     * 1) Web Share API LEVEL 2 (files) : envoie l'IMAGE generee directement
     *    dans WhatsApp comme une photo + legende avec le lien. Le destinataire
     *    voit la carte du mot directement, sans cliquer un lien.
     *    Supporte : Android Chrome, iOS 16+ Safari, Edge mobile.
     * 2) Web Share API LEVEL 1 (url seule) : partage le lien Open Graph.
     *    Le destinataire voit un apercu si WhatsApp scrape OK.
     * 3) Popover desktop : WhatsApp Web, Facebook, Twitter, copier le lien.
     */
    const fetchImageAsFile = async () => {
        const res = await fetch(`${publicBase}/share/word/${entry.id}/card.png`)
        if (!res.ok) throw new Error('fetch image failed')
        const blob = await res.blob()
        const slug = (entry.word || 'mot').replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 40)
        return new File([blob], `goomufulo-${slug}.png`, { type: 'image/png' })
    }

    const handleClick = async () => {
        // Niveau 1 : Web Share avec fichier image + URL en caption.
        // text = UNIQUEMENT l'URL (pas de titre/traduction en plus) pour que
        // dans WhatsApp ce soit visuellement UN SEUL BLOC :
        //   [image de la carte]
        //   https://goomufulo.com/share/word/X
        // au lieu d'avoir titre + traduction sur une ligne, puis URL separee.
        if (typeof navigator !== 'undefined' && navigator.canShare) {
            setLoading(true)
            try {
                const file = await fetchImageAsFile()
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        text: shareUrl
                    })
                    setLoading(false)
                    return
                }
            } catch (err) {
                setLoading(false)
                if (err && err.name === 'AbortError') return
                // Fall through au niveau 2
            }
            setLoading(false)
        }

        // Niveau 2 : Web Share URL seule (fallback)
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({ url: shareUrl })
                return
            } catch (err) {
                if (err && err.name === 'AbortError') return
            }
        }

        // Niveau 3 : popover desktop
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
                className={`word-share-btn ${loading ? 'is-loading' : ''}`}
                onClick={handleClick}
                disabled={loading}
                aria-label={t ? t('common.share', 'Partager') : 'Partager'}
                aria-expanded={open}
                aria-busy={loading}
            >
                {loading ? (
                    <span className="word-share-spinner" aria-hidden="true" />
                ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                )}
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
