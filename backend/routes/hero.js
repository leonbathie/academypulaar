const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { query } = require('../database')
const { authMiddleware, canWrite, requireRole, validateId } = require('../middleware/auth')

const uploadsDir = path.resolve(__dirname, '..', 'uploads')
const heroDir = path.resolve(uploadsDir, 'hero')

for (const dir of [uploadsDir, heroDir]) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o775 })
        console.log(`[HERO] Dossier créé: ${dir}`)
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, heroDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '')
        cb(null, 'hero-' + uniqueSuffix + ext)
    }
})

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase()
        const allowedExts = /\.(jpeg|jpg|png|gif|webp|avif)$/
        if (allowedExts.test(ext) || file.mimetype.startsWith('image/')) {
            return cb(null, true)
        }
        cb(new Error('Type d\'image non supporté'))
    }
})

// GET /api/hero - Liste publique des slides publiées (ordonnées)
router.get('/', async (req, res) => {
    try {
        const includeAll = req.query.all === 'true'
        const sql = includeAll
            ? 'SELECT * FROM hero_slides ORDER BY sort_order ASC, created_at DESC'
            : 'SELECT * FROM hero_slides WHERE published = TRUE ORDER BY sort_order ASC, created_at DESC'
        const result = await query(sql)
        res.json(result.rows)
    } catch (error) {
        console.error('Get hero slides error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// GET /api/hero/:id
router.get('/:id', validateId, async (req, res) => {
    try {
        const result = await query('SELECT * FROM hero_slides WHERE id = $1', [req.params.id])
        if (result.rows.length === 0) return res.status(404).json({ error: 'Slide non trouvée' })
        res.json(result.rows[0])
    } catch (error) {
        console.error('Get hero slide error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// POST /api/hero - Créer une slide (admin)
router.post('/', authMiddleware, canWrite, upload.single('image'), async (req, res) => {
    try {
        const { title_fr, title_en, title_ff, subtitle_fr, subtitle_en, subtitle_ff, sort_order, published } = req.body

        const image = req.file ? `/uploads/hero/${req.file.filename}` : null

        const result = await query(
            `INSERT INTO hero_slides (title_fr, title_en, title_ff, subtitle_fr, subtitle_en, subtitle_ff, image, sort_order, published)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
                title_fr || null, title_en || null, title_ff || null,
                subtitle_fr || null, subtitle_en || null, subtitle_ff || null,
                image,
                parseInt(sort_order) || 0,
                published !== 'false'
            ]
        )
        res.status(201).json(result.rows[0])
    } catch (error) {
        console.error('Create hero slide error:', error)
        res.status(500).json({ error: 'Erreur serveur: ' + error.message })
    }
})

// PUT /api/hero/:id - Modifier une slide (admin)
router.put('/:id', authMiddleware, canWrite, validateId, upload.single('image'), async (req, res) => {
    try {
        const { title_fr, title_en, title_ff, subtitle_fr, subtitle_en, subtitle_ff, sort_order, published } = req.body
        const existing = await query('SELECT image FROM hero_slides WHERE id = $1', [req.params.id])
        if (existing.rows.length === 0) return res.status(404).json({ error: 'Slide non trouvée' })

        let image = existing.rows[0].image
        if (req.file) {
            // Supprimer l'ancienne image
            if (image) {
                const oldPath = path.resolve(__dirname, '..', image.replace(/^\/+/, ''))
                if (oldPath.startsWith(uploadsDir) && fs.existsSync(oldPath)) {
                    try { fs.unlinkSync(oldPath) } catch (e) {}
                }
            }
            image = `/uploads/hero/${req.file.filename}`
        }

        const result = await query(
            `UPDATE hero_slides SET title_fr = $1, title_en = $2, title_ff = $3,
             subtitle_fr = $4, subtitle_en = $5, subtitle_ff = $6,
             image = $7, sort_order = $8, published = $9,
             updated_at = CURRENT_TIMESTAMP WHERE id = $10 RETURNING *`,
            [
                title_fr || null, title_en || null, title_ff || null,
                subtitle_fr || null, subtitle_en || null, subtitle_ff || null,
                image,
                parseInt(sort_order) || 0,
                published !== 'false',
                req.params.id
            ]
        )
        res.json(result.rows[0])
    } catch (error) {
        console.error('Update hero slide error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// DELETE /api/hero/:id - Supprimer une slide (admin)
router.delete('/:id', authMiddleware, requireRole('admin'), validateId, async (req, res) => {
    try {
        const existing = await query('SELECT image FROM hero_slides WHERE id = $1', [req.params.id])
        if (existing.rows.length === 0) return res.status(404).json({ error: 'Slide non trouvée' })

        const image = existing.rows[0].image
        if (image) {
            const imgPath = path.resolve(__dirname, '..', image.replace(/^\/+/, ''))
            if (imgPath.startsWith(uploadsDir) && fs.existsSync(imgPath)) {
                try { fs.unlinkSync(imgPath) } catch (e) {}
            }
        }
        await query('DELETE FROM hero_slides WHERE id = $1', [req.params.id])
        res.json({ success: true })
    } catch (error) {
        console.error('Delete hero slide error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// PUT /api/hero/reorder - Réordonner les slides
router.put('/reorder/batch', authMiddleware, canWrite, async (req, res) => {
    try {
        const { orders } = req.body // [{ id: 1, sort_order: 0 }, { id: 2, sort_order: 1 }]
        if (!Array.isArray(orders)) return res.status(400).json({ error: 'Format invalide' })

        for (const item of orders) {
            await query('UPDATE hero_slides SET sort_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [item.sort_order, item.id])
        }
        res.json({ success: true })
    } catch (error) {
        console.error('Reorder hero slides error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

module.exports = router
