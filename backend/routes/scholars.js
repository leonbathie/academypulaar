const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { query } = require('../database')
const { authMiddleware, canWrite, requireRole, validateId } = require('../middleware/auth')

const uploadsDir = path.resolve(__dirname, '..', 'uploads')
const scholarsDir = path.resolve(uploadsDir, 'scholars')

for (const dir of [uploadsDir, scholarsDir]) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o775 })
        console.log(`[SCHOLARS] Dossier créé: ${dir}`)
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, scholarsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '')
        cb(null, 'scholar-' + uniqueSuffix + ext)
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
        const { name, years, bio_fr, bio_en, bio_ff, published } = req.body
        if (!name) return res.status(400).json({ error: 'Le nom est requis' })

        const image = req.file ? `/uploads/scholars/${req.file.filename}` : null

        const result = await query(
            `INSERT INTO scholars (name, years, image, bio_fr, bio_en, bio_ff, published)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, years || null, image, bio_fr || null, bio_en || null, bio_ff || null, published !== 'false']
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
        const { name, years, bio_fr, bio_en, bio_ff, published } = req.body
        const existing = await query('SELECT image FROM scholars WHERE id = $1', [req.params.id])
        if (existing.rows.length === 0) return res.status(404).json({ error: 'Savant non trouvé' })

        let image = existing.rows[0].image
        if (req.file) {
            // Supprimer l'ancienne image
            if (image) {
                const oldPath = path.resolve(__dirname, '..', image.replace(/^\/+/, ''))
                if (oldPath.startsWith(uploadsDir) && fs.existsSync(oldPath)) {
                    try { fs.unlinkSync(oldPath) } catch (e) {}
                }
            }
            image = `/uploads/scholars/${req.file.filename}`
        }

        const result = await query(
            `UPDATE scholars SET name = $1, years = $2, image = $3, bio_fr = $4, bio_en = $5, bio_ff = $6,
             published = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *`,
            [name, years || null, image, bio_fr || null, bio_en || null, bio_ff || null, published !== 'false', req.params.id]
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
