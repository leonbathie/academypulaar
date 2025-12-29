const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { query } = require('../database')
const { authMiddleware } = require('../middleware/auth')

// POST /api/auth/login - Connexion
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(400).json({ error: 'Username et password requis' })
        }

        // Chercher l'utilisateur
        const result = await query('SELECT * FROM users WHERE username = $1', [username])

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Identifiants incorrects' })
        }

        const user = result.rows[0]

        // Vérifier le mot de passe
        const validPassword = await bcrypt.compare(password, user.password)

        if (!validPassword) {
            return res.status(401).json({ error: 'Identifiants incorrects' })
        }

        // Générer le token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        )

        res.json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        })

    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// GET /api/auth/me - Infos utilisateur connecté
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const result = await query('SELECT id, username, role, created_at FROM users WHERE id = $1', [req.user.id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' })
        }

        res.json(result.rows[0])
    } catch (error) {
        console.error('Get user error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// POST /api/auth/change-password - Changer le mot de passe
router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Mots de passe requis' })
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' })
        }

        // Récupérer l'utilisateur
        const result = await query('SELECT password FROM users WHERE id = $1', [req.user.id])
        const user = result.rows[0]

        // Vérifier l'ancien mot de passe
        const validPassword = await bcrypt.compare(currentPassword, user.password)
        if (!validPassword) {
            return res.status(401).json({ error: 'Mot de passe actuel incorrect' })
        }

        // Hasher et sauvegarder le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id])

        res.json({ message: 'Mot de passe modifié avec succès' })

    } catch (error) {
        console.error('Change password error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

module.exports = router
