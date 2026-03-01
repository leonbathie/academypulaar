const jwt = require('jsonwebtoken')
require('dotenv').config()

const authMiddleware = (req, res, next) => {
    try {
        // Récupérer le token du header
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log(`[AUTH] REJECTED: No token - ${req.method} ${req.originalUrl}`)
            return res.status(401).json({ error: 'Token requis' })
        }

        const token = authHeader.split(' ')[1]

        // Vérifier le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        console.log(`[AUTH] OK: user=${decoded.username} role=${decoded.role} - ${req.method} ${req.originalUrl}`)

        next()
    } catch (error) {
        console.log(`[AUTH] REJECTED: ${error.name} - ${error.message} - ${req.method} ${req.originalUrl}`)
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expiré' })
        }
        return res.status(401).json({ error: 'Token invalide' })
    }
}

// Middleware pour vérifier le rôle admin
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next()
    } else {
        res.status(403).json({ error: 'Accès réservé aux administrateurs' })
    }
}

module.exports = { authMiddleware, adminOnly }
