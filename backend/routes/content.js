const express = require('express')
const router = express.Router()
const { query } = require('../database')
const { authMiddleware, canWrite, validateId } = require('../middleware/auth')

// ============================================
// ROUTES "DIRE, NE PAS DIRE"
// ============================================

// GET /api/content/dire - Récupérer tous les "Dire, Ne pas dire"
router.get('/dire', async (req, res) => {
    try {
        const result = await query('SELECT * FROM dire_ne_pas_dire ORDER BY created_at DESC')
        res.json(result.rows)
    } catch (error) {
        console.error('Get dire error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// POST /api/content/dire - Ajouter un "Dire, Ne pas dire"
router.post('/dire', authMiddleware, canWrite, async (req, res) => {
    try {
        const {
            category,
            dire, dire_fr, dire_en, dire_ff,
            ne_pas_dire, ne_pas_dire_fr, ne_pas_dire_en, ne_pas_dire_ff,
            explanation, explanation_fr, explanation_en, explanation_ff
        } = req.body

        if (!dire && !dire_fr) {
            return res.status(400).json({ error: 'Dire est requis' })
        }
        if (!ne_pas_dire && !ne_pas_dire_fr) {
            return res.status(400).json({ error: 'Ne pas dire est requis' })
        }

        const result = await query(
            `INSERT INTO dire_ne_pas_dire (category, dire, dire_fr, dire_en, dire_ff, ne_pas_dire, ne_pas_dire_fr, ne_pas_dire_en, ne_pas_dire_ff, explanation, explanation_fr, explanation_en, explanation_ff)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
            [category, dire || dire_fr, dire_fr, dire_en, dire_ff, ne_pas_dire || ne_pas_dire_fr, ne_pas_dire_fr, ne_pas_dire_en, ne_pas_dire_ff, explanation, explanation_fr, explanation_en, explanation_ff]
        )

        res.status(201).json(result.rows[0])

    } catch (error) {
        console.error('Add dire error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// PUT /api/content/dire/:id - Modifier un "Dire, Ne pas dire"
router.put('/dire/:id', authMiddleware, canWrite, validateId, async (req, res) => {
    try {
        const {
            category,
            dire, dire_fr, dire_en, dire_ff,
            ne_pas_dire, ne_pas_dire_fr, ne_pas_dire_en, ne_pas_dire_ff,
            explanation, explanation_fr, explanation_en, explanation_ff
        } = req.body

        const result = await query(
            `UPDATE dire_ne_pas_dire 
             SET category = $1, dire = $2, dire_fr = $3, dire_en = $4, dire_ff = $5,
                 ne_pas_dire = $6, ne_pas_dire_fr = $7, ne_pas_dire_en = $8, ne_pas_dire_ff = $9,
                 explanation = $10, explanation_fr = $11, explanation_en = $12, explanation_ff = $13,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $14 RETURNING *`,
            [category, dire || dire_fr, dire_fr, dire_en, dire_ff, ne_pas_dire || ne_pas_dire_fr, ne_pas_dire_fr, ne_pas_dire_en, ne_pas_dire_ff, explanation, explanation_fr, explanation_en, explanation_ff, req.params.id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Entrée non trouvée' })
        }

        res.json(result.rows[0])

    } catch (error) {
        console.error('Update dire error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// DELETE /api/content/dire/:id - Supprimer un "Dire, Ne pas dire"
router.delete('/dire/:id', authMiddleware, canWrite, validateId, async (req, res) => {
    try {
        const result = await query('DELETE FROM dire_ne_pas_dire WHERE id = $1 RETURNING id', [req.params.id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Entrée non trouvée' })
        }

        res.json({ message: 'Entrée supprimée avec succès' })

    } catch (error) {
        console.error('Delete dire error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// ============================================
// ROUTES CONTENU GÉNÉRAL
// ============================================

// GET /api/content - Récupérer tout le contenu
router.get('/', async (req, res) => {
    try {
        const { section } = req.query
        let sql = 'SELECT * FROM content'
        const params = []

        if (section) {
            sql += ' WHERE section = $1'
            params.push(section)
        }

        sql += ' ORDER BY section, key'

        const result = await query(sql, params)
        res.json(result.rows)

    } catch (error) {
        console.error('Get content error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// POST /api/content - Ajouter/Modifier du contenu (upsert)
router.post('/', authMiddleware, canWrite, async (req, res) => {
    try {
        const { section, key, value_fr, value_en, value_ff } = req.body

        if (!section || !key) {
            return res.status(400).json({ error: 'Section et clé sont requis' })
        }

        const result = await query(
            `INSERT INTO content (section, key, value_fr, value_en, value_ff)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (section, key) 
             DO UPDATE SET value_fr = $3, value_en = $4, value_ff = $5, updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [section, key, value_fr, value_en, value_ff]
        )

        res.json(result.rows[0])

    } catch (error) {
        console.error('Add content error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// DELETE /api/content/:id - Supprimer du contenu
router.delete('/:id', authMiddleware, canWrite, validateId, async (req, res) => {
    try {
        const result = await query('DELETE FROM content WHERE id = $1 RETURNING id', [req.params.id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Contenu non trouvé' })
        }

        res.json({ message: 'Contenu supprimé avec succès' })

    } catch (error) {
        console.error('Delete content error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

module.exports = router
