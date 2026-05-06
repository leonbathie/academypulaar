import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../context/AuthContext'

// Sections logiques de /terminologie : chacune regroupe un Titre + un Texte
// declines en FR/EN/FF dans la table `terminologie`. Le 2nd `i18n` est la cle
// de fallback affichee sur le site public lorsque le champ DB est vide.
const SECTIONS = [
    {
        id: 'why',
        icon: '❓',
        accent: 'gold',
        labelKey: 'admin.terminology.section.why',
        descKey: 'admin.terminology.section.whyDesc',
        fields: [
            { key: 'why_title', i18n: 'terminology.why',     isArea: false, subKey: 'subTitle' },
            { key: 'why_text',  i18n: 'terminology.whyText', isArea: true,  subKey: 'subText'  }
        ]
    },
    {
        id: 'method',
        icon: '⚙️',
        accent: 'forest',
        labelKey: 'admin.terminology.section.method',
        descKey: 'admin.terminology.section.methodDesc',
        fields: [
            { key: 'method_title', i18n: 'terminology.method',     isArea: false, subKey: 'subTitle' },
            { key: 'method_text',  i18n: 'terminology.methodText', isArea: true,  subKey: 'subText'  }
        ]
    }
]

// Liste a plat (utile pour load/save)
const ALL_FIELDS = SECTIONS.flatMap(s => s.fields.map(f => ({ ...f, sectionId: s.id })))

const LANG_FIELDS = [
    { lang: 'fr', col: 'value_fr', flag: '🇫🇷', labelKey: 'admin.terminology.lang.fr' },
    { lang: 'en', col: 'value_en', flag: '🇬🇧', labelKey: 'admin.terminology.lang.en' },
    { lang: 'ff', col: 'value_ff', flag: '🌍', labelKey: 'admin.terminology.lang.ff' }
]

function TerminologyPageEditor() {
    const { t } = useTranslation()
    const { apiRequest } = useApi()
    const [form, setForm] = useState({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState(null)
    const [showDefault, setShowDefault] = useState({}) // par fieldKey

    useEffect(() => {
        load()
    }, [])

    const load = async () => {
        try {
            const data = await apiRequest('/terminologie')
            const next = {}
            for (const f of ALL_FIELDS) {
                const row = data[f.key] || {}
                next[f.key] = {
                    value_fr: row.value_fr || '',
                    value_en: row.value_en || '',
                    value_ff: row.value_ff || ''
                }
            }
            setForm(next)
        } catch (err) {
            console.error('Load terminologie page content', err)
        } finally {
            setLoading(false)
        }
    }

    const update = (key, col, value) => {
        setForm(prev => ({ ...prev, [key]: { ...prev[key], [col]: value } }))
    }

    const save = async () => {
        setSaving(true)
        setMessage(null)
        try {
            const entries = ALL_FIELDS.map(f => ({ key: f.key, ...form[f.key] }))
            await apiRequest('/terminologie', { method: 'POST', body: JSON.stringify({ entries }) })
            setMessage({ type: 'success', text: t('admin.terminology.pageSaved') })
            setTimeout(() => setMessage(null), 3000)
        } catch (err) {
            setMessage({ type: 'error', text: (err && err.message) || t('admin.common.errorPrefix') })
        } finally {
            setSaving(false)
        }
    }

    const toggleDefault = (key) => setShowDefault(prev => ({ ...prev, [key]: !prev[key] }))

    // Compteur global (combien de champs personnalises sur 12 = 4 fields x 3 langues)
    const filledCount = useMemo(() => {
        let n = 0
        for (const f of ALL_FIELDS) {
            for (const lf of LANG_FIELDS) {
                if ((form[f.key]?.[lf.col] || '').trim()) n++
            }
        }
        return n
    }, [form])
    const totalSlots = ALL_FIELDS.length * LANG_FIELDS.length

    if (loading) {
        return <div className="admin-loading"><div className="spinner-large"></div></div>
    }

    return (
        <div className="admin-card term-page-editor">
            <div className="admin-card-header-actions">
                <h2>{t('admin.terminology.pageTitle')}</h2>
                <span className="term-fill-counter" title={t('admin.terminology.filledTooltip')}>
                    <span className="term-fill-counter-bar">
                        <span
                            className="term-fill-counter-bar-inner"
                            style={{ width: `${(filledCount / totalSlots) * 100}%` }}
                        />
                    </span>
                    <span className="term-fill-counter-label">
                        {filledCount} / {totalSlots}
                    </span>
                </span>
            </div>

            <p className="admin-help-text">
                {t('admin.terminology.pageHelp')}
            </p>

            {message && (
                <div className={`admin-message admin-message-${message.type}`}>
                    {message.text}
                </div>
            )}

            {SECTIONS.map(section => (
                <div className="admin-fieldset" key={section.id}>
            <div className="admin-fieldset-header">
                <span className="admin-fieldset-icon">{section.icon}</span>
                <div>
                    <h3 className="admin-fieldset-title">{t(section.labelKey)}</h3>
                    <p className="admin-fieldset-desc">{t(section.descKey)}</p>
                </div>
            </div>

            <div className="admin-fieldset-content">
                {section.fields.map(f => (
                    <div key={f.key} className="term-subfield">
                        <div className="term-subfield-head">
                            <h4 className="term-subfield-title">
                                {t(`admin.terminology.${f.subKey}`)}
                            </h4>
                            <button
                                type="button"
                                className="term-default-toggle"
                                onClick={() => toggleDefault(f.key)}
                                aria-expanded={!!showDefault[f.key]}
                            >
                                {showDefault[f.key]
                                    ? '▾ ' + t('admin.terminology.hideDefault')
                                    : '▸ ' + t('admin.terminology.showDefault')}
                            </button>
                        </div>

                        {showDefault[f.key] && (
                            <div className="term-default-preview">
                                {LANG_FIELDS.map(lf => (
                                    <div key={lf.lang} className="term-default-line">
                                        <span className="term-default-flag">{lf.flag}</span>
                                        <em>{t(f.i18n, { lng: lf.lang })}</em>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="admin-lang-grid">
                            {LANG_FIELDS.map(lf => {
                                const value = form[f.key]?.[lf.col] || ''
                                const isFilled = !!value.trim()
                                return (
                                    <div key={lf.lang} className="form-group term-lang-input">
                                        <label>
                                            <span className="admin-lang-flag" aria-hidden="true">{lf.flag}</span>
                                            <span>{t(lf.labelKey)}</span>
                                            <span
                                                className={`term-lang-status ${isFilled ? 'is-filled' : 'is-default'}`}
                                                title={isFilled
                                                    ? t('admin.terminology.statusFilled')
                                                    : t('admin.terminology.statusUsesDefault')}
                                            />
                                        </label>
                                        {f.isArea ? (
                                            <textarea
                                                rows={5}
                                                value={value}
                                                onChange={e => update(f.key, lf.col, e.target.value)}
                                                placeholder={t(f.i18n, { lng: lf.lang })}
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                value={value}
                                                onChange={e => update(f.key, lf.col, e.target.value)}
                                                placeholder={t(f.i18n, { lng: lf.lang })}
                                            />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
            ))}

            <div className="term-sticky-footer">
                <span className="term-sticky-footer-hint">
                    {t('admin.terminology.stickyHint')}
                </span>
                <button className="btn-save" onClick={save} disabled={saving}>
                    {saving ? <div className="btn-spinner"></div> : t('admin.common.save')}
                </button>
            </div>
        </div>
    )
}

export default TerminologyPageEditor
