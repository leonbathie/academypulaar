const express = require('express')
const router = express.Router()
const nodemailer = require('nodemailer')
const { query } = require('../database')
const { authMiddleware, requireRole } = require('../middleware/auth')
const { SUPER_ADMIN_EMAILS } = require('../config/super-admins')

// Transporter SMTP (Gmail App Password)
let transporter = null
if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    })
    console.log(`[CONTACT] Email notifications enabled via ${process.env.SMTP_USER}`)
} else {
    console.log('[CONTACT] SMTP not configured - messages stored in DB only')
}

// Escape HTML pour éviter XSS dans les emails
function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// POST /api/contact - Stocker + envoyer par email
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'Tous les champs sont requis' })
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Email invalide' })
        }

        // Stocker en base
        await query(
            `INSERT INTO contact_messages (name, email, subject, message)
             VALUES ($1, $2, $3, $4)`,
            [name.trim(), email.trim(), subject.trim(), message.trim()]
        )

        // Envoyer par email aux super-admins
        if (transporter) {
            try {
                await transporter.sendMail({
                    from: `"Goomu Fulo Wi\u0257to" <${process.env.SMTP_USER}>`,
                    to: SUPER_ADMIN_EMAILS.join(', '),
                    replyTo: email.trim(),
                    subject: `[Contact] ${subject.trim()}`,
                    html: `
                        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                            <div style="background:#1a1a2e;color:#c9a227;padding:20px;text-align:center;border-radius:8px 8px 0 0">
                                <h2 style="margin:0">Nouveau message de contact</h2>
                                <p style="margin:5px 0 0;color:#ccc;font-size:14px">goomufulo.com</p>
                            </div>
                            <div style="padding:24px;background:#f9f9f9;border:1px solid #ddd">
                                <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
                                <p><strong>Email :</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
                                <p><strong>Sujet :</strong> ${escapeHtml(subject)}</p>
                                <hr style="border:none;border-top:1px solid #ddd;margin:16px 0">
                                <p><strong>Message :</strong></p>
                                <div style="background:white;padding:16px;border-radius:4px;border:1px solid #eee;white-space:pre-wrap">${escapeHtml(message)}</div>
                            </div>
                            <div style="padding:12px;text-align:center;color:#888;font-size:12px">
                                Vous pouvez r\u00e9pondre directement \u00e0 cet email pour contacter ${escapeHtml(name)}.
                            </div>
                        </div>
                    `
                })
                console.log(`[CONTACT] Email envoyé aux admins pour: ${subject}`)
            } catch (emailErr) {
                console.error('[CONTACT] Email failed (message saved in DB):', emailErr.message)
            }
        }

        console.log(`[CONTACT] Message reçu de ${name} (${email}): ${subject}`)
        res.json({ message: 'Message envoyé avec succès' })

    } catch (error) {
        console.error('Contact error:', error)
        res.status(500).json({ error: "Erreur lors de l'envoi du message" })
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
