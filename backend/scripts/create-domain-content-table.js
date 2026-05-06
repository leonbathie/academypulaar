const { pool } = require('../database');

async function createDomainContentTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS domain_content (
                id SERIAL PRIMARY KEY,
                domain VARCHAR(100) NOT NULL,
                language CHAR(2) NOT NULL,
                content JSONB NOT NULL DEFAULT '{}'::jsonb,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(domain, language)
            )
        `);
        await pool.query('CREATE INDEX IF NOT EXISTS idx_domain_content_domain ON domain_content(domain)');
        console.log('✅ Table domain_content créée avec succès!');
    } catch (e) {
        console.error('Erreur:', e);
    } finally {
        await pool.end();
    }
}

createDomainContentTable();
