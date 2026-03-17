const express = require('express')
const router = express.Router()
const { query } = require('../database')
const { authMiddleware, canWrite, requireRole, validateId } = require('../middleware/auth')

// GET /api/questions - Récupérer toutes les questions
router.get('/', async (req, res) => {
    try {
        const result = await query('SELECT * FROM language_questions ORDER BY sort_order ASC, created_at DESC')
        res.json(result.rows)
    } catch (error) {
        console.error('Get questions error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// POST /api/questions - Ajouter une question
router.post('/', authMiddleware, canWrite, async (req, res) => {
    try {
        const {
            question_fr, question_en, question_ff,
            answer_fr, answer_en, answer_ff,
            sort_order
        } = req.body

        if (!question_fr) {
            return res.status(400).json({ error: 'La question (FR) est requise' })
        }
        if (!answer_fr) {
            return res.status(400).json({ error: 'La réponse (FR) est requise' })
        }

        const result = await query(
            `INSERT INTO language_questions (question_fr, question_en, question_ff, answer_fr, answer_en, answer_ff, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [question_fr, question_en || '', question_ff || '', answer_fr, answer_en || '', answer_ff || '', sort_order || 0]
        )

        res.status(201).json(result.rows[0])

    } catch (error) {
        console.error('Add question error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// PUT /api/questions/:id - Modifier une question
router.put('/:id', authMiddleware, canWrite, validateId, async (req, res) => {
    try {
        const {
            question_fr, question_en, question_ff,
            answer_fr, answer_en, answer_ff,
            sort_order
        } = req.body

        const result = await query(
            `UPDATE language_questions 
             SET question_fr = $1, question_en = $2, question_ff = $3,
                 answer_fr = $4, answer_en = $5, answer_ff = $6,
                 sort_order = $7, updated_at = CURRENT_TIMESTAMP
             WHERE id = $8 RETURNING *`,
            [question_fr, question_en, question_ff, answer_fr, answer_en, answer_ff, sort_order || 0, req.params.id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Question non trouvée' })
        }

        res.json(result.rows[0])

    } catch (error) {
        console.error('Update question error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// DELETE /api/questions/:id - Supprimer une question
router.delete('/:id', authMiddleware, requireRole('admin'), validateId, async (req, res) => {
    try {
        const result = await query('DELETE FROM language_questions WHERE id = $1 RETURNING id', [req.params.id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Question non trouvée' })
        }

        res.json({ message: 'Question supprimée avec succès' })

    } catch (error) {
        console.error('Delete question error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

module.exports = router
