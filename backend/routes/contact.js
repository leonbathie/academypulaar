const express = require('express')
const router = express.Router()
const { query } = require('../database')
const { authMiddleware, requireRole } = require('../middleware/auth')

// POST /api/contact - Stocker un message de contact
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'Tous les champs sont requis' })
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Email invalide' })
        }

        await query(
            `INSERT INTO contact_messages (name, email, subject, message)
             VALUES ($1, $2, $3, $4)`,
            [name.trim(), email.trim(), subject.trim(), message.trim()]
        )

        console.log(`[CONTACT] Message reçu de ${name} (${email}): ${subject}`)

        res.json({ message: 'Message envoyé avec succès' })

    } catch (error) {
        console.error('Contact error:', error)
        res.status(500).json({ error: 'Erreur lors de l\'envoi du message' })
    }
})

// GET /api/contact - Lister les messages (admin)
router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM contact_messages ORDER BY created_at DESC'
        )
        res.json(result.rows)
    } catch (error) {
        console.error('List contact messages error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// PUT /api/contact/:id/read - Marquer comme lu
router.put('/:id/read', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' })

        await query('UPDATE contact_messages SET read = true WHERE id = $1', [id])
        res.json({ message: 'Marqué comme lu' })
    } catch (error) {
        console.error('Mark read error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// DELETE /api/contact/:id - Supprimer un message
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' })

        await query('DELETE FROM contact_messages WHERE id = $1', [id])
        res.json({ message: 'Message supprimé' })
    } catch (error) {
        console.error('Delete contact message error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

module.exports = router
