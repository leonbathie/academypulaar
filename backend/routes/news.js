const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const { query } = require('../database')
const { authMiddleware, adminOnly } = require('../middleware/auth')

// Configuration Multer pour l'upload d'images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, 'news-' + uniqueSuffix + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
        const mimetype = allowedTypes.test(file.mimetype)
        if (extname && mimetype) {
            return cb(null, true)
        }
        cb(new Error('Seules les images sont acceptées'))
    }
})

// GET /api/news - Récupérer toutes les actualités
router.get('/', async (req, res) => {
    try {
        const { category, published, limit } = req.query
        let sql = 'SELECT * FROM news'
        const params = []
        const conditions = []

        if (category) {
            conditions.push(`category = $${params.length + 1}`)
            params.push(category)
        }

        if (published !== undefined) {
            conditions.push(`published = $${params.length + 1}`)
            params.push(published === 'true')
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ')
        }

        sql += ' ORDER BY date DESC'

        if (limit) {
            sql += ` LIMIT ${parseInt(limit)}`
        }

        const result = await query(sql, params)
        res.json(result.rows)

    } catch (error) {
        console.error('Get news error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// GET /api/news/:id - Récupérer une actualité
router.get('/:id', async (req, res) => {
    try {
        const result = await query('SELECT * FROM news WHERE id = $1', [req.params.id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Actualité non trouvée' })
        }

        res.json(result.rows[0])
    } catch (error) {
        console.error('Get news item error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// POST /api/news - Ajouter une actualité (Admin only)
router.post('/', authMiddleware, adminOnly, upload.single('image'), async (req, res) => {
    try {
        const {
            title, title_fr, title_en, title_ff,
            excerpt, excerpt_fr, excerpt_en, excerpt_ff,
            content, content_fr, content_en, content_ff,
            category, type, date, published,
            link, contact_email, contact_phone
        } = req.body

        if (!title && !title_fr) {
            return res.status(400).json({ error: 'Le titre est requis' })
        }

        const image = req.file ? `/uploads/${req.file.filename}` : null

        const result = await query(
            `INSERT INTO news (title, title_fr, title_en, title_ff, excerpt, excerpt_fr, excerpt_en, excerpt_ff, content, content_fr, content_en, content_ff, category, type, date, published, image, link, contact_email, contact_phone)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *`,
            [title || title_fr, title_fr, title_en, title_ff, excerpt, excerpt_fr, excerpt_en, excerpt_ff, content, content_fr, content_en, content_ff, category, type, date || new Date(), published !== 'false', image, link, contact_email, contact_phone]
        )

        res.status(201).json(result.rows[0])

    } catch (error) {
        console.error('Add news error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// PUT /api/news/:id - Modifier une actualité (Admin only)
router.put('/:id', authMiddleware, adminOnly, upload.single('image'), async (req, res) => {
    try {
        const {
            title, title_fr, title_en, title_ff,
            excerpt, excerpt_fr, excerpt_en, excerpt_ff,
            content, content_fr, content_en, content_ff,
            category, type, date, published,
            link, contact_email, contact_phone
        } = req.body

        let image = req.body.existingImage || null
        if (req.file) {
            image = `/uploads/${req.file.filename}`
        }

        const result = await query(
            `UPDATE news 
             SET title = $1, title_fr = $2, title_en = $3, title_ff = $4, 
                 excerpt = $5, excerpt_fr = $6, excerpt_en = $7, excerpt_ff = $8,
                 content = $9, content_fr = $10, content_en = $11, content_ff = $12,
                 category = $13, type = $14, date = $15, published = $16, image = $17,
                 link = $18, contact_email = $19, contact_phone = $20, updated_at = CURRENT_TIMESTAMP
             WHERE id = $21 RETURNING *`,
            [title || title_fr, title_fr, title_en, title_ff, excerpt, excerpt_fr, excerpt_en, excerpt_ff, content, content_fr, content_en, content_ff, category, type, date, published !== 'false', image, link, contact_email, contact_phone, req.params.id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Actualité non trouvée' })
        }

        res.json(result.rows[0])

    } catch (error) {
        console.error('Update news error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// DELETE /api/news/:id - Supprimer une actualité (Admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const result = await query('DELETE FROM news WHERE id = $1 RETURNING id', [req.params.id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Actualité non trouvée' })
        }

        res.json({ message: 'Actualité supprimée avec succès' })

    } catch (error) {
        console.error('Delete news error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

module.exports = router
