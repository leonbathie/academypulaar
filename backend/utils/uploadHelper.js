const path = require('path')
const fs = require('fs')

const UPLOADS_ROOT = path.resolve(__dirname, '..', 'uploads')
const SUBDIRS = ['books', 'hero', 'scholars']

const MIME_TO_EXT = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/pjpeg': '.jpg',
    'image/jfif': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/avif': '.avif',
    'image/svg+xml': '.svg',
    'image/bmp': '.bmp',
    'image/x-ms-bmp': '.bmp',
    'image/tiff': '.tif',
    'image/heic': '.heic',
    'image/heif': '.heif',
    'image/x-icon': '.ico',
    'image/vnd.microsoft.icon': '.ico',
    'audio/webm': '.webm',
    'audio/mp3': '.mp3',
    'audio/mpeg': '.mp3',
    'audio/ogg': '.ogg',
    'audio/wav': '.wav',
    'audio/x-wav': '.wav',
    'audio/mp4': '.m4a',
    'audio/x-m4a': '.m4a',
    'audio/aac': '.aac'
}

const ALLOWED_IMAGE_EXTS = new Set([
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif',
    '.svg', '.bmp', '.tif', '.tiff', '.jfif', '.heic', '.heif', '.ico'
])

function ensureUploadDirs() {
    for (const dir of [UPLOADS_ROOT, ...SUBDIRS.map(s => path.join(UPLOADS_ROOT, s))]) {
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true, mode: 0o775 })
            }
        } catch (err) {
            console.error(`[UPLOADS] Impossible de créer ${dir}:`, err.message)
        }
    }
}

ensureUploadDirs()

function resolveSafeExt(file, defaultExt = '') {
    let ext = path.extname(file.originalname || '').toLowerCase().replace(/[^a-z0-9.]/g, '')
    if (ext === '.jfif' || ext === '.jpe') ext = '.jpg'
    if (!ext || ext === '.') {
        const mime = (file.mimetype || '').toLowerCase().split(';')[0].trim()
        ext = MIME_TO_EXT[mime] || defaultExt
    }
    return ext
}

function isAllowedImage(file) {
    const mime = (file.mimetype || '').toLowerCase()
    const ext = path.extname(file.originalname || '').toLowerCase()
    return mime.startsWith('image/') || ALLOWED_IMAGE_EXTS.has(ext)
}

function makeWorldReadable(filePath) {
    if (!filePath) return
    try {
        fs.chmodSync(filePath, 0o644)
    } catch (_) {
        // Ignorer si l'OS ne supporte pas chmod (ex: Windows)
    }
}

function ensureUploadedFilesReadable(req) {
    if (!req) return
    if (req.file && req.file.path) {
        makeWorldReadable(req.file.path)
    }
    if (Array.isArray(req.files)) {
        for (const f of req.files) {
            if (f && f.path) makeWorldReadable(f.path)
        }
    } else if (req.files && typeof req.files === 'object') {
        for (const list of Object.values(req.files)) {
            if (Array.isArray(list)) {
                for (const f of list) {
                    if (f && f.path) makeWorldReadable(f.path)
                }
            }
        }
    }
}

function safeUnlinkUpload(storedPath) {
    if (!storedPath || typeof storedPath !== 'string') return
    try {
        const rel = storedPath.replace(/^\/+/, '').replace(/^uploads[\\/]/, '')
        const abs = path.resolve(UPLOADS_ROOT, rel)
        if (abs.startsWith(UPLOADS_ROOT + path.sep) && fs.existsSync(abs)) {
            fs.unlink(abs, () => {})
        }
    } catch (_) { /* ignore */ }
}

/**
 * Détecte le type MIME réel par les premiers octets (magic bytes) lorsqu'un
 * fichier uploadé n'a pas d'extension reconnue.
 */
function sniffMimeFromFile(absPath) {
    try {
        const fd = fs.openSync(absPath, 'r')
        const buf = Buffer.alloc(16)
        const bytesRead = fs.readSync(fd, buf, 0, 16, 0)
        fs.closeSync(fd)
        if (bytesRead < 4) return null

        // JPEG: FF D8 FF
        if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg'
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png'
        // GIF: GIF87a / GIF89a
        if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'image/gif'
        // RIFF....WEBP or RIFF....WAVE
        if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && bytesRead >= 12) {
            const fourcc = buf.slice(8, 12).toString('ascii')
            if (fourcc === 'WEBP') return 'image/webp'
            if (fourcc === 'WAVE') return 'audio/wav'
        }
        // ISO BMFF: ....ftyp (avif, heic, mp4/m4a)
        if (bytesRead >= 12 && buf.slice(4, 8).toString('ascii') === 'ftyp') {
            const brand = buf.slice(8, 12).toString('ascii')
            if (brand === 'avif' || brand === 'avis') return 'image/avif'
            if (brand === 'heic' || brand === 'heix' || brand === 'mif1') return 'image/heic'
            return 'audio/mp4'
        }
        // WebM / Matroska: 1A 45 DF A3
        if (buf[0] === 0x1A && buf[1] === 0x45 && buf[2] === 0xDF && buf[3] === 0xA3) return 'audio/webm'
        // Ogg: OggS
        if (buf.slice(0, 4).toString('ascii') === 'OggS') return 'audio/ogg'
        // MP3: ID3 or FF FB / FF F3 / FF F2
        if (buf.slice(0, 3).toString('ascii') === 'ID3' || (buf[0] === 0xFF && (buf[1] & 0xE0) === 0xE0)) return 'audio/mpeg'
        // PDF: %PDF
        if (buf.slice(0, 4).toString('ascii') === '%PDF') return 'application/pdf'
    } catch (_) { /* ignore */ }
    return null
}

module.exports = {
    UPLOADS_ROOT,
    ensureUploadDirs,
    resolveSafeExt,
    isAllowedImage,
    makeWorldReadable,
    ensureUploadedFilesReadable,
    safeUnlinkUpload,
    sniffMimeFromFile
}
