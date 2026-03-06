const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const pdfParse = require('pdf-parse')
const { query } = require('../database')
const { authMiddleware, adminOnly } = require('../middleware/auth')

// Configuration multer pour les fichiers audio
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname))
    }
})

const audioFilter = (req, file, cb) => {
    const allowedTypes = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4']
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Type de fichier audio non supporté'), false)
    }
}

const upload = multer({
    storage: storage,
    fileFilter: audioFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
})

// GET /api/dictionary - Récupérer tous les mots
router.get('/', async (req, res) => {
    try {
        const { search, category, letter } = req.query
        let sql = 'SELECT * FROM dictionary'
        const params = []
        const conditions = []

        if (search) {
            conditions.push(`(word ILIKE $${params.length + 1} OR translation_fr ILIKE $${params.length + 1})`)
            params.push(`%${search}%`)
        }

        if (category) {
            conditions.push(`category = $${params.length + 1}`)
            params.push(category)
        }

        if (letter) {
            conditions.push(`word ILIKE $${params.length + 1}`)
            params.push(`${letter}%`)
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ')
        }

        sql += ' ORDER BY word ASC'

        const result = await query(sql, params)
        res.json(result.rows)

    } catch (error) {
        console.error('Get dictionary error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// GET /api/dictionary/:id - Récupérer un mot
router.get('/:id', async (req, res) => {
    try {
        const result = await query('SELECT * FROM dictionary WHERE id = $1', [req.params.id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Mot non trouvé' })
        }

        res.json(result.rows[0])

    } catch (error) {
        console.error('Get word error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// POST /api/dictionary - Ajouter un mot (Admin only)
router.post('/', authMiddleware, adminOnly, upload.fields([
    { name: 'audio_word', maxCount: 1 },
    { name: 'audio_example', maxCount: 1 }
]), async (req, res) => {
    try {
        const { word, translation_fr, translation_en, translation_ff, category, domain, example, example_translation } = req.body

        if (!word) {
            return res.status(400).json({ error: 'Le mot est requis' })
        }

        // Vérifier si le mot existe déjà
        const existingWord = await query('SELECT id FROM dictionary WHERE word = $1', [word])
        if (existingWord.rows.length > 0) {
            return res.status(400).json({ error: `Le mot "${word}" existe déjà dans le dictionnaire.` })
        }

        // Récupérer les chemins des fichiers audio
        let audioWordPath = null
        let audioExamplePath = null

        if (req.files) {
            if (req.files['audio_word'] && req.files['audio_word'][0]) {
                audioWordPath = '/uploads/' + req.files['audio_word'][0].filename
            }
            if (req.files['audio_example'] && req.files['audio_example'][0]) {
                audioExamplePath = '/uploads/' + req.files['audio_example'][0].filename
            }
        }

        const result = await query(
            `INSERT INTO dictionary (word, translation_fr, translation_en, translation_ff, category, domain, example, example_translation, audio_word, audio_example)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [word, translation_fr, translation_en, translation_ff, category, domain || null, example, example_translation, audioWordPath, audioExamplePath]
        )

        res.status(201).json(result.rows[0])

    } catch (error) {
        console.error('Add word error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// PUT /api/dictionary/:id - Modifier un mot (Admin only)
router.put('/:id', authMiddleware, adminOnly, upload.fields([
    { name: 'audio_word', maxCount: 1 },
    { name: 'audio_example', maxCount: 1 }
]), async (req, res) => {
    try {
        const { word, translation_fr, translation_en, translation_ff, category, domain, example, example_translation } = req.body

        // Vérifier si le mot existe déjà (exclure l'ID actuel)
        if (word) {
            const existingWord = await query('SELECT id FROM dictionary WHERE word = $1 AND id != $2', [word, req.params.id])
            if (existingWord.rows.length > 0) {
                return res.status(400).json({ error: `Le mot "${word}" existe déjà dans le dictionnaire.` })
            }
        }

        // Récupérer l'existant pour garder les anciens audios si pas de nouveaux
        const existing = await query('SELECT audio_word, audio_example FROM dictionary WHERE id = $1', [req.params.id])

        let audioWordPath = existing.rows.length > 0 ? existing.rows[0].audio_word : null
        let audioExamplePath = existing.rows.length > 0 ? existing.rows[0].audio_example : null

        if (req.files) {
            if (req.files['audio_word'] && req.files['audio_word'][0]) {
                audioWordPath = '/uploads/' + req.files['audio_word'][0].filename
            }
            if (req.files['audio_example'] && req.files['audio_example'][0]) {
                audioExamplePath = '/uploads/' + req.files['audio_example'][0].filename
            }
        }

        const result = await query(
            `UPDATE dictionary 
             SET word = $1, translation_fr = $2, translation_en = $3, translation_ff = $4, 
                 category = $5, domain = $6, example = $7, example_translation = $8, 
                 audio_word = $9, audio_example = $10, updated_at = CURRENT_TIMESTAMP
             WHERE id = $11 RETURNING *`,
            [word, translation_fr, translation_en, translation_ff, category, domain || null, example, example_translation, audioWordPath, audioExamplePath, req.params.id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Mot non trouvé' })
        }

        res.json(result.rows[0])

    } catch (error) {
        console.error('Update word error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// DELETE /api/dictionary/:id - Supprimer un mot (Admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        const result = await query('DELETE FROM dictionary WHERE id = $1 RETURNING id', [req.params.id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Mot non trouvé' })
        }

        res.json({ message: 'Mot supprimé avec succès' })

    } catch (error) {
        console.error('Delete word error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// Configuration multer pour les fichiers PDF
const pdfStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, 'pdf-' + uniqueSuffix + path.extname(file.originalname))
    }
})

const pdfFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true)
    } else {
        cb(new Error('Seuls les fichiers PDF sont acceptés'), false)
    }
}

const uploadPdf = multer({
    storage: pdfStorage,
    fileFilter: pdfFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
})

// POST /api/dictionary/import-pdf - Importer des mots depuis un PDF (Admin only)
router.post('/import-pdf', authMiddleware, adminOnly, uploadPdf.single('pdf'), async (req, res) => {
    let pdfPath = null
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier PDF fourni' })
        }

        pdfPath = req.file.path
        const domain = req.body.domain || null

        // Lire le PDF
        const dataBuffer = fs.readFileSync(pdfPath)
        const pdfData = await pdfParse(dataBuffer)
        const text = pdfData.text

        // Parser les lignes du PDF
        // Format attendu : Numéro | Fulfulde | Français | Anglais
        // Le texte extrait de pdf-parse vient ligne par ligne
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

        const words = []
        const errors = []
        const duplicates = []

        // Détecter les en-têtes pour les ignorer
        const headerPatterns = [
            /^num[ée]ro/i, /^fulfulde/i, /^fran[çc]ais/i, /^anglais/i, /^english/i,
            /^n[°o°]?\s/i, /^#/
        ]

        for (const line of lines) {
            // Ignorer les en-têtes
            if (headerPatterns.some(p => p.test(line))) continue

            // Essayer de parser la ligne
            // Stratégie 1: Nombre au début suivi de mots dans les 3 langues
            // Le PDF a le format : "1    koloropalastiwon    chloroplaste    chloroplast"
            const match = line.match(/^\s*(\d+)\s+(.+)/)
            if (!match) continue

            const rest = match[2].trim()

            // Découper le reste en colonnes basé sur des espaces multiples (2+ espaces) ou tabulations
            const parts = rest.split(/\s{2,}|\t+/).map(s => s.trim()).filter(s => s.length > 0)

            if (parts.length >= 2) {
                const wordObj = {
                    word: parts[0],                     // Fulfulde
                    translation_fr: parts[1] || null,   // Français
                    translation_en: parts[2] || null,   // Anglais (optionnel)
                    domain: domain
                }
                words.push(wordObj)
            }
        }

        if (words.length === 0) {
            return res.status(400).json({
                error: 'Aucun mot trouvé dans le PDF. Vérifiez le format : Numéro | Fulfulde | Français | Anglais',
                rawTextPreview: text.substring(0, 1000)
            })
        }

        // Insérer les mots en base
        let inserted = 0
        let skipped = 0

        for (const w of words) {
            try {
                // Vérifier si le mot existe déjà
                const existing = await query('SELECT id FROM dictionary WHERE LOWER(word) = LOWER($1)', [w.word])
                if (existing.rows.length > 0) {
                    duplicates.push(w.word)
                    skipped++
                    continue
                }

                await query(
                    `INSERT INTO dictionary (word, translation_fr, translation_en, domain)
                     VALUES ($1, $2, $3, $4)`,
                    [w.word, w.translation_fr, w.translation_en, w.domain]
                )
                inserted++
            } catch (err) {
                errors.push({ word: w.word, error: err.message })
                skipped++
            }
        }

        // Nettoyer le fichier PDF uploadé
        fs.unlinkSync(pdfPath)
        pdfPath = null

        res.json({
            message: `Import terminé : ${inserted} mots ajoutés, ${skipped} ignorés`,
            inserted,
            skipped,
            total: words.length,
            duplicates: duplicates.length > 0 ? duplicates : undefined,
            errors: errors.length > 0 ? errors : undefined,
            parsedWords: words // Retourner pour vérification
        })

    } catch (error) {
        console.error('PDF import error:', error)
        // Nettoyer le fichier PDF en cas d'erreur
        if (pdfPath) {
            try { fs.unlinkSync(pdfPath) } catch (e) {}
        }
        res.status(500).json({ error: 'Erreur lors de l\'import du PDF: ' + error.message })
    }
})

// POST /api/dictionary/preview-pdf - Prévisualiser le contenu d'un PDF sans importer (Admin only)
router.post('/preview-pdf', authMiddleware, adminOnly, uploadPdf.single('pdf'), async (req, res) => {
    let pdfPath = null
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier PDF fourni' })
        }

        pdfPath = req.file.path

        const dataBuffer = fs.readFileSync(pdfPath)
        const pdfData = await pdfParse(dataBuffer)
        const text = pdfData.text

        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

        const words = []
        const headerPatterns = [
            /^num[ée]ro/i, /^fulfulde/i, /^fran[çc]ais/i, /^anglais/i, /^english/i,
            /^n[°o°]?\s/i, /^#/
        ]

        for (const line of lines) {
            if (headerPatterns.some(p => p.test(line))) continue

            const match = line.match(/^\s*(\d+)\s+(.+)/)
            if (!match) continue

            const rest = match[2].trim()
            const parts = rest.split(/\s{2,}|\t+/).map(s => s.trim()).filter(s => s.length > 0)

            if (parts.length >= 2) {
                words.push({
                    word: parts[0],
                    translation_fr: parts[1] || null,
                    translation_en: parts[2] || null
                })
            }
        }

        // Vérifier les doublons existants
        const existingWords = []
        for (const w of words) {
            const existing = await query('SELECT id FROM dictionary WHERE LOWER(word) = LOWER($1)', [w.word])
            if (existing.rows.length > 0) {
                existingWords.push(w.word)
            }
        }

        // Nettoyer
        fs.unlinkSync(pdfPath)
        pdfPath = null

        res.json({
            words,
            total: words.length,
            duplicates: existingWords,
            newWords: words.length - existingWords.length,
            rawTextPreview: text.substring(0, 500)
        })

    } catch (error) {
        console.error('PDF preview error:', error)
        if (pdfPath) {
            try { fs.unlinkSync(pdfPath) } catch (e) {}
        }
        res.status(500).json({ error: 'Erreur lors de la lecture du PDF: ' + error.message })
    }
})

module.exports = router
