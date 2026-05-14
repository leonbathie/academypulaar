/**
 * Simple Markdown parser for biography text.
 * Supports:
 * - ## Main titles (h2)
 * - ### Subtitles (h3)
 * - - List items
 * - Paragraph separation (empty lines)
 * - Preserves line breaks and formatting
 */

export const parseMarkdown = (text) => {
    if (!text || typeof text !== 'string') return ''
    
    let html = ''
    const lines = text.split('\n')
    let inList = false
    let listItems = []
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        // Empty line: close list if open, add paragraph break
        if (line === '') {
            if (inList) {
                html += `<ul class="md-list">${listItems.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
                inList = false
                listItems = []
            }
            continue
        }
        
        // h2 title (##)
        if (line.startsWith('##') && !line.startsWith('###')) {
            if (inList) {
                html += `<ul class="md-list">${listItems.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
                inList = false
                listItems = []
            }
            const title = line.replace(/^##\s*/, '').trim()
            html += `<h2 class="md-h2">${escapeHtml(title)}</h2>`
            continue
        }
        
        // h3 subtitle (###)
        if (line.startsWith('###')) {
            if (inList) {
                html += `<ul class="md-list">${listItems.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
                inList = false
                listItems = []
            }
            const subtitle = line.replace(/^###\s*/, '').trim()
            html += `<h3 class="md-h3">${escapeHtml(subtitle)}</h3>`
            continue
        }
        
        // List item (-)
        if (line.startsWith('-')) {
            inList = true
            const item = line.replace(/^-\s*/, '').trim()
            listItems.push(item)
            continue
        }
        
        // Regular paragraph
        if (line && !line.startsWith('#')) {
            if (inList) {
                html += `<ul class="md-list">${listItems.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
                inList = false
                listItems = []
            }
            html += `<p class="md-paragraph">${escapeHtml(line)}</p>`
        }
    }
    
    // Close remaining list
    if (inList) {
        html += `<ul class="md-list">${listItems.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    }
    
    return html
}

const escapeHtml = (text) => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

/**
 * Extract plain text preview (first N characters, no HTML)
 */
export const extractPreview = (text, maxLength = 150) => {
    if (!text) return ''
    // Remove markdown syntax for preview
    let preview = text
        .replace(/###+\s*/g, '')
        .replace(/^-\s*/gm, '')
        .replace(/\n+/g, ' ')
        .trim()
    
    if (preview.length > maxLength) {
        return preview.substring(0, maxLength) + '...'
    }
    return preview
}
