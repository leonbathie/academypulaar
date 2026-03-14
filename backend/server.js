const express = require('express')
const cors = require('cors')
const path = require('path')
const multer = require('multer')
const rateLimit = require('express-rate-limit')
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

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://localhost:3000',
        'http://173.249.2.195',
        'https://173.249.2.195',
        'http://goomufulo.com',
        'https://goomufulo.com',
        'http://www.goomufulo.com',
        'https://www.goomufulo.com',
        'http://goomunfulawidto.serveblog.net',
        'https://goomunfulawidto.serveblog.net'
    ],
    credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

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

// Servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes API
app.use('/api/auth', authLimiter, require('./routes/auth'))
app.use('/api/dictionary', adminLimiter, require('./routes/dictionary'))
app.use('/api/members', adminLimiter, require('./routes/members'))
app.use('/api/news', adminLimiter, require('./routes/news'))
app.use('/api/content', adminLimiter, require('./routes/content'))
app.use('/api/books', adminLimiter, require('./routes/books'))
app.use('/api/questions', adminLimiter, require('./routes/questions'))

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
    res.status(err.status || 500).json({
        error: 'Erreur serveur',
        message: err.message
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
server.requestTimeout = 0           // Disable request timeout
server.timeout = 0                  // Disable socket timeout completely

module.exports = app
