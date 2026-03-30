const { pool } = require('./database')
const bcrypt = require('bcryptjs')
require('dotenv').config()

async function initDatabase() {
    console.log('🚀 Initialisation de la base de données...')

    try {
        // Table des utilisateurs (admins)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255),
                email VARCHAR(255) UNIQUE,
                google_id VARCHAR(255) UNIQUE,
                role VARCHAR(20) DEFAULT 'moderateur',
                invited_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        console.log('✅ Table users créée')

        // Migrations users
        const usersMigrations = [
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE',
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE',
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by INTEGER REFERENCES users(id)',
            "ALTER TABLE users ALTER COLUMN password DROP NOT NULL",
            "ALTER TABLE users ALTER COLUMN role SET DEFAULT 'moderateur'"
        ]
        for (const sql of usersMigrations) {
            await pool.query(sql).catch(() => {})
        }

        // Table des invitations
        await pool.query(`
            CREATE TABLE IF NOT EXISTS invitations (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'moderateur',
                token VARCHAR(255) UNIQUE NOT NULL,
                invited_by INTEGER REFERENCES users(id) NOT NULL,
                used BOOLEAN DEFAULT false,
                used_at TIMESTAMP,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        console.log('✅ Table invitations créée')

        // Migration: rendre expires_at nullable si la table existait déjà
        await pool.query('ALTER TABLE invitations ALTER COLUMN expires_at DROP NOT NULL').catch(() => {})

        // Table du dictionnaire
        await pool.query(`
            CREATE TABLE IF NOT EXISTS dictionary (
                id SERIAL PRIMARY KEY,
                word VARCHAR(100) NOT NULL,
                translation_fr TEXT,
                translation_en TEXT,
                translation_ff TEXT,
                category VARCHAR(50),
                domain VARCHAR(100),
                example TEXT,
                example_translation TEXT,
                audio_word VARCHAR(255),
                audio_example VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        console.log('✅ Table dictionary créée')

        // Ajouter les colonnes manquantes si elles n'existent pas (migration)
        const dictionaryMigrations = [
            'ALTER TABLE dictionary ADD COLUMN IF NOT EXISTS domain VARCHAR(100)',
            'ALTER TABLE dictionary ADD COLUMN IF NOT EXISTS audio_word VARCHAR(255)',
            'ALTER TABLE dictionary ADD COLUMN IF NOT EXISTS audio_example VARCHAR(255)'
        ]
        for (const sql of dictionaryMigrations) {
            await pool.query(sql).catch(() => {})
        }

        // Table des membres
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
        console.log('✅ Table members créée')

        // Ajouter les colonnes manquantes si elles n'existent pas (migration)
        const membersMigrations = [
            'ALTER TABLE members ADD COLUMN IF NOT EXISTS facebook VARCHAR(255)',
            'ALTER TABLE members ADD COLUMN IF NOT EXISTS twitter VARCHAR(255)',
            'ALTER TABLE members ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255)',
            'ALTER TABLE members ADD COLUMN IF NOT EXISTS website VARCHAR(255)',
            'ALTER TABLE members ADD COLUMN IF NOT EXISTS email VARCHAR(255)'
        ]
        for (const sql of membersMigrations) {
            await pool.query(sql).catch(() => {})
        }

        // Table des actualités
        await pool.query(`
            CREATE TABLE IF NOT EXISTS news (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
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
                link VARCHAR(500),
                contact_email VARCHAR(255),
                contact_phone VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        console.log('✅ Table news créée')

        // Ajouter les colonnes manquantes si elles n'existent pas (migration)
        const newsMigrations = [
            'ALTER TABLE news ADD COLUMN IF NOT EXISTS title_fr VARCHAR(255)',
            'ALTER TABLE news ADD COLUMN IF NOT EXISTS title_en VARCHAR(255)',
            'ALTER TABLE news ADD COLUMN IF NOT EXISTS title_ff VARCHAR(255)',
            'ALTER TABLE news ADD COLUMN IF NOT EXISTS excerpt_fr TEXT',
            'ALTER TABLE news ADD COLUMN IF NOT EXISTS excerpt_en TEXT',
            'ALTER TABLE news ADD COLUMN IF NOT EXISTS excerpt_ff TEXT',
            'ALTER TABLE news ADD COLUMN IF NOT EXISTS content_fr TEXT',
            'ALTER TABLE news ADD COLUMN IF NOT EXISTS content_en TEXT',
            'ALTER TABLE news ADD COLUMN IF NOT EXISTS content_ff TEXT',
            'ALTER TABLE news ADD COLUMN IF NOT EXISTS image VARCHAR(255)',
            'ALTER TABLE news ADD COLUMN IF NOT EXISTS link VARCHAR(500)',
            'ALTER TABLE news ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255)',
            'ALTER TABLE news ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50)'
        ]
        for (const sql of newsMigrations) {
            await pool.query(sql).catch(() => {})
        }

        // Table "Dire, Ne pas dire"
        await pool.query(`
            CREATE TABLE IF NOT EXISTS dire_ne_pas_dire (
                id SERIAL PRIMARY KEY,
                category VARCHAR(100),
                dire TEXT NOT NULL,
                dire_fr TEXT,
                dire_en TEXT,
                dire_ff TEXT,
                ne_pas_dire TEXT NOT NULL,
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
        console.log('✅ Table dire_ne_pas_dire créée')

        // Ajouter les colonnes manquantes si elles n'existent pas (migration)
        const direMigrations = [
            'ALTER TABLE dire_ne_pas_dire ADD COLUMN IF NOT EXISTS dire_fr TEXT',
            'ALTER TABLE dire_ne_pas_dire ADD COLUMN IF NOT EXISTS dire_en TEXT',
            'ALTER TABLE dire_ne_pas_dire ADD COLUMN IF NOT EXISTS dire_ff TEXT',
            'ALTER TABLE dire_ne_pas_dire ADD COLUMN IF NOT EXISTS ne_pas_dire_fr TEXT',
            'ALTER TABLE dire_ne_pas_dire ADD COLUMN IF NOT EXISTS ne_pas_dire_en TEXT',
            'ALTER TABLE dire_ne_pas_dire ADD COLUMN IF NOT EXISTS ne_pas_dire_ff TEXT',
            'ALTER TABLE dire_ne_pas_dire ADD COLUMN IF NOT EXISTS explanation_fr TEXT',
            'ALTER TABLE dire_ne_pas_dire ADD COLUMN IF NOT EXISTS explanation_en TEXT',
            'ALTER TABLE dire_ne_pas_dire ADD COLUMN IF NOT EXISTS explanation_ff TEXT'
        ]
        for (const sql of direMigrations) {
            await pool.query(sql).catch(() => {})
        }

        // Table contenu général (Hero, À propos, etc.)
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
        console.log('✅ Table content créée')

        // Table des livres (bibliothèque)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS books (
                id SERIAL PRIMARY KEY,
                title_fr VARCHAR(255),
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
                price DECIMAL(10,2) DEFAULT 0,
                is_free BOOLEAN DEFAULT true,
                payment_link VARCHAR(500),
                downloads INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        console.log('✅ Table books créée')

        // Table des questions de langue
        await pool.query(`
            CREATE TABLE IF NOT EXISTS language_questions (
                id SERIAL PRIMARY KEY,
                question_fr TEXT NOT NULL,
                question_en TEXT,
                question_ff TEXT,
                answer_fr TEXT NOT NULL,
                answer_en TEXT,
                answer_ff TEXT,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        console.log('✅ Table language_questions créée')

        // Table des messages de contact
        await pool.query(`
            CREATE TABLE IF NOT EXISTS contact_messages (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                read BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        console.log('✅ Table contact_messages créée')

        // Table des demandes de suppression dictionnaire (double validation super-admin)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS dictionary_delete_requests (
                id SERIAL PRIMARY KEY,
                word_id INTEGER NOT NULL REFERENCES dictionary(id) ON DELETE CASCADE,
                requested_by INTEGER NOT NULL REFERENCES users(id),
                approved_by INTEGER REFERENCES users(id),
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP
            )
        `)
        console.log('✅ Table dictionary_delete_requests créée')

        // Table de suivi des visiteurs
        await pool.query(`
            CREATE TABLE IF NOT EXISTS visits (
                id SERIAL PRIMARY KEY,
                ip_hash VARCHAR(64) NOT NULL,
                page VARCHAR(255) NOT NULL DEFAULT '/',
                user_agent TEXT,
                country VARCHAR(10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        // Index pour les requêtes de stats par date
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at)
        `).catch(() => {})
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_visits_ip_date ON visits(ip_hash, created_at)
        `).catch(() => {})
        console.log('✅ Table visits créée')

        // Table de suivi des recherches dictionnaire
        await pool.query(`
            CREATE TABLE IF NOT EXISTS dictionary_searches (
                id SERIAL PRIMARY KEY,
                term VARCHAR(255) NOT NULL,
                results_count INTEGER DEFAULT 0,
                ip_hash VARCHAR(64),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_dict_searches_term ON dictionary_searches(LOWER(term))
        `).catch(() => {})
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_dict_searches_date ON dictionary_searches(created_at)
        `).catch(() => {})
        console.log('✅ Table dictionary_searches créée')

        // Colonne view_count sur dictionary
        await pool.query(
            'ALTER TABLE dictionary ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0'
        ).catch(() => {})

        // Créer l'admin par défaut
        const adminUsername = process.env.ADMIN_USERNAME || 'admin'
        const adminPassword = process.env.ADMIN_PASSWORD

        const existingAdmin = await pool.query('SELECT id FROM users WHERE username = $1', [adminUsername])

        if (existingAdmin.rows.length === 0) {
            if (!adminPassword) {
                console.log('⚠️ ADMIN_PASSWORD non défini dans .env, création admin ignorée')
            } else {
                const hashedPassword = await bcrypt.hash(adminPassword, 10)
                await pool.query(
                    'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
                    [adminUsername, hashedPassword, 'admin']
                )
                console.log(`✅ Admin créé: ${adminUsername}`)
            }
        } else {
            console.log('ℹ️ Admin existe déjà')
        }

        console.log('\n🎉 Base de données initialisée avec succès!')

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error)
    } finally {
        await pool.end()
    }
}

initDatabase()
