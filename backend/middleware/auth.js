const jwt = require('jsonwebtoken')
require('dotenv').config()

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log(`[AUTH] REJECTED: No token - ${req.method} ${req.originalUrl}`)
            return res.status(401).json({ error: 'Token requis' })
        }

        const token = authHeader.split(' ')[1]

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

// Middleware générique : vérifie que le rôle est dans la liste autorisée
const requireRole = (...roles) => (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
        next()
    } else {
        res.status(403).json({ error: 'Accès non autorisé pour votre rôle' })
    }
}

// Admin seulement (gestion utilisateurs, invitations)
const adminOnly = requireRole('admin')

// Écriture : admin + modérateur
const canWrite = requireRole('admin', 'moderateur')

// Lecture : tous les rôles authentifiés
const canRead = requireRole('admin', 'moderateur')

// Middleware : valider que :id est un entier positif
const validateId = (req, res, next) => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'ID invalide' })
    }
    req.params.id = id
    next()
}

module.exports = { authMiddleware, adminOnly, canWrite, canRead, requireRole, validateId }
