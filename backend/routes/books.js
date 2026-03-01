const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { query } = require('../database')
const { authMiddleware, adminOnly } = require('../middleware/auth')

// Configuration Multer pour l'upload de livres et images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const folder = file.fieldname === 'cover' ? 'uploads/' : 'uploads/books/'
        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true })
        }
        cb(null, folder)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const prefix = file.fieldname === 'cover' ? 'book-cover-' : 'book-'
        cb(null, prefix + uniqueSuffix + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max pour les livres
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'cover') {
            const allowedTypes = /jpeg|jpg|png|gif|webp/
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
            const mimetype = allowedTypes.test(file.mimetype)
            if (extname && mimetype) {
                return cb(null, true)
            }
            cb(new Error('Seules les images sont acceptées pour la couverture'))
        } else {
            const allowedTypes = /pdf|epub|mobi|doc|docx/
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
            if (extname) {
                return cb(null, true)
            }
            cb(new Error('Formats acceptés: PDF, EPUB, MOBI, DOC, DOCX'))
        }
    }
})

const uploadFields = upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'file', maxCount: 1 }
])

// Wrapper multer : gère les erreurs d'upload proprement (413, 400...)
const handleUpload = (req, res, next) => {
    console.log(`[BOOKS] handleUpload START - ${req.method} ${req.originalUrl}`)
    console.log(`[BOOKS] Headers: Content-Type=${req.headers['content-type']}, Authorization=${req.headers['authorization'] ? 'Bearer ...' : 'MISSING'}`)
    uploadFields(req, res, (err) => {
        if (err) {
            console.error(`[BOOKS] Multer error:`, err.code, err.message, err.field)
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(413).json({
                        error: 'Fichier trop volumineux',
                        message: 'La taille maximale autorisée est de 100 Mo'
                    })
                }
                return res.status(400).json({
                    error: 'Erreur upload',
                    message: err.message
                })
            }
            // Erreur custom (fileFilter rejection)
            return res.status(400).json({
                error: 'Fichier non accepté',
                message: err.message
            })
        }
        console.log(`[BOOKS] Multer OK - Body keys: [${Object.keys(req.body || {}).join(', ')}], Files: ${JSON.stringify(Object.keys(req.files || {}))}`)
        next()
    })
}

// GET /api/books - Récupérer tous les livres
router.get('/', async (req, res) => {
    try {
        const { category, published } = req.query
        let sql = 'SELECT * FROM books'
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

        sql += ' ORDER BY created_at DESC'

        const result = await query(sql, params)
        res.json(result.rows)

    } catch (error) {
        console.error('Get books error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// GET /api/books/:id - Récupérer un livre
router.get('/:id', async (req, res) => {
    try {
        const result = await query('SELECT * FROM books WHERE id = $1', [req.params.id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Livre non trouvé' })
        }

        res.json(result.rows[0])
    } catch (error) {
        console.error('Get book error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// GET /api/books/:id/download - Télécharger un livre
router.get('/:id/download', async (req, res) => {
    try {
        const result = await query('SELECT * FROM books WHERE id = $1', [req.params.id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Livre non trouvé' })
        }

        const book = result.rows[0]

        if (!book.file_path) {
            return res.status(404).json({ error: 'Fichier non disponible' })
        }

        const filePath = path.join(__dirname, '..', book.file_path)

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Fichier non trouvé' })
        }

        // Incrémenter le compteur de téléchargements
        await query('UPDATE books SET downloads = downloads + 1 WHERE id = $1', [req.params.id])

        res.download(filePath)

    } catch (error) {
        console.error('Download book error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// POST /api/books - Ajouter un livre (Admin only)
router.post('/', authMiddleware, adminOnly, handleUpload, async (req, res) => {
    console.log(`[BOOKS] POST handler START`)
    console.log(`[BOOKS] User: ${req.user?.username} (role: ${req.user?.role})`)
    try {
        const {
            title_fr, title_en, title_ff,
            author, description_fr, description_en, description_ff,
            category, year, published, price, is_free, payment_link
        } = req.body

        console.log(`[BOOKS] Parsed body: title_fr="${title_fr}", author="${author}", category="${category}"`)
        console.log(`[BOOKS] Files received: cover=${req.files?.cover?.[0]?.filename || 'none'}, file=${req.files?.file?.[0]?.filename || 'none'}`)

        if (!title_fr) {
            console.log(`[BOOKS] REJECTED: title_fr missing`)
            return res.status(400).json({ error: 'Le titre en français est requis' })
        }

        const cover_image = req.files?.cover?.[0] ? `/uploads/${req.files.cover[0].filename}` : null
        const file_path = req.files?.file?.[0] ? `/uploads/books/${req.files.file[0].filename}` : null
        const file_size = req.files?.file?.[0]?.size || null

        console.log(`[BOOKS] Inserting into DB: cover=${cover_image}, file=${file_path}, size=${file_size}`)

        const result = await query(
            `INSERT INTO books (title_fr, title_en, title_ff, author, description_fr, description_en, description_ff, cover_image, file_path, file_size, category, year, published, price, is_free, payment_link)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
            [title_fr, title_en, title_ff, author, description_fr, description_en, description_ff, cover_image, file_path, file_size, category, year || null, published !== 'false', price || 0, is_free !== 'false', payment_link || null]
        )

        console.log(`[BOOKS] INSERT SUCCESS: id=${result.rows[0].id}`)
        res.status(201).json(result.rows[0])

    } catch (error) {
        console.error('[BOOKS] POST ERROR:', error.message, error.stack)
        res.status(500).json({ error: 'Erreur serveur', message: error.message })
    }
})

// PUT /api/books/:id - Modifier un livre (Admin only)
router.put('/:id', authMiddleware, adminOnly, handleUpload, async (req, res) => {
    console.log(`[BOOKS] PUT handler START - book id=${req.params.id}`)
    console.log(`[BOOKS] User: ${req.user?.username} (role: ${req.user?.role})`)
    try {
        const {
            title_fr, title_en, title_ff,
            author, description_fr, description_en, description_ff,
            category, year, published, price, is_free, payment_link
        } = req.body

        let cover_image = req.body.existingCover || null
        let file_path = req.body.existingFile || null
        let file_size = req.body.existingFileSize || null

        if (req.files?.cover?.[0]) {
            cover_image = `/uploads/${req.files.cover[0].filename}`
        }
        if (req.files?.file?.[0]) {
            file_path = `/uploads/books/${req.files.file[0].filename}`
            file_size = req.files.file[0].size
        }

        const result = await query(
            `UPDATE books 
             SET title_fr = $1, title_en = $2, title_ff = $3, author = $4,
                 description_fr = $5, description_en = $6, description_ff = $7,
                 cover_image = $8, file_path = $9, file_size = $10,
                 category = $11, year = $12, published = $13, price = $14, is_free = $15, payment_link = $16, updated_at = CURRENT_TIMESTAMP
             WHERE id = $17 RETURNING *`,
            [title_fr, title_en, title_ff, author, description_fr, description_en, description_ff, cover_image, file_path, file_size, category, year || null, published !== 'false', price || 0, is_free !== 'false', payment_link || null, req.params.id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Livre non trouvé' })
        }

        res.json(result.rows[0])

    } catch (error) {
        console.error('[BOOKS] PUT ERROR:', error.message, error.stack)
        res.status(500).json({ error: 'Erreur serveur', message: error.message })
    }
})

// DELETE /api/books/:id - Supprimer un livre (Admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const result = await query('DELETE FROM books WHERE id = $1 RETURNING *', [req.params.id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Livre non trouvé' })
        }

        // Supprimer les fichiers associés
        const book = result.rows[0]
        if (book.cover_image) {
            const coverPath = path.join(__dirname, '..', book.cover_image)
            if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath)
        }
        if (book.file_path) {
            const filePath = path.join(__dirname, '..', book.file_path)
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        }

        res.json({ message: 'Livre supprimé avec succès' })

    } catch (error) {
        console.error('Delete book error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

module.exports = router
