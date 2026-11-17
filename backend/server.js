const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const rateLimit = require('express-rate-limit')
const { UPLOADS_ROOT, sniffMimeFromFile } = require('./utils/uploadHelper')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const app = express()
const PORT = process.env.PORT || 5000

// Trust proxy (Cloudflare + Nginx)
app.set('trust proxy', 1)

// Rate limiters
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts per 15 min
    message: { error: 'Too many attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
})

const adminLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: { error: 'Too many requests, please slow down' },
    standardHeaders: true,
    legacyHeaders: false
})

// Global rate limiter (all routes)
const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 200, // 200 requests per minute per IP
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
})

// Middleware
app.use(globalLimiter)
app.use(helmet({
    contentSecurityPolicy: false, // Handled by Nginx
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}))
app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://localhost:3000',
        'https://goomufulo.com'
    ],
    credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging middleware
app.use('/api', (req, res, next) => {
    const start = Date.now()
    const { method, originalUrl } = req
    console.log(`[REQ] ${method} ${originalUrl} - Start`)
    
    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - start
        console.log(`[RES] ${method} ${originalUrl} - ${res.statusCode} (${duration}ms)`)
    })
    
    // Log if connection is closed prematurely
    req.on('close', () => {
        if (!res.writableFinished) {
            const duration = Date.now() - start
            console.log(`[REQ] ${method} ${originalUrl} - CONNECTION CLOSED by client after ${duration}ms (response not sent)`)
        }
    })
    
    next()
})

// Servir les fichiers uploadés avec en-têtes cross-origin et détection MIME de secours
app.use('/uploads', (req, res, next) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin')
    res.set('Access-Control-Allow-Origin', '*')
    const rel = decodeURIComponent(req.path || '').replace(/^\/+/, '')
    if (!rel.startsWith('books/')) {
        res.set('Content-Disposition', 'inline')
    }
    const ext = path.extname(rel).toLowerCase()
    if (!ext || ext === '.jfif' || ext === '.avif') {
        const abs = path.resolve(UPLOADS_ROOT, rel)
        if (abs.startsWith(UPLOADS_ROOT + path.sep) && fs.existsSync(abs)) {
            const sniffed = sniffMimeFromFile(abs)
            if (sniffed) res.type(sniffed)
        }
    }
    next()
}, express.static(UPLOADS_ROOT, {
    maxAge: '30d',
    setHeaders: (res, filePath) => {
        const ext = path.extname(filePath).toLowerCase()
        if (ext === '.webp') res.setHeader('Content-Type', 'image/webp')
        else if (ext === '.avif') res.setHeader('Content-Type', 'image/avif')
        else if (ext === '.jfif') res.setHeader('Content-Type', 'image/jpeg')
    }
}))

// Routes de partage social (en dehors de /api pour avoir des URLs propres)
app.use('/share', require('./routes/share'))

// Routes API
app.use('/api/auth', authLimiter, require('./routes/auth'))
app.use('/api/dictionary', adminLimiter, require('./routes/dictionary'))
app.use('/api/members', adminLimiter, require('./routes/members'))
app.use('/api/news', adminLimiter, require('./routes/news'))
app.use('/api/content', adminLimiter, require('./routes/content'))
app.use('/api/terminologie', adminLimiter, require('./routes/terminologie'))
app.use('/api/domain-content', adminLimiter, require('./routes/domain-content'))
app.use('/api/books', adminLimiter, require('./routes/books'))
app.use('/api/scholars', adminLimiter, require('./routes/scholars'))
app.use('/api/hero', adminLimiter, require('./routes/hero'))
app.use('/api/questions', adminLimiter, require('./routes/questions'))
app.use('/api/visits', require('./routes/visits'))
app.use('/api/contact', require('./routes/contact'))
app.use('/api/settings', require('./routes/settings'))

// Route de test
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'GoomuFuloWiɗto API is running',
        timestamp: new Date().toISOString()
    })
})

// Gestion des erreurs Multer (upload)
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                error: 'Fichier trop volumineux',
                message: 'La taille maximale autorisée est de 100 Mo'
            })
        }
        return res.status(400).json({
            error: 'Erreur upload',
            message: err.message
        })
    }
    next(err)
})

// Gestion des erreurs générales
app.use((err, req, res, next) => {
    console.error('Error:', err)
    const status = err.status || 500
    res.status(status).json({
        error: status >= 500 ? 'Erreur serveur interne' : 'Erreur',
        message: status >= 500 ? 'Une erreur inattendue est survenue' : err.message
    })
})

// 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route non trouvée' })
})

// Démarrage du serveur
const server = app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════╗
    ║                                                   ║
    ║    🌍 GoomuFuloWiɗto API Server                   ║
    ║    📡 Running on http://localhost:${PORT}            ║
    ║                                                   ║
    ╚═══════════════════════════════════════════════════╝
    `)
})

// Fix 408 Request Timeout: Node.js keepAliveTimeout (5s) < Nginx keepalive_timeout (75s)
// Nginx reuses connections that Node already closed → 408
// Solution: Node keepAliveTimeout MUST be > Nginx keepalive_timeout
server.keepAliveTimeout = 120000    // 120s (Nginx default: 75s)
server.headersTimeout = 125000      // Must be > keepAliveTimeout
server.requestTimeout = 300000      // 5 minutes
server.timeout = 300000             // 5 minutes

module.exports = app
