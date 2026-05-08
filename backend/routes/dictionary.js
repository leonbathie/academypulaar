const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { query } = require('../database')
const { authMiddleware, canWrite, requireRole, validateId } = require('../middleware/auth')
const crypto = require('crypto')
const { isSuperAdmin } = require('../config/super-admins')

function hashIP(ip) {
    const salt = process.env.IP_HASH_SALT || 'goomufulo-salt'
    return crypto.createHash('sha256').update(ip + salt).digest('hex').substring(0, 16)
}

function normalizeFulfuldeText(value) {
    if (value === null || value === undefined) {
        return null
    }

    return String(value).normalize('NFC').trim()
}

// Cle de comparaison robuste pour caracteres Fulfulde (ɓ ɗ ŋ ɲ ʼ etc.)
// Normalise en NFC, met en minuscules, collapse les espaces multiples
// et trim. Cette cle correspond a la colonne dictionary.word_normalized
// (qui est generee cote SQL avec la meme logique).
function fulfuldeCompareKey(value) {
    if (value === null || value === undefined) return ''
    return String(value)
        .normalize('NFC')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase()
}

// Trouve un mot existant par sa cle normalisee (independamment des domaines).
// Retourne {id, word} ou null.
async function findExistingByWord({ word, excludeId = null }) {
    const key = fulfuldeCompareKey(word)
    if (!key) return null

    const sql = excludeId
        ? 'SELECT id, word, word_normalized FROM dictionary WHERE word_normalized = $1 AND id != $2 LIMIT 1'
        : 'SELECT id, word, word_normalized FROM dictionary WHERE word_normalized = $1 LIMIT 1'
    const params = excludeId ? [key, excludeId] : [key]
    const r = await query(sql, params)
    if (r.rows.length > 0) return r.rows[0]

    // Fallback : si word_normalized est NULL pour anciennes lignes, comparer en JS
    const fallback = excludeId
        ? 'SELECT id, word, word_normalized FROM dictionary WHERE id != $1 AND (word_normalized IS NULL OR word_normalized = \'\')'
        : 'SELECT id, word, word_normalized FROM dictionary WHERE word_normalized IS NULL OR word_normalized = \'\''
    const fallbackParams = excludeId ? [excludeId] : []
    const candidates = await query(fallback, fallbackParams)
    return candidates.rows.find(row => fulfuldeCompareKey(row.word) === key) || null
}

// Synchronise les domaines d'un mot dans la table pivot.
// mode='replace' : remplace toute la liste (utilise par PUT)
// mode='merge'   : ajoute ce qui manque, ne supprime rien (utilise par POST)
async function syncWordDomains(dictionaryId, domainList, mode = 'replace') {
    if (!Array.isArray(domainList)) return
    const cleaned = Array.from(new Set(
        domainList
            .map(d => normalizeFulfuldeText(d))
            .filter(d => d && d.length > 0)
    ))

    if (mode === 'replace') {
        // Supprime les domaines absents, garde les autres (idempotent)
        if (cleaned.length === 0) {
            await query('DELETE FROM dictionary_domains WHERE dictionary_id = $1', [dictionaryId])
        } else {
            await query(
                'DELETE FROM dictionary_domains WHERE dictionary_id = $1 AND NOT (domain = ANY($2::text[]))',
                [dictionaryId, cleaned]
            )
        }
    }

    // Insere les nouveaux (ON CONFLICT DO NOTHING grace a UNIQUE(dictionary_id, domain))
    for (const d of cleaned) {
        await query(
            `INSERT INTO dictionary_domains (dictionary_id, domain) VALUES ($1, $2)
             ON CONFLICT (dictionary_id, domain) DO NOTHING`,
            [dictionaryId, d]
        )
    }
}

// Charge les domaines associes a un id (utilise dans les reponses)
async function loadDomainsFor(dictionaryId) {
    const r = await query(
        'SELECT domain FROM dictionary_domains WHERE dictionary_id = $1 ORDER BY domain',
        [dictionaryId]
    )
    return r.rows.map(row => row.domain)
}

// Charge les domaines pour une liste d'ids en une seule requete.
// Retourne une Map<id, string[]>.
async function loadDomainsForMany(ids) {
    const result = new Map()
    if (!Array.isArray(ids) || ids.length === 0) return result
    const r = await query(
        'SELECT dictionary_id, domain FROM dictionary_domains WHERE dictionary_id = ANY($1::int[]) ORDER BY domain',
        [ids]
    )
    for (const row of r.rows) {
        if (!result.has(row.dictionary_id)) result.set(row.dictionary_id, [])
        result.get(row.dictionary_id).push(row.domain)
    }
    return result
}

// Resout l'argument "domains" venant du client : accepte
// - un tableau JS (JSON body)
// - une chaine "a,b,c"
// - une chaine JSON "[\"a\", \"b\"]"
// - un seul nom de domaine (compat champ unique)
function parseDomainsField(value) {
    if (Array.isArray(value)) return value
    if (typeof value !== 'string') return []
    const trimmed = value.trim()
    if (!trimmed) return []
    if (trimmed.startsWith('[')) {
        try { const a = JSON.parse(trimmed); return Array.isArray(a) ? a : [] } catch (_) { /* fall through */ }
    }
    if (trimmed.includes(',')) return trimmed.split(',').map(s => s.trim()).filter(Boolean)
    return [trimmed]
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

// GET /api/dictionary - Recuperer tous les mots avec leurs domaines (agreges)
router.get('/', async (req, res) => {
    try {
        const { search, category, letter, domain } = req.query
        const params = []
        const conditions = []

        if (search) {
            const normalizedSearch = normalizeFulfuldeText(search)
            conditions.push(`(d.word ILIKE $${params.length + 1} OR d.translation_fr ILIKE $${params.length + 1})`)
            params.push(`%${normalizedSearch}%`)
        }

        if (category) {
            conditions.push(`d.category = $${params.length + 1}`)
            params.push(category)
        }

        if (letter) {
            const normalizedLetter = normalizeFulfuldeText(letter)
            conditions.push(`d.word ILIKE $${params.length + 1}`)
            params.push(`${normalizedLetter}%`)
        }

        // Filtrage par domaine : matche soit la colonne legacy d.domain, soit la pivot
        if (domain) {
            const idx = params.length + 1
            conditions.push(`(
                d.domain = $${idx}
                OR EXISTS (
                    SELECT 1 FROM dictionary_domains dd2
                    WHERE dd2.dictionary_id = d.id AND dd2.domain = $${idx}
                )
            )`)
            params.push(domain)
        }

        const where = conditions.length > 0 ? ('WHERE ' + conditions.join(' AND ')) : ''
        const sql = `
            SELECT
                d.*,
                COALESCE(
                    (SELECT JSON_AGG(dd.domain ORDER BY dd.domain)
                     FROM dictionary_domains dd WHERE dd.dictionary_id = d.id),
                    '[]'::json
                ) AS domains
            FROM dictionary d
            ${where}
            ORDER BY d.word ASC
        `

        const result = await query(sql, params)
        // Si une ligne n'a aucune entree pivot mais une valeur legacy, on la propose
        // pour compat backwards (une seule fois)
        const rows = result.rows.map(r => {
            const domains = Array.isArray(r.domains) ? r.domains : []
            if (domains.length === 0 && r.domain) {
                return { ...r, domains: [r.domain] }
            }
            return { ...r, domains }
        })
        res.json(rows)

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
            SELECT dr.id, dr.word_id, dr.status, dr.created_at, dr.resolved_at, dr.requested_by,
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

// GET /api/dictionary/:id - Recuperer un mot avec ses domaines
router.get('/:id', validateId, async (req, res) => {
    try {
        const result = await query('SELECT * FROM dictionary WHERE id = $1', [req.params.id])

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Mot non trouvé' })
        }

        const row = result.rows[0]
        const domains = await loadDomainsFor(row.id)
        if (domains.length === 0 && row.domain) domains.push(row.domain)
        res.json({ ...row, domains })

    } catch (error) {
        console.error('Get word error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// POST /api/dictionary - Ajouter (ou enrichir) un mot avec ses domaines.
// Logique multi-domaines :
//  1. Normaliser le mot.
//  2. Chercher s'il existe deja (par word_normalized).
//  3. S'il existe : ajouter les domaines manquants dans la pivot, ne PAS
//     bloquer. Retourner l'entree existante avec sa liste complete de domaines.
//  4. Sinon : creer la ligne et inserer les domaines dans la pivot.
router.post('/', authMiddleware, canWrite, upload.fields([
    { name: 'audio_word', maxCount: 1 },
    { name: 'audio_example', maxCount: 1 }
]), async (req, res) => {
    try {
        const { word, translation_fr, translation_en, translation_ff, category, domain, example, example_translation } = req.body
        const normalizedWord = normalizeFulfuldeText(word)
        const normalizedTranslationFr = normalizeFulfuldeText(translation_fr)
        const normalizedTranslationEn = normalizeFulfuldeText(translation_en)
        const normalizedTranslationFf = normalizeFulfuldeText(translation_ff)
        const normalizedCategory = normalizeFulfuldeText(category)
        const normalizedExample = normalizeFulfuldeText(example)
        const normalizedExampleTranslation = normalizeFulfuldeText(example_translation)
        const wordKey = fulfuldeCompareKey(normalizedWord)

        if (!normalizedWord) {
            return res.status(400).json({ error: 'Le mot est requis' })
        }

        // Liste des domaines : accepte 'domains' (array/JSON/csv) OU 'domain' (single)
        const domainsRaw = req.body.domains !== undefined ? parseDomainsField(req.body.domains) : []
        if (domain && (!domainsRaw || domainsRaw.length === 0)) {
            domainsRaw.push(domain)
        }
        const domainsList = Array.from(new Set(
            domainsRaw.map(d => normalizeFulfuldeText(d)).filter(Boolean)
        ))
        const primaryDomain = domainsList[0] || null

        // Recuperer les chemins audio si uploades
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

        // Cherche un mot existant (par word_normalized)
        const existing = await findExistingByWord({ word: normalizedWord })

        if (existing) {
            // Mot deja present : on ajoute les domaines manquants et on retourne l'entree.
            await syncWordDomains(existing.id, domainsList, 'merge')

            // Optionnel : completer translations / audios manquants si fournis
            const updates = []
            const params = []
            const setIfMissing = (col, val) => {
                if (val === null || val === undefined) return
                updates.push(`${col} = COALESCE(NULLIF(${col}, ''), $${params.length + 1})`)
                params.push(val)
            }
            setIfMissing('translation_fr', normalizedTranslationFr)
            setIfMissing('translation_en', normalizedTranslationEn)
            setIfMissing('translation_ff', normalizedTranslationFf)
            setIfMissing('category', normalizedCategory)
            setIfMissing('example', normalizedExample)
            setIfMissing('example_translation', normalizedExampleTranslation)
            if (audioWordPath) {
                updates.push(`audio_word = COALESCE(audio_word, $${params.length + 1})`)
                params.push(audioWordPath)
            }
            if (audioExamplePath) {
                updates.push(`audio_example = COALESCE(audio_example, $${params.length + 1})`)
                params.push(audioExamplePath)
            }

            let row
            if (updates.length > 0) {
                params.push(existing.id)
                const r = await query(
                    `UPDATE dictionary SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                     WHERE id = $${params.length} RETURNING *`,
                    params
                )
                row = r.rows[0]
            } else {
                const r = await query('SELECT * FROM dictionary WHERE id = $1', [existing.id])
                row = r.rows[0]
            }

            const domains = await loadDomainsFor(row.id)
            return res.status(200).json({
                ...row,
                domains,
                merged: true,
                message: `Le mot existait deja (id ${row.id}). Domaines mis a jour.`
            })
        }

        // Mot vraiment nouveau : INSERT puis sync pivot
        const inserted = await query(
            `INSERT INTO dictionary
                (word, word_normalized, translation_fr, translation_en, translation_ff,
                 category, domain, example, example_translation, audio_word, audio_example)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [
                normalizedWord, wordKey,
                normalizedTranslationFr, normalizedTranslationEn, normalizedTranslationFf,
                normalizedCategory, primaryDomain,
                normalizedExample, normalizedExampleTranslation,
                audioWordPath, audioExamplePath
            ]
        )
        const newRow = inserted.rows[0]
        await syncWordDomains(newRow.id, domainsList, 'merge')
        const domains = await loadDomainsFor(newRow.id)

        res.status(201).json({ ...newRow, domains })

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
        const normalizedWord = normalizeFulfuldeText(word)
        const normalizedTranslationFr = normalizeFulfuldeText(translation_fr)
        const normalizedTranslationEn = normalizeFulfuldeText(translation_en)
        const normalizedTranslationFf = normalizeFulfuldeText(translation_ff)
        const normalizedCategory = normalizeFulfuldeText(category)
        const normalizedDomain = normalizeFulfuldeText(domain)
        const normalizedExample = normalizeFulfuldeText(example)
        const normalizedExampleTranslation = normalizeFulfuldeText(example_translation)

        // Recuperer l'existant : pour les audios + comparaison du mot.
        const existing = await query(
            'SELECT word, word_normalized, domain, audio_word, audio_example FROM dictionary WHERE id = $1',
            [req.params.id]
        )
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Mot non trouvé' })
        }
        const currentRow = existing.rows[0]

        // Comparaison sur la cle normalisee
        const wordChanged = fulfuldeCompareKey(normalizedWord) !== fulfuldeCompareKey(currentRow.word)

        // Si le mot change, verifier qu'aucune AUTRE ligne n'a deja ce word_normalized
        if (normalizedWord && wordChanged) {
            const collision = await findExistingByWord({ word: normalizedWord, excludeId: req.params.id })
            if (collision) {
                return res.status(409).json({
                    error: `Le mot "${normalizedWord}" existe deja sous l'id ${collision.id}. Fusionnez ou utilisez un autre mot.`,
                    code: 'DUPLICATE_WORD',
                    duplicate: collision
                })
            }
        }

        let audioWordPath = currentRow.audio_word
        let audioExamplePath = currentRow.audio_example
        const oldAudioWord = audioWordPath
        const oldAudioExample = audioExamplePath

        const removeAudioWord = req.body.remove_audio_word === '1' || req.body.remove_audio_word === 'true'
        const removeAudioExample = req.body.remove_audio_example === '1' || req.body.remove_audio_example === 'true'

        if (req.files) {
            if (req.files['audio_word'] && req.files['audio_word'][0]) {
                audioWordPath = '/uploads/' + req.files['audio_word'][0].filename
            }
            if (req.files['audio_example'] && req.files['audio_example'][0]) {
                audioExamplePath = '/uploads/' + req.files['audio_example'][0].filename
            }
        }

        if (removeAudioWord && !(req.files && req.files['audio_word'] && req.files['audio_word'][0])) {
            audioWordPath = null
        }
        if (removeAudioExample && !(req.files && req.files['audio_example'] && req.files['audio_example'][0])) {
            audioExamplePath = null
        }

        // Liste des domaines : array (nouveau) OU single 'domain' (legacy)
        const domainsRaw = req.body.domains !== undefined ? parseDomainsField(req.body.domains) : null
        const legacySingle = normalizedDomain
        let domainsList = null
        if (domainsRaw !== null) {
            domainsList = Array.from(new Set(
                domainsRaw.map(d => normalizeFulfuldeText(d)).filter(Boolean)
            ))
        } else if (legacySingle) {
            // L'admin n'a envoye que 'domain' : on AJOUTE ce domaine sans toucher
            // aux autres deja associes (mode merge).
            domainsList = [legacySingle]
        }
        const primaryDomain = (domainsList && domainsList[0]) || legacySingle || null
        const newWordKey = fulfuldeCompareKey(normalizedWord)

        const result = await query(
            `UPDATE dictionary
             SET word = $1, word_normalized = $2,
                 translation_fr = $3, translation_en = $4, translation_ff = $5,
                 category = $6, domain = $7, example = $8, example_translation = $9,
                 audio_word = $10, audio_example = $11,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $12 RETURNING *`,
            [
                normalizedWord || null,
                newWordKey || null,
                normalizedTranslationFr, normalizedTranslationEn, normalizedTranslationFf,
                normalizedCategory, primaryDomain,
                normalizedExample, normalizedExampleTranslation,
                audioWordPath, audioExamplePath,
                req.params.id
            ]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Mot non trouvé' })
        }

        // Sync des domaines :
        // - 'domains' fourni (array) -> mode REPLACE (etat exact souhaite)
        // - sinon, single 'domain' fourni -> mode MERGE (ajoute sans retirer)
        if (Array.isArray(domainsRaw)) {
            await syncWordDomains(req.params.id, domainsList || [], 'replace')
        } else if (legacySingle) {
            await syncWordDomains(req.params.id, [legacySingle], 'merge')
        }

        // Supprimer les anciens fichiers audio si remplaces ou retires
        if ((req.files?.['audio_word'] || removeAudioWord) && oldAudioWord) {
            const oldPath = path.join(__dirname, '..', oldAudioWord)
            if (fs.existsSync(oldPath)) fs.unlink(oldPath, () => {})
        }
        if ((req.files?.['audio_example'] || removeAudioExample) && oldAudioExample) {
            const oldPath = path.join(__dirname, '..', oldAudioExample)
            if (fs.existsSync(oldPath)) fs.unlink(oldPath, () => {})
        }

        const finalDomains = await loadDomainsFor(req.params.id)
        res.json({ ...result.rows[0], domains: finalDomains })

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
// ENDPOINTS BULK : traiter plusieurs demandes en une seule requête
// (évite de saturer le rate limiter pour les opérations de masse)
// ============================================================

// POST /api/dictionary/delete-requests/bulk-approve
router.post('/delete-requests/bulk-approve', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const email = await getUserEmail(req.user.id)
        if (!isSuperAdmin(email)) {
            return res.status(403).json({ error: 'Seuls les super-administrateurs peuvent approuver' })
        }

        const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(Number.isInteger) : []
        if (ids.length === 0) return res.status(400).json({ error: 'Aucun identifiant' })

        // Récupérer toutes les demandes pending sauf celles faites par l'utilisateur courant
        const { rows: requests } = await query(
            `SELECT id, word_id, requested_by FROM dictionary_delete_requests
             WHERE id = ANY($1::int[]) AND status = 'pending'`,
            [ids]
        )

        let approved = 0
        let skippedSelf = 0
        let wordsDeleted = 0

        for (const r of requests) {
            if (r.requested_by === req.user.id) { skippedSelf++; continue }

            const deleted = await query('DELETE FROM dictionary WHERE id = $1 RETURNING audio_word, audio_example', [r.word_id])
            if (deleted.rows.length > 0) {
                wordsDeleted++
                const w = deleted.rows[0]
                if (w.audio_word) {
                    const p = path.join(__dirname, '..', w.audio_word)
                    if (fs.existsSync(p)) fs.unlink(p, () => {})
                }
                if (w.audio_example) {
                    const p = path.join(__dirname, '..', w.audio_example)
                    if (fs.existsSync(p)) fs.unlink(p, () => {})
                }
            }
            await query(
                "UPDATE dictionary_delete_requests SET status = 'approved', approved_by = $1, resolved_at = CURRENT_TIMESTAMP WHERE id = $2",
                [req.user.id, r.id]
            )
            approved++
        }

        res.json({ approved, wordsDeleted, skippedSelf, totalRequested: ids.length })
    } catch (error) {
        console.error('Bulk approve error:', error)
        res.status(500).json({ error: 'Erreur serveur: ' + error.message })
    }
})

// POST /api/dictionary/delete-requests/bulk-reject
router.post('/delete-requests/bulk-reject', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const email = await getUserEmail(req.user.id)
        if (!isSuperAdmin(email)) {
            return res.status(403).json({ error: 'Seuls les super-administrateurs peuvent rejeter' })
        }
        const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(Number.isInteger) : []
        if (ids.length === 0) return res.status(400).json({ error: 'Aucun identifiant' })

        const result = await query(
            `UPDATE dictionary_delete_requests
             SET status = 'rejected', approved_by = $1, resolved_at = CURRENT_TIMESTAMP
             WHERE id = ANY($2::int[]) AND status = 'pending'
             RETURNING id`,
            [req.user.id, ids]
        )
        res.json({ rejected: result.rows.length, totalRequested: ids.length })
    } catch (error) {
        console.error('Bulk reject error:', error)
        res.status(500).json({ error: 'Erreur serveur: ' + error.message })
    }
})

// POST /api/dictionary/delete-requests/bulk-cancel - annule uniquement ses propres demandes
router.post('/delete-requests/bulk-cancel', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(Number.isInteger) : []
        if (ids.length === 0) return res.status(400).json({ error: 'Aucun identifiant' })

        const result = await query(
            `UPDATE dictionary_delete_requests
             SET status = 'cancelled', resolved_at = CURRENT_TIMESTAMP
             WHERE id = ANY($1::int[]) AND status = 'pending' AND requested_by = $2
             RETURNING id`,
            [ids, req.user.id]
        )
        res.json({ cancelled: result.rows.length, totalRequested: ids.length })
    } catch (error) {
        console.error('Bulk cancel error:', error)
        res.status(500).json({ error: 'Erreur serveur: ' + error.message })
    }
})

// ============================================================
// TRACKING : recherches et mots consultés
// ============================================================

// POST /api/dictionary/track-search - Enregistrer une recherche (public)
router.post('/track-search', async (req, res) => {
    try {
        const { term, resultsCount } = req.body
        const normalizedTerm = normalizeFulfuldeText(term)
        if (!normalizedTerm || normalizedTerm.length < 1 || normalizedTerm.length > 255) {
            return res.json({ tracked: false })
        }

        const ip = req.ip || req.socket?.remoteAddress || 'unknown'
        const ipHash = hashIP(ip)

        // Anti-doublon : même terme + même IP dans les 5 dernières minutes
        const recent = await query(
            "SELECT id FROM dictionary_searches WHERE LOWER(term) = LOWER($1) AND ip_hash = $2 AND created_at > NOW() - INTERVAL '5 minutes'",
            [normalizedTerm, ipHash]
        )
        if (recent.rows.length > 0) {
            return res.json({ tracked: false })
        }

        await query(
            'INSERT INTO dictionary_searches (term, results_count, ip_hash) VALUES ($1, $2, $3)',
            [normalizedTerm, resultsCount || 0, ipHash]
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

// Configuration multer pour les fichiers CSV
const csvStorage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/') },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, 'csv-' + uniqueSuffix + '.csv')
    }
})

const csvFilter = (req, file, cb) => {
    const ok = file.mimetype === 'text/csv' ||
               file.mimetype === 'application/csv' ||
               file.mimetype === 'text/plain' ||
               file.mimetype === 'application/octet-stream' ||
               file.originalname.toLowerCase().endsWith('.csv')
    ok ? cb(null, true) : cb(new Error('Seuls les fichiers CSV sont acceptés.'), false)
}

const uploadCsv = multer({ storage: csvStorage, fileFilter: csvFilter, limits: { fileSize: 10 * 1024 * 1024 } })

// POST /api/dictionary/import-pdf - Importer des mots depuis un PDF (Admin only)
// Fonction utilitaire : parser un CSV (séparateur ; ou ,)
// Supporte 3 colonnes (Fulfulde;FR;EN) ou 4 colonnes (Numéro;Fulfulde;FR;EN)
function parseCsvWords(content) {
    const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    const words = []
    for (const line of lines) {
        // Ignorer les lignes d'en-tête
        if (/fulfulde|num[eé]ro|fran[çc]ais|anglais/i.test(line)) continue
        const sep = line.includes(';') ? ';' : ','
        let cols = line.split(sep).map(c => c.trim().replace(/^['"]|['"]$/g, '').normalize('NFC'))
        // Si la première colonne est un numéro d'ordre, on la saute
        if (cols.length >= 4 && /^\d+$/.test(cols[0])) {
            cols = cols.slice(1)
        }
        if (!cols[0]) continue
        words.push({
            word:           cols[0] || null,
            translation_fr: cols[1] || null,
            translation_en: cols[2] || null
        })
    }
    return words
}

// POST /api/dictionary/import-csv
router.post('/import-csv', authMiddleware, canWrite, uploadCsv.fields([{ name: 'csv', maxCount: 1 }]), async (req, res) => {
    let filePath = null
    try {
        if (!req.files || !req.files.csv || !req.files.csv[0]) return res.status(400).json({ error: 'Aucun fichier CSV fourni' })
        const csvFile = req.files.csv[0]
        filePath = csvFile.path
        const domain = normalizeFulfuldeText(req.body.domain) || null
        const content = fs.readFileSync(filePath, 'utf8')
        const words = parseCsvWords(content)
        fs.unlinkSync(filePath); filePath = null

        if (words.length === 0) {
            return res.status(400).json({ error: 'Aucun mot trouvé. Format attendu : Fulfulde;Français;Anglais' })
        }

        words.forEach(w => w.domain = domain)

        let inserted = 0, skipped = 0
        const duplicates = [], errors = []

        for (const w of words) {
            try {
                const normalizedWord = normalizeFulfuldeText(w.word)
                if (!normalizedWord) { skipped++; continue }
                const wordKey = fulfuldeCompareKey(normalizedWord)
                const existing = await findExistingByWord({ word: normalizedWord })
                if (existing) {
                    // Mot deja present : on ajoute juste le domaine au pivot et on saute.
                    if (domain) await syncWordDomains(existing.id, [domain], 'merge')
                    duplicates.push(w.word)
                    skipped++
                    continue
                }
                const ins = await query(
                    `INSERT INTO dictionary (word, word_normalized, translation_fr, translation_en, domain)
                     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
                    [normalizedWord, wordKey, normalizeFulfuldeText(w.translation_fr), normalizeFulfuldeText(w.translation_en), domain]
                )
                if (domain) await syncWordDomains(ins.rows[0].id, [domain], 'merge')
                inserted++
            } catch (err) { errors.push({ word: w.word, error: err.message }); skipped++ }
        }

        res.json({
            message: `Import terminé : ${inserted} mots ajoutés, ${skipped} ignorés`,
            inserted, skipped, total: words.length,
            duplicates: duplicates.length > 0 ? duplicates : undefined,
            errors: errors.length > 0 ? errors : undefined
        })
    } catch (error) {
        if (filePath) try { fs.unlinkSync(filePath) } catch (e) {}
        res.status(500).json({ error: 'Erreur import CSV: ' + error.message })
    }
})

// POST /api/dictionary/preview-csv
router.post('/preview-csv', authMiddleware, canWrite, uploadCsv.fields([{ name: 'csv', maxCount: 1 }]), async (req, res) => {
    let filePath = null
    try {
        if (!req.files || !req.files.csv || !req.files.csv[0]) {
            if (filePath) try { fs.unlinkSync(filePath) } catch (e) {}
            return res.status(400).json({ error: 'Aucun fichier CSV fourni' })
        }
        const csvFile = req.files.csv[0]
        filePath = csvFile.path
        const content = fs.readFileSync(filePath, 'utf8')
        const domain = req.body.domain ? normalizeFulfuldeText(req.body.domain) : null
        const words = parseCsvWords(content)
        words.forEach(w => w.domain = domain)
        fs.unlinkSync(filePath)
        filePath = null

        const existingWords = []
        for (const w of words) {
            const normalizedWord = normalizeFulfuldeText(w.word)
            const dup = await findExistingByWord({ word: normalizedWord })
            if (dup) existingWords.push(w.word)
        }

        res.json({ words, total: words.length, duplicates: existingWords, newWords: words.length - existingWords.length })
    } catch (error) {
        if (filePath) try { fs.unlinkSync(filePath) } catch (e) {}
        console.error('Preview CSV error:', error)
        res.status(500).json({ error: 'Erreur preview CSV: ' + error.message })
    }
})

module.exports = router
