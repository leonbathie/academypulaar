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

function inlineEmphasis(line, baseKey) {
    // Gere **gras** et *gras* (style WhatsApp). Tout le reste reste texte pur.
    if (!line.includes('*')) return line
    // On capture d'abord **...** puis *...* (l'ordre evite de couper le double).
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g)
    return parts.map((part, i) => {
        if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
            return <strong key={`${baseKey}-b-${i}`}>{part.slice(2, -2)}</strong>
        }
        if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
            return <strong key={`${baseKey}-b-${i}`}>{part.slice(1, -1)}</strong>
        }
        return <Fragment key={`${baseKey}-t-${i}`}>{part}</Fragment>
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
