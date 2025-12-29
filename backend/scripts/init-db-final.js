const { pool } = require('../database')
const bcrypt = require('bcryptjs')
require('dotenv').config()

async function setupDatabase() {
    console.log('🚀 Démarrage de la configuration finale de la base de données...')

    try {
        // 1. Table USERS
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        console.log('✅ Table users configurée')

        // 2. Table DICTIONARY
        await pool.query(`
            CREATE TABLE IF NOT EXISTS dictionary (
                id SERIAL PRIMARY KEY,
                word VARCHAR(100) NOT NULL,
                translation_fr TEXT,
                translation_en TEXT,
                translation_ff TEXT,
                category VARCHAR(50),
                example TEXT,
                example_translation TEXT,
                audio_word VARCHAR(255),
                audio_example VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        // Ajout des colonnes si elles manquent (pour les mises à jour)
        const dictCols = ['translation_ff', 'audio_word', 'audio_example']
        for (const col of dictCols) {
            await pool.query(`ALTER TABLE dictionary ADD COLUMN IF NOT EXISTS ${col} TEXT`).catch(() => { })
        }
        console.log('✅ Table dictionary configurée')

        // 3. Table MEMBERS
        await pool.query(`
            CREATE TABLE IF NOT EXISTS members (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                role_fr VARCHAR(100),
                role_en VARCHAR(100),
                role_ff VARCHAR(100),
                specialty VARCHAR(100),
                bio_fr TEXT,
                bio_en TEXT,
                bio_ff TEXT,
                image VARCHAR(255),
                joined VARCHAR(20),
                facebook VARCHAR(255),
                twitter VARCHAR(255),
                linkedin VARCHAR(255),
                website VARCHAR(255),
                email VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        const memberCols = ['facebook', 'twitter', 'linkedin', 'website', 'email']
        for (const col of memberCols) {
            await pool.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS ${col} VARCHAR(255)`).catch(() => { })
        }
        console.log('✅ Table members configurée')

        // 4. Table NEWS
        await pool.query(`
            CREATE TABLE IF NOT EXISTS news (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255),
                title_fr VARCHAR(255),
                title_en VARCHAR(255),
                title_ff VARCHAR(255),
                excerpt TEXT,
                excerpt_fr TEXT,
                excerpt_en TEXT,
                excerpt_ff TEXT,
                content TEXT,
                content_fr TEXT,
                content_en TEXT,
                content_ff TEXT,
                category VARCHAR(50),
                type VARCHAR(50),
                date DATE DEFAULT CURRENT_DATE,
                published BOOLEAN DEFAULT true,
                image VARCHAR(255),
                link VARCHAR(255),
                contact_email VARCHAR(255),
                contact_phone VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        const newsCols = [
            'title_fr', 'title_en', 'title_ff',
            'excerpt_fr', 'excerpt_en', 'excerpt_ff',
            'content_fr', 'content_en', 'content_ff',
            'image', 'link', 'contact_email', 'contact_phone'
        ]
        for (const col of newsCols) {
            await pool.query(`ALTER TABLE news ADD COLUMN IF NOT EXISTS ${col} TEXT`).catch(() => { })
        }
        console.log('✅ Table news configurée')

        // 5. Table DIRE_NE_PAS_DIRE
        await pool.query(`
            CREATE TABLE IF NOT EXISTS dire_ne_pas_dire (
                id SERIAL PRIMARY KEY,
                category VARCHAR(100),
                dire TEXT,
                dire_fr TEXT,
                dire_en TEXT,
                dire_ff TEXT,
                ne_pas_dire TEXT,
                ne_pas_dire_fr TEXT,
                ne_pas_dire_en TEXT,
                ne_pas_dire_ff TEXT,
                explanation TEXT,
                explanation_fr TEXT,
                explanation_en TEXT,
                explanation_ff TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        const direCols = [
            'dire_fr', 'dire_en', 'dire_ff',
            'ne_pas_dire_fr', 'ne_pas_dire_en', 'ne_pas_dire_ff',
            'explanation_fr', 'explanation_en', 'explanation_ff'
        ]
        for (const col of direCols) {
            await pool.query(`ALTER TABLE dire_ne_pas_dire ADD COLUMN IF NOT EXISTS ${col} TEXT`).catch(() => { })
        }
        console.log('✅ Table dire_ne_pas_dire configurée')

        // 6. Table CONTENT
        await pool.query(`
            CREATE TABLE IF NOT EXISTS content (
                id SERIAL PRIMARY KEY,
                section VARCHAR(50) NOT NULL,
                key VARCHAR(100) NOT NULL,
                value_fr TEXT,
                value_en TEXT,
                value_ff TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(section, key)
            )
        `)
        console.log('✅ Table content configurée')

        // 7. Table BOOKS
        await pool.query(`
            CREATE TABLE IF NOT EXISTS books (
                id SERIAL PRIMARY KEY,
                title_fr VARCHAR(255) NOT NULL,
                title_en VARCHAR(255),
                title_ff VARCHAR(255),
                author VARCHAR(255),
                description_fr TEXT,
                description_en TEXT,
                description_ff TEXT,
                cover_image VARCHAR(255),
                file_path VARCHAR(255),
                file_size BIGINT,
                category VARCHAR(100),
                year INTEGER,
                published BOOLEAN DEFAULT true,
                price DECIMAL(10, 2) DEFAULT 0,
                is_free BOOLEAN DEFAULT true,
                payment_link VARCHAR(255),
                downloads INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        console.log('✅ Table books configurée')

        // 8. Créer l'admin par défaut
        const adminUsername = process.env.ADMIN_USERNAME || 'admin'
        const adminPassword = process.env.ADMIN_PASSWORD || 'GoomuFulo2024!'
        const existingAdmin = await pool.query('SELECT id FROM users WHERE username = $1', [adminUsername])

        if (existingAdmin.rows.length === 0) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10)
            await pool.query(
                'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
                [adminUsername, hashedPassword, 'admin']
            )
            console.log(`✅ Admin créé: ${adminUsername}`)
        }

        console.log('\n🎉 Base de données parfaitement synchronisée!')

    } catch (error) {
        console.error('❌ Erreur lors de la configuration:', error)
    } finally {
        await pool.end()
    }
}

setupDatabase()
