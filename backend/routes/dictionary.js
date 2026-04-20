const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const pdfParse = require('pdf-parse')
const { query } = require('../database')
const { authMiddleware, canWrite, requireRole, validateId } = require('../middleware/auth')
const crypto = require('crypto')
const { isSuperAdmin } = require('../config/super-admins')

function hashIP(ip) {
    const salt = process.env.IP_HASH_SALT || 'goomufulo-salt'
    return crypto.createHash('sha256').update(ip + salt).digest('hex').substring(0, 16)
}

// Configuration multer pour les fichiers audio
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '')
        cb(null, 'audio-' + uniqueSuffix + ext)
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

// GET /api/dictionary/search-stats - Stats des recherches (super-admin only)
router.get('/search-stats', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const email = await getUserEmail(req.user.id)
        if (!isSuperAdmin(email)) {
            return res.status(403).json({ error: 'Accès réservé aux super-administrateurs' })
        }

        const [topSearches, recentSearches, topWords, totalSearches, notFoundSearches] = await Promise.all([
            // Top 15 termes les plus recherchés (30 derniers jours)
            query(`
                SELECT LOWER(term) as term, COUNT(*) as count
                FROM dictionary_searches
                WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY LOWER(term)
                ORDER BY count DESC
                LIMIT 15
            `),
            // 20 dernières recherches
            query(`
                SELECT term, results_count, created_at
                FROM dictionary_searches
                ORDER BY created_at DESC
                LIMIT 20
            `),
            // Top 15 mots les plus consultés
            query(`
                SELECT id, word, translation_fr, domain, COALESCE(view_count, 0) as view_count
                FROM dictionary
                WHERE COALESCE(view_count, 0) > 0
                ORDER BY view_count DESC
                LIMIT 15
            `),
            // Total recherches
            query('SELECT COUNT(*) as count FROM dictionary_searches'),
            // Top 15 termes recherchés sans résultats (30 derniers jours)
            query(`
                SELECT LOWER(term) as term, COUNT(*) as count
                FROM dictionary_searches
                WHERE results_count = 0
                AND created_at >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY LOWER(term)
                ORDER BY count DESC
                LIMIT 15
            `)
        ])

        res.json({
            topSearches: topSearches.rows,
            recentSearches: recentSearches.rows,
            topWords: topWords.rows,
            totalSearches: parseInt(totalSearches.rows[0].count),
            notFoundSearches: notFoundSearches.rows
        })
    } catch (error) {
        console.error('Search stats error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// GET /api/dictionary/delete-requests - Lister les demandes de suppression (admin + super-admin)
router.get('/delete-requests', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const result = await query(`
            SELECT dr.id, dr.word_id, dr.status, dr.created_at, dr.resolved_at,
                   d.word, d.translation_fr, d.translation_en, d.domain,
                   u1.username AS requested_by_name, u1.email AS requested_by_email,
                   u2.username AS approved_by_name
            FROM dictionary_delete_requests dr
            JOIN dictionary d ON dr.word_id = d.id
            JOIN users u1 ON dr.requested_by = u1.id
            LEFT JOIN users u2 ON dr.approved_by = u2.id
            ORDER BY dr.status = 'pending' DESC, dr.created_at DESC
        `)

        res.json(result.rows)

    } catch (error) {
        console.error('Get delete requests error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// GET /api/dictionary/:id - Récupérer un mot
router.get('/:id', validateId, async (req, res) => {
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
router.post('/', authMiddleware, canWrite, upload.fields([
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
router.put('/:id', authMiddleware, canWrite, validateId, upload.fields([
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
        const oldAudioWord = audioWordPath
        const oldAudioExample = audioExamplePath

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

        // Supprimer les anciens fichiers audio si remplacés
        if (req.files?.['audio_word'] && oldAudioWord) {
            const oldPath = path.join(__dirname, '..', oldAudioWord)
            if (fs.existsSync(oldPath)) fs.unlink(oldPath, () => {})
        }
        if (req.files?.['audio_example'] && oldAudioExample) {
            const oldPath = path.join(__dirname, '..', oldAudioExample)
            if (fs.existsSync(oldPath)) fs.unlink(oldPath, () => {})
        }

        res.json(result.rows[0])

    } catch (error) {
        console.error('Update word error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// ============================================================
// SYSTÈME DE DOUBLE VALIDATION SUPER-ADMIN POUR SUPPRESSIONS
// Un super-admin demande la suppression, un 2e super-admin approuve
// ============================================================

// Helper: récupérer l'email de l'utilisateur depuis la DB
async function getUserEmail(userId) {
    const result = await query('SELECT email FROM users WHERE id = $1', [userId])
    return result.rows[0]?.email || null
}

// POST /api/dictionary/delete-request - Demander la suppression d'un mot (admin + super-admin)
router.post('/delete-request', authMiddleware, requireRole('admin'), async (req, res) => {
    try {

        const { wordIds } = req.body
        if (!wordIds || !Array.isArray(wordIds) || wordIds.length === 0) {
            return res.status(400).json({ error: 'Aucun mot sélectionné' })
        }

        // Valider que les IDs sont des entiers
        const validIds = wordIds.filter(id => Number.isInteger(id) && id > 0)
        if (validIds.length === 0) {
            return res.status(400).json({ error: 'IDs invalides' })
        }

        let created = 0
        let alreadyPending = 0

        for (const wordId of validIds) {
            // Vérifier que le mot existe
            const wordExists = await query('SELECT id FROM dictionary WHERE id = $1', [wordId])
            if (wordExists.rows.length === 0) continue

            // Vérifier s'il y a déjà une demande en attente pour ce mot
            const existing = await query(
                "SELECT id FROM dictionary_delete_requests WHERE word_id = $1 AND status = 'pending'",
                [wordId]
            )
            if (existing.rows.length > 0) {
                alreadyPending++
                continue
            }

            await query(
                'INSERT INTO dictionary_delete_requests (word_id, requested_by) VALUES ($1, $2)',
                [wordId, req.user.id]
            )
            created++
        }

        res.json({
            message: `${created} demande(s) de suppression créée(s)`,
            created,
            alreadyPending
        })

    } catch (error) {
        console.error('Delete request error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// POST /api/dictionary/delete-request/:id/approve - Approuver une suppression (2e super-admin)
router.post('/delete-request/:id/approve', authMiddleware, requireRole('admin'), validateId, async (req, res) => {
    try {
        const email = await getUserEmail(req.user.id)
        if (!isSuperAdmin(email)) {
            return res.status(403).json({ error: 'Seuls les super-administrateurs peuvent approuver' })
        }

        // Récupérer la demande
        const request = await query(
            "SELECT * FROM dictionary_delete_requests WHERE id = $1 AND status = 'pending'",
            [req.params.id]
        )
        if (request.rows.length === 0) {
            return res.status(404).json({ error: 'Demande non trouvée ou déjà traitée' })
        }

        const deleteRequest = request.rows[0]

        // Vérifier que ce n'est PAS le même super-admin qui a fait la demande
        if (deleteRequest.requested_by === req.user.id) {
            return res.status(403).json({ error: 'Vous ne pouvez pas approuver votre propre demande de suppression. Un autre super-administrateur doit valider.' })
        }

        // Supprimer le mot du dictionnaire
        const deleted = await query('DELETE FROM dictionary WHERE id = $1 RETURNING *', [deleteRequest.word_id])

        if (deleted.rows.length === 0) {
            // Le mot a déjà été supprimé entre-temps
            await query(
                "UPDATE dictionary_delete_requests SET status = 'approved', approved_by = $1, resolved_at = CURRENT_TIMESTAMP WHERE id = $2",
                [req.user.id, req.params.id]
            )
            return res.json({ message: 'Le mot avait déjà été supprimé. Demande marquée comme approuvée.' })
        }

        // Supprimer les fichiers audio associés
        const deletedWord = deleted.rows[0]
        if (deletedWord.audio_word) {
            const audioPath = path.join(__dirname, '..', deletedWord.audio_word)
            if (fs.existsSync(audioPath)) fs.unlink(audioPath, () => {})
        }
        if (deletedWord.audio_example) {
            const audioPath = path.join(__dirname, '..', deletedWord.audio_example)
            if (fs.existsSync(audioPath)) fs.unlink(audioPath, () => {})
        }

        // Marquer la demande comme approuvée
        await query(
            "UPDATE dictionary_delete_requests SET status = 'approved', approved_by = $1, resolved_at = CURRENT_TIMESTAMP WHERE id = $2",
            [req.user.id, req.params.id]
        )

        res.json({
            message: `Mot "${deleted.rows[0].word}" supprimé après double validation`,
            word: deleted.rows[0]
        })

    } catch (error) {
        console.error('Approve delete error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// POST /api/dictionary/delete-request/:id/reject - Rejeter une demande de suppression
router.post('/delete-request/:id/reject', authMiddleware, requireRole('admin'), validateId, async (req, res) => {
    try {
        const email = await getUserEmail(req.user.id)
        if (!isSuperAdmin(email)) {
            return res.status(403).json({ error: 'Seuls les super-administrateurs peuvent rejeter' })
        }

        const result = await query(
            "UPDATE dictionary_delete_requests SET status = 'rejected', approved_by = $1, resolved_at = CURRENT_TIMESTAMP WHERE id = $2 AND status = 'pending' RETURNING *",
            [req.user.id, req.params.id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Demande non trouvée ou déjà traitée' })
        }

        res.json({ message: 'Demande de suppression rejetée' })

    } catch (error) {
        console.error('Reject delete error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// POST /api/dictionary/delete-request/:id/cancel - Annuler sa propre demande
router.post('/delete-request/:id/cancel', authMiddleware, requireRole('admin'), validateId, async (req, res) => {
    try {
        const result = await query(
            "UPDATE dictionary_delete_requests SET status = 'cancelled', resolved_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'pending' AND requested_by = $2 RETURNING *",
            [req.params.id, req.user.id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Demande non trouvée ou vous n\'êtes pas l\'auteur' })
        }

        res.json({ message: 'Demande annulée' })

    } catch (error) {
        console.error('Cancel delete error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// ============================================================
// TRACKING : recherches et mots consultés
// ============================================================

// POST /api/dictionary/track-search - Enregistrer une recherche (public)
router.post('/track-search', async (req, res) => {
    try {
        const { term, resultsCount } = req.body
        if (!term || term.length < 1 || term.length > 255) {
            return res.json({ tracked: false })
        }

        const ip = req.ip || req.socket?.remoteAddress || 'unknown'
        const ipHash = hashIP(ip)

        // Anti-doublon : même terme + même IP dans les 5 dernières minutes
        const recent = await query(
            "SELECT id FROM dictionary_searches WHERE LOWER(term) = LOWER($1) AND ip_hash = $2 AND created_at > NOW() - INTERVAL '5 minutes'",
            [term.trim(), ipHash]
        )
        if (recent.rows.length > 0) {
            return res.json({ tracked: false })
        }

        await query(
            'INSERT INTO dictionary_searches (term, results_count, ip_hash) VALUES ($1, $2, $3)',
            [term.trim(), resultsCount || 0, ipHash]
        )

        res.json({ tracked: true })
    } catch (error) {
        console.error('Track search error:', error)
        res.json({ tracked: false })
    }
})

// POST /api/dictionary/track-view/:id - Incrémenter le compteur de vues d'un mot (public)
router.post('/track-view/:id', validateId, async (req, res) => {
    try {
        const ip = req.ip || req.socket?.remoteAddress || 'unknown'
        const ipHash = hashIP(ip)

        // Anti-abus : même mot + même IP dans les 5 dernières minutes
        const recent = await query(
            "SELECT id FROM dictionary_views WHERE word_id = $1 AND ip_hash = $2 AND created_at > NOW() - INTERVAL '5 minutes'",
            [req.params.id, ipHash]
        )
        if (recent.rows.length > 0) {
            return res.json({ tracked: false })
        }

        await query(
            'UPDATE dictionary SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1',
            [req.params.id]
        )
        // Enregistrer la vue pour anti-abus (table optionnelle, ignorer si n'existe pas)
        await query(
            'INSERT INTO dictionary_views (word_id, ip_hash) VALUES ($1, $2)',
            [req.params.id, ipHash]
        ).catch(() => {})

        res.json({ tracked: true })
    } catch (error) {
        console.error('Track view error:', error)
        res.json({ tracked: false })
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
    const isPdf = file.mimetype === 'application/pdf' ||
                  file.mimetype === 'application/octet-stream' ||
                  file.originalname.toLowerCase().endsWith('.pdf')
    if (isPdf) {
        cb(null, true)
    } else {
        cb(new Error(`Type de fichier non accepté: ${file.mimetype}. Seuls les fichiers PDF sont acceptés.`), false)
    }
}

const uploadPdf = multer({
    storage: pdfStorage,
    fileFilter: pdfFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
})

// POST /api/dictionary/import-pdf - Importer des mots depuis un PDF (Admin only)
router.post('/import-pdf', authMiddleware, canWrite, uploadPdf.single('pdf'), async (req, res) => {
    let pdfPath = null
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier PDF fourni' })
        }

        pdfPath = req.file.path
        const domain = req.body.domain || null

        // Lire et parser le PDF
        const dataBuffer = fs.readFileSync(pdfPath)
        const words = await parsePdfTableWords(dataBuffer)

        if (words.length === 0) {
            return res.status(400).json({
                error: 'Aucun mot trouvé dans le PDF. Vérifiez le format : Numéro | Fulfulde | Français | Anglais'
            })
        }

        // Assigner le domaine
        words.forEach(w => w.domain = domain)

        // Insérer les mots en base
        let inserted = 0
        let skipped = 0
        const errors = []
        const duplicates = []

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
router.post('/preview-pdf', authMiddleware, canWrite, uploadPdf.single('pdf'), async (req, res) => {
    let pdfPath = null
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier PDF fourni' })
        }

        pdfPath = req.file.path

        // Lire et parser le PDF
        const dataBuffer = fs.readFileSync(pdfPath)
        const words = await parsePdfTableWords(dataBuffer)

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
            newWords: words.length - existingWords.length
        })

    } catch (error) {
        console.error('PDF preview error:', error)
        if (pdfPath) {
            try { fs.unlinkSync(pdfPath) } catch (e) {}
        }
        res.status(500).json({ error: 'Erreur lors de la lecture du PDF: ' + error.message })
    }
})

/**
 * Parse a PDF table with columns: Numéro | Fulfulde | Français | Anglais
 * Handles two layouts produced by pdf-parse:
 *   - Single line:  "1   Huubi / timmitudum   Absolu   Absolute"
 *   - Multi-line:   "1\nHuubi / timmitudum\nAbsolu\nAbsolute"
 */
async function parsePdfTableWords(dataBuffer) {
    const data = await pdfParse(dataBuffer)
    const lines = data.text.split('\n').map(l => l.trim()).filter(Boolean)

    const HEADER = /num[eé]ro|fulfulde|fran[çc]ais|anglais|english/i

    // Group lines into numbered entries
    const entries = []   // [{ num, parts: [fulfulde, fr, en] }]
    let current = null

    for (const line of lines) {
        if (HEADER.test(line)) continue

        const numMatch = line.match(/^(\d+)\s*(.*)/)
        if (numMatch) {
            if (current) entries.push(current)
            current = { num: parseInt(numMatch[1]), parts: [] }
            const rest = numMatch[2].trim()
            if (rest) current.parts.push(rest)
        } else if (current) {
            current.parts.push(line)
        }
    }
    if (current) entries.push(current)

    return entries
        .map(e => {
            // Strategy A: single part with 2+ spaces as column separators
            if (e.parts.length === 1) {
                const cols = e.parts[0].split(/\s{2,}/).map(c => c.trim()).filter(Boolean)
                if (cols.length >= 2) {
                    return { word: cols[0], translation_fr: cols[1] || null, translation_en: cols[2] || null }
                }
                return { word: e.parts[0], translation_fr: null, translation_en: null }
            }
            // Strategy B: one part per column (multi-line layout)
            return {
                word: e.parts[0] || null,
                translation_fr: e.parts[1] || null,
                translation_en: e.parts[2] || null
            }
        })
        .filter(w => w.word && w.word.length > 0)
}

module.exports = router
