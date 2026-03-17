const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { OAuth2Client } = require('google-auth-library')
const { query } = require('../database')
const { authMiddleware, requireRole } = require('../middleware/auth')
const { SUPER_ADMIN_EMAILS, isSuperAdmin } = require('../config/super-admins')

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// Helper : générer JWT
function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )
}

// ─── POST /api/auth/login - Connexion classique ──────────────────────
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(400).json({ error: 'Username et password requis' })
        }

        const result = await query('SELECT * FROM users WHERE username = $1', [username])

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Identifiants incorrects' })
        }

        const user = result.rows[0]

        if (!user.password) {
            return res.status(401).json({ error: 'Ce compte utilise Google. Connectez-vous avec Google.' })
        }

        const validPassword = await bcrypt.compare(password, user.password)

        if (!validPassword) {
            return res.status(401).json({ error: 'Identifiants incorrects' })
        }

        const token = generateToken(user)

        res.json({
            message: 'Connexion réussie',
            token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role }
        })

    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// ─── POST /api/auth/google - Connexion Google ────────────────────────
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body

        if (!credential) {
            return res.status(400).json({ error: 'Token Google requis' })
        }

        // Vérifier le token Google
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        })

        const payload = ticket.getPayload()
        const { sub: googleId, email, name } = payload

        // Chercher un utilisateur existant par google_id ou email
        let result = await query(
            'SELECT * FROM users WHERE google_id = $1 OR email = $2',
            [googleId, email]
        )

        let user

        if (result.rows.length > 0) {
            user = result.rows[0]
            // Mettre à jour google_id si le compte existait avec juste l'email
            if (!user.google_id) {
                await query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id])
            }
            // Super-admins : toujours forcer le rôle admin
            if (isSuperAdmin(email) && user.role !== 'admin') {
                await query('UPDATE users SET role = $1 WHERE id = $2', ['admin', user.id])
                user.role = 'admin'
            }
        } else {
            // Super-admins : accès direct sans invitation
            if (isSuperAdmin(email)) {
                const insertResult = await query(
                    `INSERT INTO users (username, email, google_id, role)
                     VALUES ($1, $2, $3, 'admin') RETURNING *`,
                    [name || email.split('@')[0], email, googleId]
                )
                user = insertResult.rows[0]
                console.log(`[AUTH] Super-admin created via Google: ${email}`)
            } else {
                // Vérifier s'il y a une invitation valide pour cet email
                const inviteResult = await query(
                    'SELECT * FROM invitations WHERE email = $1 AND used = false AND expires_at > NOW()',
                    [email]
                )

                if (inviteResult.rows.length === 0) {
                    return res.status(403).json({
                        error: 'Accès non autorisé',
                        message: 'Aucune invitation trouvée pour cet email. Demandez une invitation à un administrateur.'
                    })
                }

                const invitation = inviteResult.rows[0]

                // Créer le compte
                const insertResult = await query(
                    `INSERT INTO users (username, email, google_id, role, invited_by)
                     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                    [name || email.split('@')[0], email, googleId, invitation.role, invitation.invited_by]
                )
                user = insertResult.rows[0]

                // Marquer l'invitation comme utilisée
                await query(
                    'UPDATE invitations SET used = true, used_at = NOW() WHERE id = $1',
                    [invitation.id]
                )

                console.log(`[AUTH] New user created via Google: ${email} (role: ${invitation.role})`)
            }
        }

        const token = generateToken(user)

        res.json({
            message: 'Connexion Google réussie',
            token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role }
        })

    } catch (error) {
        console.error('Google auth error:', error)
        if (error.message?.includes('Token used too late') || error.message?.includes('Invalid token')) {
            return res.status(401).json({ error: 'Token Google invalide ou expiré' })
        }
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// ─── GET /api/auth/me - Infos utilisateur connecté ───────────────────
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'SELECT id, username, email, role, google_id, created_at FROM users WHERE id = $1',
            [req.user.id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' })
        }

        const user = result.rows[0]
        res.json({
            ...user,
            hasGoogle: !!user.google_id
        })
    } catch (error) {
        console.error('Get user error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// ─── POST /api/auth/change-password ──────────────────────────────────
router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Mots de passe requis' })
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' })
        }

        if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre' })
        }

        const result = await query('SELECT password FROM users WHERE id = $1', [req.user.id])
        const user = result.rows[0]

        if (!user.password) {
            return res.status(400).json({ error: 'Ce compte utilise Google, pas de mot de passe à changer.' })
        }

        const validPassword = await bcrypt.compare(currentPassword, user.password)
        if (!validPassword) {
            return res.status(401).json({ error: 'Mot de passe actuel incorrect' })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12)
        await query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id])

        res.json({ message: 'Mot de passe modifié avec succès' })

    } catch (error) {
        console.error('Change password error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// ═══════════════════════════════════════════════════
// INVITATIONS (admin seulement)
// ═══════════════════════════════════════════════════

// POST /api/auth/invitations
router.post('/invitations', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const { email, role } = req.body

        if (!email) {
            return res.status(400).json({ error: 'Email requis' })
        }

        const allowedRoles = ['admin', 'moderateur']
        const inviteRole = allowedRoles.includes(role) ? role : 'moderateur'

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await query('SELECT id FROM users WHERE email = $1', [email])
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' })
        }

        // Vérifier si une invitation active existe déjà
        const existingInvite = await query(
            'SELECT id FROM invitations WHERE email = $1 AND used = false AND expires_at > NOW()',
            [email]
        )
        if (existingInvite.rows.length > 0) {
            return res.status(400).json({ error: 'Une invitation active existe déjà pour cet email' })
        }

        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours

        await query(
            `INSERT INTO invitations (email, role, token, invited_by, expires_at)
             VALUES ($1, $2, $3, $4, $5)`,
            [email, inviteRole, token, req.user.id, expiresAt]
        )

        console.log(`[AUTH] Invitation created by ${req.user.username}: ${email} (role: ${inviteRole})`)

        res.json({
            message: 'Invitation créée avec succès',
            invitation: { email, role: inviteRole, expiresAt: expiresAt.toISOString() }
        })

    } catch (error) {
        console.error('Create invitation error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// GET /api/auth/invitations
router.get('/invitations', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const result = await query(`
            SELECT i.*, u.username as invited_by_name
            FROM invitations i
            LEFT JOIN users u ON i.invited_by = u.id
            ORDER BY i.created_at DESC
        `)

        res.json(result.rows)
    } catch (error) {
        console.error('List invitations error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// DELETE /api/auth/invitations/:id
router.delete('/invitations/:id', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const invId = parseInt(req.params.id)
        if (isNaN(invId)) return res.status(400).json({ error: 'ID invalide' })
        await query('DELETE FROM invitations WHERE id = $1 AND used = false', [invId])
        res.json({ message: 'Invitation supprimée' })
    } catch (error) {
        console.error('Delete invitation error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// ═══════════════════════════════════════════════════
// GESTION DES UTILISATEURS (admin seulement)
// ═══════════════════════════════════════════════════

// GET /api/auth/users
router.get('/users', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const result = await query(`
            SELECT u.id, u.username, u.email, u.role, u.google_id IS NOT NULL as has_google, 
                   u.created_at, inv.username as invited_by_name
            FROM users u
            LEFT JOIN users inv ON u.invited_by = inv.id
            ORDER BY u.created_at DESC
        `)
        res.json(result.rows)
    } catch (error) {
        console.error('List users error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// PUT /api/auth/users/:id/role
router.put('/users/:id/role', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const { role } = req.body
        const userId = parseInt(req.params.id)

        if (isNaN(userId)) return res.status(400).json({ error: 'ID invalide' })

        const allowedRoles = ['admin', 'moderateur']
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ error: 'Rôle invalide' })
        }

        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Vous ne pouvez pas changer votre propre rôle' })
        }

        // Protéger les super-admins
        const targetUser = await query('SELECT email FROM users WHERE id = $1', [userId])
        if (targetUser.rows.length > 0 && isSuperAdmin(targetUser.rows[0].email)) {
            return res.status(403).json({ error: 'Impossible de modifier le rôle d\'un super-administrateur' })
        }

        await query('UPDATE users SET role = $1 WHERE id = $2', [role, userId])
        res.json({ message: 'Rôle mis à jour' })
    } catch (error) {
        console.error('Update role error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// DELETE /api/auth/users/:id
router.delete('/users/:id', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const userId = parseInt(req.params.id)
        if (isNaN(userId)) return res.status(400).json({ error: 'ID invalide' })

        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' })
        }

        // Protéger les super-admins
        const targetUser = await query('SELECT email FROM users WHERE id = $1', [userId])
        if (targetUser.rows.length > 0 && isSuperAdmin(targetUser.rows[0].email)) {
            return res.status(403).json({ error: 'Impossible de supprimer un super-administrateur' })
        }

        await query('DELETE FROM users WHERE id = $1', [userId])
        res.json({ message: 'Utilisateur supprimé' })
    } catch (error) {
        console.error('Delete user error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

module.exports = router
