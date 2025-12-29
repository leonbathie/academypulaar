const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes API
app.use('/api/auth', require('./routes/auth'))
app.use('/api/dictionary', require('./routes/dictionary'))
app.use('/api/members', require('./routes/members'))
app.use('/api/news', require('./routes/news'))
app.use('/api/content', require('./routes/content'))
app.use('/api/books', require('./routes/books'))

// Route de test
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'GoomuFuloWiɗto API is running',
        timestamp: new Date().toISOString()
    })
})

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Error:', err)
    res.status(500).json({
        error: 'Erreur serveur',
        message: err.message
    })
})

// 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route non trouvée' })
})

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════╗
    ║                                                   ║
    ║    🌍 GoomuFuloWiɗto API Server                   ║
    ║    📡 Running on http://localhost:${PORT}            ║
    ║                                                   ║
    ╚═══════════════════════════════════════════════════╝
    `)
})

module.exports = app
