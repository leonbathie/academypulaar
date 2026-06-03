/**
 * Migration : ajoute la colonne `image` au dictionnaire (image illustrative
 * optionnelle par mot). Idempotent.
 *
 * Usage : node backend/scripts/add-dictionary-image-column.js
 */
const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
})

async function main() {
    try {
        await pool.query('ALTER TABLE dictionary ADD COLUMN IF NOT EXISTS image VARCHAR(255)')
        console.log('✅ Colonne dictionary.image assuree')
    } catch (err) {
        console.error('❌ Erreur migration image :', err.message)
        process.exitCode = 1
    } finally {
        await pool.end()
    }
}

main()
