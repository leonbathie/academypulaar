const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { query } = require('../database')
const { authMiddleware, canWrite, requireRole, validateId } = require('../middleware/auth')

// Configuration de l'upload d'images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '')
        cb(null, 'member-' + uniqueSuffix + ext)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|gif/
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
        const mimetype = allowedTypes.test(file.mimetype)
        if (extname && mimetype) {
            return cb(null, true)
        }
        cb(new Error('Seules les images (JPEG, PNG, WebP, GIF) sont autorisées'))
    }
})

// GET /api/members - Récupérer tous les membres
router.get('/', async (req, res) => {
    try {
        const result = await query('SELECT * FROM members ORDER BY name ASC')
        res.json(result.rows)
    } catch (error) {
        console.error('Get members error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// GET /api/members/:id - Récupérer un membre
router.get('/:id', validateId, async (req, res) => {
    try {
        const result = await query('SELECT * FROM members WHERE id = $1', [req.params.id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Membre non trouvé' })
        }

        res.json(result.rows[0])
    } catch (error) {
        console.error('Get member error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// POST /api/members - Ajouter un membre (Admin only)
router.post('/', authMiddleware, canWrite, upload.single('image'), async (req, res) => {
    try {
        const { name, role_fr, role_en, role_ff, specialty, bio_fr, bio_en, bio_ff, joined, facebook, twitter, linkedin, website, email } = req.body
        const image = req.file ? `/uploads/${req.file.filename}` : null

        if (!name) {
            return res.status(400).json({ error: 'Le nom est requis' })
        }

        const result = await query(
            `INSERT INTO members (name, role_fr, role_en, role_ff, specialty, bio_fr, bio_en, bio_ff, image, joined, facebook, twitter, linkedin, website, email)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
            [name, role_fr, role_en, role_ff, specialty, bio_fr, bio_en, bio_ff, image, joined, facebook, twitter, linkedin, website, email]
        )

        res.status(201).json(result.rows[0])

    } catch (error) {
        console.error('Add member error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// PUT /api/members/:id - Modifier un membre (Admin only)
router.put('/:id', authMiddleware, canWrite, validateId, upload.single('image'), async (req, res) => {
    try {
        const { name, role_fr, role_en, role_ff, specialty, bio_fr, bio_en, bio_ff, joined, facebook, twitter, linkedin, website, email } = req.body

        // Récupérer l'ancienne image pour nettoyage
        const existing = await query('SELECT image FROM members WHERE id = $1', [req.params.id])
        const oldImage = existing.rows[0]?.image

        // Si une nouvelle image est uploadée, l'utiliser, sinon garder l'ancienne
        let image = existing.rows[0]?.image || null
        if (req.file) {
            image = `/uploads/${req.file.filename}`
        }

        const result = await query(
            `UPDATE members 
             SET name = $1, role_fr = $2, role_en = $3, role_ff = $4, specialty = $5,
                 bio_fr = $6, bio_en = $7, bio_ff = $8, image = $9, joined = $10,
                 facebook = $11, twitter = $12, linkedin = $13, website = $14, email = $15, updated_at = CURRENT_TIMESTAMP
             WHERE id = $16 RETURNING *`,
            [name, role_fr, role_en, role_ff, specialty, bio_fr, bio_en, bio_ff, image, joined, facebook, twitter, linkedin, website, email, req.params.id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Membre non trouvé' })
        }

        // Supprimer l'ancienne image si remplacée
        if (req.file && oldImage) {
            const oldPath = path.join(__dirname, '..', oldImage)
            if (fs.existsSync(oldPath)) fs.unlink(oldPath, () => {})
        }

        res.json(result.rows[0])

    } catch (error) {
        console.error('Update member error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// DELETE /api/members/:id - Supprimer un membre (Admin only)
router.delete('/:id', authMiddleware, requireRole('admin'), validateId, async (req, res) => {
    try {
        const result = await query('DELETE FROM members WHERE id = $1 RETURNING *', [req.params.id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Membre non trouvé' })
        }

        // Supprimer l'image associée du disque
        const member = result.rows[0]
        if (member.image) {
            const imagePath = path.join(__dirname, '..', member.image)
            if (fs.existsSync(imagePath)) fs.unlink(imagePath, () => {})
        }

        res.json({ message: 'Membre supprimé avec succès' })

    } catch (error) {
        console.error('Delete member error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

module.exports = router
