/**
 * Migration : passage du dictionnaire en multi-domaines (table pivot).
 *
 * - Ajoute la colonne dictionary.word_normalized
 * - Cree la table pivot dictionary_domains (UNIQUE(dictionary_id, domain))
 * - Reporte les valeurs existantes dictionary.domain dans la pivot
 * - Deduplique les entrees par word_normalized (garde le plus petit id,
 *   fusionne les domaines, supprime les doublons et leurs dependances)
 * - Ajoute les contraintes UNIQUE finales
 *
 * Idempotent : peut etre relance autant de fois que necessaire.
 *
 * Usage : node backend/scripts/migrate-dictionary-multi-domain.js
 */
const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : false
})

// Normalisation cote SQL (cohérente avec backend/routes/dictionary.js)
// - NFC implicite (Postgres stocke deja en UTF-8)
// - LOWER pour insensibilite a la casse
// - REGEXP_REPLACE pour collapse les espaces multiples + trim
const NORMALIZE_SQL = `LOWER(BTRIM(REGEXP_REPLACE(word, '\\s+', ' ', 'g')))`

async function main() {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        // 1) Colonne word_normalized
        await client.query('ALTER TABLE dictionary ADD COLUMN IF NOT EXISTS word_normalized TEXT')
        console.log('✓ Colonne dictionary.word_normalized assuree')

        // Re-normaliser TOUTES les lignes (au cas ou une ancienne valeur traine)
        const upd = await client.query(
            `UPDATE dictionary SET word_normalized = ${NORMALIZE_SQL} WHERE word IS NOT NULL`
        )
        console.log(`✓ word_normalized recalcule pour ${upd.rowCount} lignes`)

        // Index sur word_normalized (avant la contrainte UNIQUE finale)
        await client.query('CREATE INDEX IF NOT EXISTS idx_dictionary_word_normalized ON dictionary(word_normalized)')

        // 2) Table pivot
        await client.query(`
            CREATE TABLE IF NOT EXISTS dictionary_domains (
                id SERIAL PRIMARY KEY,
                dictionary_id INTEGER NOT NULL REFERENCES dictionary(id) ON DELETE CASCADE,
                domain VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(dictionary_id, domain)
            )
        `)
        await client.query('CREATE INDEX IF NOT EXISTS idx_dictionary_domains_domain ON dictionary_domains(domain)')
        await client.query('CREATE INDEX IF NOT EXISTS idx_dictionary_domains_dictionary_id ON dictionary_domains(dictionary_id)')
        console.log('✓ Table pivot dictionary_domains assuree')

        // 3) Reporter les domaines existants dans la pivot (ON CONFLICT DO NOTHING grace a la UNIQUE)
        const inserted = await client.query(`
            INSERT INTO dictionary_domains (dictionary_id, domain)
            SELECT id, BTRIM(domain) FROM dictionary
            WHERE domain IS NOT NULL AND BTRIM(domain) <> ''
            ON CONFLICT (dictionary_id, domain) DO NOTHING
        `)
        console.log(`✓ ${inserted.rowCount} associations reportees dans la pivot`)

        // 4) Dedup : pour chaque word_normalized avec plusieurs lignes,
        //    garder l'id le plus petit et fusionner les autres dedans.
        const { rows: dupGroups } = await client.query(`
            SELECT word_normalized, ARRAY_AGG(id ORDER BY id) AS ids
            FROM dictionary
            WHERE word_normalized IS NOT NULL AND word_normalized <> ''
            GROUP BY word_normalized
            HAVING COUNT(*) > 1
        `)
        console.log(`→ ${dupGroups.length} groupe(s) de doublons detectes`)

        let mergedDomains = 0
        let deletedRows = 0
        for (const grp of dupGroups) {
            const [keepId, ...deleteIds] = grp.ids

            // Reporter les domaines de chaque doublon vers l'entree gardee
            for (const dupId of deleteIds) {
                const r = await client.query(`
                    INSERT INTO dictionary_domains (dictionary_id, domain)
                    SELECT $1, domain FROM dictionary_domains WHERE dictionary_id = $2
                    ON CONFLICT (dictionary_id, domain) DO NOTHING
                `, [keepId, dupId])
                mergedDomains += r.rowCount

                // Reporter aussi le domaine principal s'il existe encore (cas data ancienne)
                await client.query(`
                    INSERT INTO dictionary_domains (dictionary_id, domain)
                    SELECT $1, BTRIM(domain) FROM dictionary
                    WHERE id = $2 AND domain IS NOT NULL AND BTRIM(domain) <> ''
                    ON CONFLICT (dictionary_id, domain) DO NOTHING
                `, [keepId, dupId])
            }

            // Reporter les references des tables liees (delete_requests, searches, views)
            // pour ne pas perdre l'historique.
            await client.query(
                `UPDATE dictionary_delete_requests SET word_id = $1 WHERE word_id = ANY($2::int[])`,
                [keepId, deleteIds]
            ).catch(() => {})

            // Suppression des doublons (cascade sur dictionary_domains des doublons)
            const del = await client.query(
                `DELETE FROM dictionary WHERE id = ANY($1::int[])`,
                [deleteIds]
            )
            deletedRows += del.rowCount
        }
        console.log(`✓ Dedup : ${mergedDomains} domaines fusionnes, ${deletedRows} ligne(s) doublon supprimees`)

        // 5) Contrainte UNIQUE finale sur word_normalized
        // (creer seulement si elle n'existe pas deja)
        const { rows: cExists } = await client.query(`
            SELECT 1 FROM pg_constraint
            WHERE conname = 'dictionary_word_normalized_key'
        `)
        if (cExists.length === 0) {
            await client.query(`
                ALTER TABLE dictionary
                ADD CONSTRAINT dictionary_word_normalized_key UNIQUE (word_normalized)
            `)
            console.log('✓ Contrainte UNIQUE sur word_normalized creee')
        } else {
            console.log('= Contrainte UNIQUE sur word_normalized deja en place')
        }

        await client.query('COMMIT')
        console.log('\n✅ Migration multi-domaines terminee avec succes')
    } catch (err) {
        await client.query('ROLLBACK')
        console.error('❌ Erreur migration :', err.message)
        process.exitCode = 1
    } finally {
        client.release()
        await pool.end()
    }
}

main()
