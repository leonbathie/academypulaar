const { Pool } = require('pg')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

// Configuration de la connexion PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// Test de connexion
pool.on('connect', () => {
    console.log('✅ Connecté à PostgreSQL')
})

pool.on('error', (err) => {
    console.error('❌ Erreur PostgreSQL:', err)
})

// Helper pour les requêtes
const query = async (text, params) => {
    const start = Date.now()
    try {
        const res = await pool.query(text, params)
        const duration = Date.now() - start
        console.log('Query executed:', { text: text.substring(0, 50), duration, rows: res.rowCount })
        return res
    } catch (error) {
        console.error('Query error:', error.message)
        throw error
    }
}

module.exports = {
    pool,
    query
}
