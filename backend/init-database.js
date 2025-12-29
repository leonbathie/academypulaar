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
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        console.log('✅ Table users créée')

        // Table du dictionnaire
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        console.log('✅ Table dictionary créée')

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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        console.log('✅ Table members créée')

        // Table des actualités
        await pool.query(`
            CREATE TABLE IF NOT EXISTS news (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                excerpt TEXT,
                content TEXT,
                category VARCHAR(50),
                type VARCHAR(50),
                date DATE DEFAULT CURRENT_DATE,
                published BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        console.log('✅ Table news créée')

        // Table "Dire, Ne pas dire"
        await pool.query(`
            CREATE TABLE IF NOT EXISTS dire_ne_pas_dire (
                id SERIAL PRIMARY KEY,
                category VARCHAR(100),
                dire TEXT NOT NULL,
                ne_pas_dire TEXT NOT NULL,
                explanation TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)
        console.log('✅ Table dire_ne_pas_dire créée')

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

        // Créer l'admin par défaut
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
        } else {
            console.log('ℹ️ Admin existe déjà')
        }

        console.log('\n🎉 Base de données initialisée avec succès!')
        console.log('📝 Credentials admin:')
        console.log(`   Username: ${adminUsername}`)
        console.log(`   Password: ${adminPassword}`)

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error)
    } finally {
        await pool.end()
    }
}

initDatabase()
