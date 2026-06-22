const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { query } = require('../database')
const { authMiddleware, canWrite, requireRole, validateId } = require('../middleware/auth')

// Configuration Multer pour l'upload d'images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '')
        cb(null, 'news-' + uniqueSuffix + ext)
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

// La colonne `images` stocke un tableau JSON de chemins. On normalise toujours
// vers un vrai tableau cote API, en retombant sur l'image unique historique.
function parseImages(row) {
    let images = []
    if (row.images) {
        try {
            const parsed = JSON.parse(row.images)
            if (Array.isArray(parsed)) images = parsed.filter(Boolean)
        } catch { /* valeur non-JSON : on ignore */ }
    }
    if (images.length === 0 && row.image) images = [row.image]
    return { ...row, images }
}

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
            const parsedLimit = parseInt(limit, 10)
            if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 1000) {
                params.push(parsedLimit)
                sql += ` LIMIT $${params.length}`
            }
        }

        const result = await query(sql, params)
        res.json(result.rows.map(parseImages))

    } catch (error) {
        console.error('Get news error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// GET /api/news/:id - Récupérer une actualité
router.get('/:id', validateId, async (req, res) => {
    try {
        const result = await query('SELECT * FROM news WHERE id = $1', [req.params.id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Actualité non trouvée' })
        }

        res.json(parseImages(result.rows[0]))
    } catch (error) {
        console.error('Get news item error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// POST /api/news - Ajouter une actualité (Admin only)
router.post('/', authMiddleware, canWrite, upload.array('images', 10), async (req, res) => {
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

        const images = (req.files || []).map(f => `/uploads/${f.filename}`)
        const image = images[0] || null

        const result = await query(
            `INSERT INTO news (title, title_fr, title_en, title_ff, excerpt, excerpt_fr, excerpt_en, excerpt_ff, content, content_fr, content_en, content_ff, category, type, date, published, image, images, link, contact_email, contact_phone)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING *`,
            [title || title_fr, title_fr, title_en, title_ff, excerpt, excerpt_fr, excerpt_en, excerpt_ff, content, content_fr, content_en, content_ff, category, type, date || new Date(), published !== 'false', image, JSON.stringify(images), link, contact_email, contact_phone]
        )

        res.status(201).json(parseImages(result.rows[0]))

    } catch (error) {
        console.error('Add news error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// PUT /api/news/:id - Modifier une actualité (Admin only)
router.put('/:id', authMiddleware, canWrite, validateId, upload.array('images', 10), async (req, res) => {
    try {
        const {
            title, title_fr, title_en, title_ff,
            excerpt, excerpt_fr, excerpt_en, excerpt_ff,
            content, content_fr, content_en, content_ff,
            category, type, date, published,
            link, contact_email, contact_phone, existingImages
        } = req.body

        // Anciennes images (pour nettoyer celles qui ont ete retirees)
        const existing = await query('SELECT image, images FROM news WHERE id = $1', [req.params.id])
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Actualité non trouvée' })
        }
        const oldImages = parseImages(existing.rows[0]).images

        // Images conservees (envoyees par l'admin) + nouvelles televersees
        let kept = []
        try {
            const parsed = JSON.parse(existingImages || '[]')
            if (Array.isArray(parsed)) kept = parsed.filter(Boolean)
        } catch { /* champ absent/invalide : aucune conservee */ }
        const uploaded = (req.files || []).map(f => `/uploads/${f.filename}`)
        const images = [...kept, ...uploaded]
        const image = images[0] || null

        const result = await query(
            `UPDATE news
             SET title = $1, title_fr = $2, title_en = $3, title_ff = $4,
                 excerpt = $5, excerpt_fr = $6, excerpt_en = $7, excerpt_ff = $8,
                 content = $9, content_fr = $10, content_en = $11, content_ff = $12,
                 category = $13, type = $14, date = $15, published = $16, image = $17, images = $18,
                 link = $19, contact_email = $20, contact_phone = $21, updated_at = CURRENT_TIMESTAMP
             WHERE id = $22 RETURNING *`,
            [title || title_fr, title_fr, title_en, title_ff, excerpt, excerpt_fr, excerpt_en, excerpt_ff, content, content_fr, content_en, content_ff, category, type, date, published !== 'false', image, JSON.stringify(images), link, contact_email, contact_phone, req.params.id]
        )

        // Supprimer du disque les images retirees
        const removed = oldImages.filter(img => !images.includes(img))
        for (const img of removed) {
            const p = path.join(__dirname, '..', img)
            if (fs.existsSync(p)) fs.unlink(p, () => {})
        }

        res.json(parseImages(result.rows[0]))

    } catch (error) {
        console.error('Update news error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// DELETE /api/news/:id - Supprimer une actualité (Admin only)
router.delete('/:id', authMiddleware, requireRole('admin'), validateId, async (req, res) => {
    try {
        const result = await query('DELETE FROM news WHERE id = $1 RETURNING *', [req.params.id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Actualité non trouvée' })
        }

        // Supprimer toutes les images associées du disque
        const newsItem = parseImages(result.rows[0])
        for (const img of newsItem.images) {
            const imagePath = path.join(__dirname, '..', img)
            if (fs.existsSync(imagePath)) fs.unlink(imagePath, () => {})
        }

        res.json({ message: 'Actualité supprimée avec succès' })

    } catch (error) {
        console.error('Delete news error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

module.exports = router
