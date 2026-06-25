import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { API_URL } from '../config'
import './TerminologyPage.css'

// Cles gerees en base via /api/terminologie. Si une valeur est presente
// dans la DB pour la langue active, elle remplace la traduction i18n.
const OVERRIDE_KEYS = [
    'header_title',
    'header_title_highlight',
    'header_intro',
    'domains_title',
    'why_title',
    'why_text',
    'method_title',
    'method_text'
]

function TerminologyPage() {
    const { t, i18n } = useTranslation()
    const lang = (i18n.language || 'fr').substring(0, 2)
    const langField = lang === 'en' ? 'value_en' : lang === 'ff' ? 'value_ff' : 'value_fr'

    const [overrides, setOverrides] = useState({})

    useEffect(() => {
        let cancelled = false
        // cache: 'no-store' force le navigateur a aller chercher la valeur
        // a jour cote serveur (sinon les modifs admin n'apparaissent qu'apres
        // expiration du cache HTTP).
        fetch(`${API_URL}/api/terminologie`, { cache: 'no-store' })
            .then(r => (r.ok ? r.json() : {}))
            .then(data => {
                if (cancelled || !data || typeof data !== 'object') return
                const next = {}
                for (const k of OVERRIDE_KEYS) {
                    const row = data[k]
                    if (row && row[langField] && String(row[langField]).trim()) {
                        next[k] = row[langField]
                    }
                }
                setOverrides(next)
            })
            .catch(() => {})
        return () => { cancelled = true }
    }, [langField])

    const txt = (overrideKey, i18nKey) => overrides[overrideKey] || t(i18nKey)

    // Premiere fiche "Sciences" : une seule carte regroupant 3 titres cliquables,
    // chacun menant a sa propre page de terminologie.
    const scienceGroup = {
        icon: '🔬',
        items: [
            { key: 'domScience', slug: 'sciences-technologie' },
            { key: 'domTech', slug: 'informatique' },
            { key: 'domSpace', slug: 'astronomie' }
        ]
    }

    const domains = [
        { key: 'domHealth', icon: '🏥', slug: 'sante-medecine' },
        { key: 'domHuman', icon: '⚖️', slug: 'sciences-humaines' },
        { key: 'domEdu', icon: '📚', slug: 'education' },
        { key: 'domAgri', icon: '🌾', slug: 'agriculture-environnement' },
        { key: 'domCrafts', icon: '🔨', slug: 'metiers-artisanat' }
    ]

    return (
        <div className="term-page">
            <div className="term-header">
                <div className="container">
                    <h1 className="page-title">
                        {txt('header_title', 'terminology.title')}{' '}
                        <span className="gold-accent">{txt('header_title_highlight', 'terminology.titleHighlight')}</span>
                    </h1>
                    <p className="page-subtitle">{txt('header_intro', 'terminology.intro')}</p>
                </div>
            </div>

            <div className="container">
                {/* Why section */}
                <section className="term-section">
                    <h2>{txt('why_title', 'terminology.why')}</h2>
                    <p>{txt('why_text', 'terminology.whyText')}</p>
                </section>

                {/* Method section */}
                <section className="term-section">
                    <h2>{txt('method_title', 'terminology.method')}</h2>
                    <p>{txt('method_text', 'terminology.methodText')}</p>
                </section>

                {/* Domains grid */}
                <section className="term-section">
                    <h2>{txt('domains_title', 'terminology.domains')}</h2>
                    <div className="term-domains-grid">
                        {/* Fiche Sciences : 3 titres cliquables dans une seule carte */}
                        <div className="term-domain-card term-domain-card--group">
                            <span className="term-domain-icon">{scienceGroup.icon}</span>
                            <div className="term-domain-group-list">
                                {scienceGroup.items.map((it) => (
                                    <Link key={it.key} to={`/terminologie/${it.slug}`} className="term-domain-group-item">
                                        <h3>{t(`terminology.${it.key}`)}</h3>
                                        <p>{t(`terminology.${it.key}Desc`)}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                        {domains.map((dom) => (
                            <Link key={dom.key} to={`/terminologie/${dom.slug}`} className="term-domain-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                <span className="term-domain-icon">{dom.icon}</span>
                                <h3>{t(`terminology.${dom.key}`)}</h3>
                                <p>{t(`terminology.${dom.key}Desc`)}</p>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}

export default TerminologyPage
