const express = require('express')
const router = express.Router()
const { query } = require('../database')
const { authMiddleware, canWrite, requireRole } = require('../middleware/auth')

// GET /api/terminologie - Recuperer tout le contenu de la section 'terminologie'
// Pas de cache : l'admin modifie souvent ces textes et veut les voir
// immediatement sur la page publique.
router.get('/', async (req, res) => {
    try {
        const result = await query("SELECT key, value_fr, value_en, value_ff FROM content WHERE section = 'terminologie' ORDER BY key")
        const data = {}
        for (const row of result.rows) {
            data[row.key] = { value_fr: row.value_fr, value_en: row.value_en, value_ff: row.value_ff }
        }
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate')
        res.set('Pragma', 'no-cache')
        res.set('Expires', '0')
        res.json(data)
    } catch (error) {
        console.error('Get terminologie error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// POST /api/terminologie - Upsert multiple clés pour la section 'terminologie'
// Body: { entries: { key1: { value_fr, value_en, value_ff }, ... } } OR { entries: [{ key, value_fr, value_en, value_ff }, ...] }
router.post('/', authMiddleware, canWrite, async (req, res) => {
    try {
        const { entries } = req.body
        if (!entries) {
            return res.status(400).json({ error: 'Aucune entrée fournie' })
        }

        const client = await query('BEGIN').catch(() => null)
        // Accept object map or array
        const items = Array.isArray(entries) ? entries : Object.keys(entries).map(k => ({ key: k, ...entries[k] }))

        const upserted = []
        for (const item of items) {
            const { key, value_fr, value_en, value_ff } = item
            if (!key) continue
            const result = await query(
                `INSERT INTO content (section, key, value_fr, value_en, value_ff)
                 VALUES ('terminologie', $1, $2, $3, $4)
                 ON CONFLICT (section, key) DO UPDATE SET value_fr = $2, value_en = $3, value_ff = $4, updated_at = CURRENT_TIMESTAMP
                 RETURNING *`,
                [key, value_fr, value_en, value_ff]
            )
            upserted.push(result.rows[0])
        }

        await query('COMMIT').catch(() => {})
        res.json({ updated: upserted.length, items: upserted })

    } catch (error) {
        console.error('Upsert terminologie error:', error)
        try { await query('ROLLBACK') } catch (e) {}
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// DELETE /api/terminologie/:key - Supprimer une clé spécifique (admin seulement)
router.delete('/:key', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const key = req.params.key
        const result = await query('DELETE FROM content WHERE section = $1 AND key = $2 RETURNING id', ['terminologie', key])
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Clé non trouvée' })
        }
        res.json({ message: 'Supprimé', key })
    } catch (error) {
        console.error('Delete terminologie key error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

module.exports = router
