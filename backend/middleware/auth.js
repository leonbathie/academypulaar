const jwt = require('jsonwebtoken')
const { query } = require('../database')
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

// Middleware générique : vérifie le rôle depuis la base de données (pas le JWT)
const requireRole = (...roles) => async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentification requise' })
    }
    try {
        const result = await query('SELECT role FROM users WHERE id = $1', [req.user.id])
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Utilisateur introuvable' })
        }
        const dbRole = result.rows[0].role
        req.user.role = dbRole
        if (roles.includes(dbRole)) {
            next()
        } else {
            res.status(403).json({ error: 'Accès non autorisé pour votre rôle' })
        }
    } catch (error) {
        console.error('[AUTH] Erreur vérification rôle DB:', error.message)
        res.status(500).json({ error: 'Erreur serveur lors de la vérification du rôle' })
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
