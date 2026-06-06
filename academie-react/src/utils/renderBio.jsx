/**
 * renderBio : parseur Markdown minimaliste sans dependance.
 *
 * Format supporte :
 *  - "## "  -> titre h3
 *  - "### " -> titre h4
 *  - "- "   -> item de liste (groupes en <ul>)
 *  - ligne vide -> separation de paragraphes
 *  - reste -> paragraphes
 *
 * Pas d'injection HTML : tout passe par le rendu React (textes purs).
 * Les retours a la ligne au sein d'un paragraphe sont preserves (<br/>).
 */
import { Fragment } from 'react'

// Transforme les liens Markdown [texte](url) et les URLs brutes (http/https)
// en ancres cliquables. Renvoie la chaine telle quelle s'il n'y a pas de lien.
const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)\]]+)/g

function linkify(text, baseKey) {
    if (typeof text !== 'string' || !text.includes('http')) return text
    const out = []
    let last = 0
    let i = 0
    let m
    LINK_RE.lastIndex = 0
    while ((m = LINK_RE.exec(text)) !== null) {
        if (m.index > last) {
            out.push(<Fragment key={`${baseKey}-t-${i}`}>{text.slice(last, m.index)}</Fragment>)
        }
        const url = m[2] || m[3]
        const label = m[1] || m[3]
        out.push(
            <a
                key={`${baseKey}-a-${i}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="bio-link"
            >
                {label}
            </a>
        )
        last = m.index + m[0].length
        i++
    }
    if (out.length === 0) return text
    if (last < text.length) {
        out.push(<Fragment key={`${baseKey}-t-end`}>{text.slice(last)}</Fragment>)
    }
    return out
}

function inlineEmphasis(line, baseKey) {
    // Gere **gras** et *gras* (style WhatsApp) + liens cliquables.
    if (!line.includes('*')) return linkify(line, baseKey)
    // On capture d'abord **...** puis *...* (l'ordre evite de couper le double).
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g)
    return parts.map((part, i) => {
        if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
            return <strong key={`${baseKey}-b-${i}`}>{linkify(part.slice(2, -2), `${baseKey}-b-${i}`)}</strong>
        }
        if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
            return <strong key={`${baseKey}-b-${i}`}>{linkify(part.slice(1, -1), `${baseKey}-b-${i}`)}</strong>
        }
        return <Fragment key={`${baseKey}-t-${i}`}>{linkify(part, `${baseKey}-t-${i}`)}</Fragment>
    })
}

export function renderBio(text) {
    if (!text || typeof text !== 'string') return null

    // Normaliser les fins de ligne
    const lines = String(text).replace(/\r\n?/g, '\n').split('\n')

    const blocks = []
    let paragraph = []
    let list = []

    const flushParagraph = () => {
        if (paragraph.length === 0) return
        const idx = blocks.length
        // Joindre les lignes du paragraphe avec <br/> pour preserver les retours
        const content = paragraph.map((line, i) => (
            <Fragment key={`p${idx}-l${i}`}>
                {i > 0 && <br />}
                {inlineEmphasis(line, `p${idx}-l${i}`)}
            </Fragment>
        ))
        blocks.push(<p key={`p${idx}`} className="bio-para">{content}</p>)
        paragraph = []
    }

    const flushList = () => {
        if (list.length === 0) return
        const idx = blocks.length
        blocks.push(
            <ul key={`ul${idx}`} className="bio-list">
                {list.map((item, i) => (
                    <li key={`ul${idx}-li${i}`}>{inlineEmphasis(item, `ul${idx}-li${i}`)}</li>
                ))}
            </ul>
        )
        list = []
    }

    for (const raw of lines) {
        const line = raw.replace(/\s+$/, '') // trim end
        if (line === '') {
            flushParagraph()
            flushList()
            continue
        }

        // Titre h3 (##)
        if (/^##\s+/.test(line) && !line.startsWith('### ')) {
            flushParagraph()
            flushList()
            const text = line.replace(/^##\s+/, '').trim()
            blocks.push(<h3 key={`h3-${blocks.length}`} className="bio-heading">{text}</h3>)
            continue
        }

        // Titre h4 (###)
        if (/^###\s+/.test(line)) {
            flushParagraph()
            flushList()
            const text = line.replace(/^###\s+/, '').trim()
            blocks.push(<h4 key={`h4-${blocks.length}`} className="bio-subheading">{text}</h4>)
            continue
        }

        // Liste (-)
        if (/^[-*]\s+/.test(line)) {
            flushParagraph()
            list.push(line.replace(/^[-*]\s+/, '').trim())
            continue
        }

        // Paragraphe normal
        flushList()
        paragraph.push(line.trim())
    }

    flushParagraph()
    flushList()

    return blocks
}

export default renderBio
