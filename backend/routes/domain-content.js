const express = require('express')
const router = express.Router()
const { query } = require('../database')
const { authMiddleware, canWrite } = require('../middleware/auth')

// Liste blanche des slugs de domaines de terminologie (cf. DomainPage.jsx + TerminologieAdmin.jsx)
const ALLOWED_DOMAINS = new Set([
    'sciences-technologie',
    'sante-medecine',
    'sciences-humaines',
    'education',
    'agriculture-environnement',
    'metiers-artisanat'
])

const ALLOWED_LANGUAGES = new Set(['fr', 'en', 'ff'])

// GET /api/domain-content - Retourner tout le contenu, structuré { domain: { fr, en, ff } }
router.get('/', async (req, res) => {
    try {
        const result = await query('SELECT domain, language, content, updated_at FROM domain_content')
        const out = {}
        for (const row of result.rows) {
            if (!out[row.domain]) out[row.domain] = {}
            out[row.domain][row.language] = row.content
        }
        res.json(out)
    } catch (error) {
        console.error('Get domain-content error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// GET /api/domain-content/:domain - Retourner le contenu d'un domaine, structuré { fr, en, ff }
router.get('/:domain', async (req, res) => {
    try {
        const { domain } = req.params
        if (!ALLOWED_DOMAINS.has(domain)) {
            return res.status(400).json({ error: 'Domaine invalide' })
        }
        const result = await query(
            'SELECT language, content, updated_at FROM domain_content WHERE domain = $1',
            [domain]
        )
        const out = {}
        for (const row of result.rows) {
            out[row.language] = row.content
        }
        res.json(out)
    } catch (error) {
        console.error('Get domain-content/:domain error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// PUT /api/domain-content/:domain/:language - Upsert (admin)
router.put('/:domain/:language', authMiddleware, canWrite, async (req, res) => {
    try {
        const { domain, language } = req.params
        if (!ALLOWED_DOMAINS.has(domain)) {
            return res.status(400).json({ error: 'Domaine invalide' })
        }
        if (!ALLOWED_LANGUAGES.has(language)) {
            return res.status(400).json({ error: 'Langue invalide' })
        }
        const content = req.body && typeof req.body === 'object' ? req.body : {}
        const result = await query(
            `INSERT INTO domain_content (domain, language, content)
             VALUES ($1, $2, $3::jsonb)
             ON CONFLICT (domain, language)
             DO UPDATE SET content = $3::jsonb, updated_at = CURRENT_TIMESTAMP
             RETURNING domain, language, content, updated_at`,
            [domain, language, JSON.stringify(content)]
        )
        res.json(result.rows[0])
    } catch (error) {
        console.error('Put domain-content error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

// DELETE /api/domain-content/:domain/:language - Réinitialiser (admin)
router.delete('/:domain/:language', authMiddleware, canWrite, async (req, res) => {
    try {
        const { domain, language } = req.params
        if (!ALLOWED_DOMAINS.has(domain)) {
            return res.status(400).json({ error: 'Domaine invalide' })
        }
        if (!ALLOWED_LANGUAGES.has(language)) {
            return res.status(400).json({ error: 'Langue invalide' })
        }
        await query('DELETE FROM domain_content WHERE domain = $1 AND language = $2', [domain, language])
        res.json({ message: 'Contenu réinitialisé', domain, language })
    } catch (error) {
        console.error('Delete domain-content error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

module.exports = router
