const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { query } = require('../database')
const { authMiddleware, canWrite, requireRole, validateId } = require('../middleware/auth')
const { UPLOADS_ROOT, resolveSafeExt, isAllowedImage, ensureUploadedFilesReadable, safeUnlinkUpload } = require('../utils/uploadHelper')

const uploadsDir = UPLOADS_ROOT
const scholarsDir = path.resolve(uploadsDir, 'scholars')

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, scholarsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = resolveSafeExt(file, '.jpg')
        cb(null, 'scholar-' + uniqueSuffix + ext)
    }
})

const upload = multer({
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (isAllowedImage(file)) {
            return cb(null, true)
        }
        cb(new Error('Type d\'image non supporté'))
    }
})

// GET /api/scholars - Liste publique des savants publiés
router.get('/', async (req, res) => {
    try {
        const includeAll = req.query.all === 'true'
        const sql = includeAll
            ? 'SELECT * FROM scholars ORDER BY created_at DESC'
            : 'SELECT * FROM scholars WHERE published = TRUE ORDER BY created_at DESC'
        const result = await query(sql)
        res.json(result.rows)
    } catch (error) {
        console.error('Get scholars error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// GET /api/scholars/random - Un savant aléatoire
router.get('/random', async (req, res) => {
    try {
        const result = await query('SELECT * FROM scholars WHERE published = TRUE ORDER BY RANDOM() LIMIT 1')
        if (result.rows.length === 0) return res.json(null)
        res.json(result.rows[0])
    } catch (error) {
        console.error('Random scholar error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// GET /api/scholars/:id
router.get('/:id', validateId, async (req, res) => {
    try {
        const result = await query('SELECT * FROM scholars WHERE id = $1', [req.params.id])
        if (result.rows.length === 0) return res.status(404).json({ error: 'Savant non trouvé' })
        res.json(result.rows[0])
    } catch (error) {
        console.error('Get scholar error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// POST /api/scholars - Créer (admin)
router.post('/', authMiddleware, canWrite, upload.single('image'), async (req, res) => {
    try {
        const { name, years, bio_fr, bio_en, bio_ff, published, image_position } = req.body
        if (!name) return res.status(400).json({ error: 'Le nom est requis' })

        ensureUploadedFilesReadable(req)
        const image = req.file ? `/uploads/scholars/${req.file.filename}` : null

        const result = await query(
            `INSERT INTO scholars (name, years, image, image_position, bio_fr, bio_en, bio_ff, published)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [name, years || null, image, image_position || '50% 20%', bio_fr || null, bio_en || null, bio_ff || null, published !== 'false']
        )
        res.status(201).json(result.rows[0])
    } catch (error) {
        console.error('Create scholar error:', error)
        res.status(500).json({ error: 'Erreur serveur: ' + error.message })
    }
})

// PUT /api/scholars/:id - Modifier (admin)
router.put('/:id', authMiddleware, canWrite, validateId, upload.single('image'), async (req, res) => {
    try {
        const { name, years, bio_fr, bio_en, bio_ff, published, image_position } = req.body
        const existing = await query('SELECT image, image_position FROM scholars WHERE id = $1', [req.params.id])
        if (existing.rows.length === 0) return res.status(404).json({ error: 'Savant non trouvé' })

        ensureUploadedFilesReadable(req)
        const removeImage = req.body.remove_image === '1' || req.body.remove_image === 'true'
        let image = existing.rows[0].image
        if (req.file) {
            if (image) safeUnlinkUpload(image)
            image = `/uploads/scholars/${req.file.filename}`
        } else if (removeImage) {
            if (image) safeUnlinkUpload(image)
            image = null
        }
        const finalPosition = image_position || existing.rows[0].image_position || '50% 20%'

        const result = await query(
            `UPDATE scholars SET name = $1, years = $2, image = $3, image_position = $4, bio_fr = $5, bio_en = $6,
             bio_ff = $7, published = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9 RETURNING *`,
            [name, years || null, image, finalPosition, bio_fr || null, bio_en || null, bio_ff || null, published !== 'false', req.params.id]
        )
        res.json(result.rows[0])
    } catch (error) {
        console.error('Update scholar error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// DELETE /api/scholars/:id - Supprimer (admin)
router.delete('/:id', authMiddleware, requireRole('admin'), validateId, async (req, res) => {
    try {
        const existing = await query('SELECT image FROM scholars WHERE id = $1', [req.params.id])
        if (existing.rows.length === 0) return res.status(404).json({ error: 'Savant non trouvé' })

        const image = existing.rows[0].image
        if (image) {
            const imgPath = path.resolve(__dirname, '..', image.replace(/^\/+/, ''))
            if (imgPath.startsWith(uploadsDir) && fs.existsSync(imgPath)) {
                try { fs.unlinkSync(imgPath) } catch (e) {}
            }
        }
        await query('DELETE FROM scholars WHERE id = $1', [req.params.id])
        res.json({ success: true })
    } catch (error) {
        console.error('Delete scholar error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

module.exports = router
