const express = require('express')
const crypto = require('crypto')
const router = express.Router()
const { query } = require('../database')
const { authMiddleware, requireRole } = require('../middleware/auth')
const { isSuperAdmin } = require('../config/super-admins')

// Hash l'IP pour anonymiser (RGPD)
function hashIP(ip) {
    return crypto.createHash('sha256').update(ip + 'goomufulo-salt').digest('hex').substring(0, 16)
}

// POST /api/visits/track - Enregistrer une visite (public, appelé par le frontend)
router.post('/track', async (req, res) => {
    try {
        const ip = req.ip || req.connection.remoteAddress || 'unknown'
        const ipHash = hashIP(ip)
        const page = (req.body.page || '/').substring(0, 255)
        const userAgent = (req.headers['user-agent'] || '').substring(0, 500)

        // Éviter les doublons : max 1 entrée par IP+page par 30 minutes
        const recent = await query(
            "SELECT id FROM visits WHERE ip_hash = $1 AND page = $2 AND created_at > NOW() - INTERVAL '30 minutes'",
            [ipHash, page]
        )
        if (recent.rows.length > 0) {
            return res.json({ tracked: false })
        }

        await query(
            'INSERT INTO visits (ip_hash, page, user_agent) VALUES ($1, $2, $3)',
            [ipHash, page, userAgent]
        )

        res.json({ tracked: true })
    } catch (error) {
        console.error('Visit tracking error:', error)
        res.json({ tracked: false })
    }
})

// Helper: récupérer l'email de l'utilisateur depuis la DB
async function getUserEmail(userId) {
    const result = await query('SELECT email FROM users WHERE id = $1', [userId])
    return result.rows[0]?.email || null
}

// GET /api/visits/stats - Stats visiteurs (super-admin only)
router.get('/stats', authMiddleware, requireRole('admin'), async (req, res) => {
    try {
        const email = await getUserEmail(req.user.id)
        if (!isSuperAdmin(email)) {
            return res.status(403).json({ error: 'Accès réservé aux super-administrateurs' })
        }

        // Stats globales
        const [
            totalVisits,
            uniqueVisitors,
            todayVisits,
            todayUnique,
            weekVisits,
            monthVisits,
            topPages,
            dailyStats
        ] = await Promise.all([
            // Total visites
            query('SELECT COUNT(*) as count FROM visits'),
            // Visiteurs uniques (par IP hash)
            query('SELECT COUNT(DISTINCT ip_hash) as count FROM visits'),
            // Visites aujourd'hui
            query("SELECT COUNT(*) as count FROM visits WHERE created_at >= CURRENT_DATE"),
            // Visiteurs uniques aujourd'hui
            query("SELECT COUNT(DISTINCT ip_hash) as count FROM visits WHERE created_at >= CURRENT_DATE"),
            // Visites cette semaine
            query("SELECT COUNT(*) as count FROM visits WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'"),
            // Visites ce mois
            query("SELECT COUNT(*) as count FROM visits WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'"),
            // Pages les plus visitées
            query(`
                SELECT page, COUNT(*) as count, COUNT(DISTINCT ip_hash) as unique_count
                FROM visits
                WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY page
                ORDER BY count DESC
                LIMIT 10
            `),
            // Stats journalières des 30 derniers jours
            query(`
                SELECT
                    DATE(created_at) as date,
                    COUNT(*) as visits,
                    COUNT(DISTINCT ip_hash) as unique_visitors
                FROM visits
                WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `)
        ])

        res.json({
            total: {
                visits: parseInt(totalVisits.rows[0].count),
                uniqueVisitors: parseInt(uniqueVisitors.rows[0].count)
            },
            today: {
                visits: parseInt(todayVisits.rows[0].count),
                uniqueVisitors: parseInt(todayUnique.rows[0].count)
            },
            week: parseInt(weekVisits.rows[0].count),
            month: parseInt(monthVisits.rows[0].count),
            topPages: topPages.rows,
            dailyStats: dailyStats.rows
        })

    } catch (error) {
        console.error('Visit stats error:', error)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

module.exports = router
