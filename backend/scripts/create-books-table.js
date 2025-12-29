const { pool } = require('../database');

async function createBooksTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS books (
                id SERIAL PRIMARY KEY,
                title_fr TEXT NOT NULL,
                title_en TEXT,
                title_ff TEXT,
                author TEXT,
                description_fr TEXT,
                description_en TEXT,
                description_ff TEXT,
                cover_image TEXT,
                file_path TEXT,
                file_size INTEGER,
                category TEXT,
                year INTEGER,
                downloads INTEGER DEFAULT 0,
                published BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table books créée avec succès!');
    } catch (e) {
        console.error('Erreur:', e);
    } finally {
        await pool.end();
    }
}

createBooksTable();
