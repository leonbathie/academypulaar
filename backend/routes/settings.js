const express = require('express')
const router = express.Router()
const { query } = require('../database')
const { authMiddleware, requireRole } = require('../middleware/auth')

// Table clé/valeur générique pour les réglages du site (feature flags, etc.).
// Créée de manière idempotente au chargement du module : pas de migration
// manuelle requise en production.
const ensureTable = (async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS site_settings (
                key VARCHAR(100) PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        // Valeur par défaut : la page terminologie est visible.
        await query(
            `INSERT INTO site_settings (key, value) VALUES ('terminologie_visible', 'true')
             ON CONFLICT (key) DO NOTHING`
        )
    } catch (error) {
        console.error('Init site_settings error:', error.message)
    }
})()

// Convertit une valeur stockée (string) en type JS (booléen, nombre, …) si possible.
function parseValue(raw) {
    if (raw === null || raw === undefined) return null
    try {
        return JSON.parse(raw)
    } catch {
        return raw
    }
}

// GET /api/settings - Lire tous les réglages publics (map key -> valeur typée)
router.get('/', async (req, res) => {
    try {
        await ensureTable
        const result = await query('SELECT key, value FROM site_settings')
        const data = {}
        for (const row of result.rows) {
            data[row.key] = parseValue(row.value)
        }
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate')
        res.set('Pragma', 'no-cache')
        res.set('Expires', '0')
        res.json(data)
    } catch (error) {
        console.error('Get settings error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// PUT /api/settings/:key - Modifier un réglage (admin uniquement)
// Body: { value: any }
router.put('/:key', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        await ensureTable
        const key = req.params.key
        const { value } = req.body
        // Stocke en JSON pour préserver le type (booléen, nombre, string).
        const stored = JSON.stringify(value)
        const result = await query(
            `INSERT INTO site_settings (key, value) VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
             RETURNING key, value`,
            [key, stored]
        )
        res.json({ key: result.rows[0].key, value: parseValue(result.rows[0].value) })
    } catch (error) {
        console.error('Update setting error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

module.exports = router
