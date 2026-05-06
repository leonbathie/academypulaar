import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../context/AuthContext'

// Champs editables stockes dans la table `terminologie` (key + value_fr/en/ff).
// Le 2e param `i18n` est la cle de fallback affichee sur le site public quand le champ est vide.
const FIELDS = [
    { key: 'why_title',    i18n: 'terminology.why',        isArea: false, labelKey: 'admin.terminology.fields.whyTitle' },
    { key: 'why_text',     i18n: 'terminology.whyText',    isArea: true,  labelKey: 'admin.terminology.fields.whyText' },
    { key: 'method_title', i18n: 'terminology.method',     isArea: false, labelKey: 'admin.terminology.fields.methodTitle' },
    { key: 'method_text',  i18n: 'terminology.methodText', isArea: true,  labelKey: 'admin.terminology.fields.methodText' }
]

const LANG_FIELDS = [
    { lang: 'fr', col: 'value_fr', flag: '🇫🇷', labelKey: 'admin.terminology.lang.fr' },
    { lang: 'en', col: 'value_en', flag: '🇬🇧', labelKey: 'admin.terminology.lang.en' },
    { lang: 'ff', col: 'value_ff', flag: '🌍', labelKey: 'admin.terminology.lang.ff' }
]

function TerminologyPageEditor() {
    const { t, i18n } = useTranslation()
    const { apiRequest } = useApi()
    const [form, setForm] = useState({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState(null)

    useEffect(() => {
        load()
    }, [])

    const load = async () => {
        try {
            const data = await apiRequest('/terminologie')
            const next = {}
            for (const f of FIELDS) {
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
            const entries = FIELDS.map(f => ({ key: f.key, ...form[f.key] }))
            await apiRequest('/terminologie', { method: 'POST', body: JSON.stringify({ entries }) })
            setMessage({ type: 'success', text: t('admin.terminology.pageSaved') })
            setTimeout(() => setMessage(null), 3000)
        } catch (err) {
            setMessage({ type: 'error', text: (err && err.message) || t('admin.common.errorPrefix') })
        } finally {
            setSaving(false)
        }
    }

    const i18nDefault = (key) => t(key, { lng: (i18n.language || 'fr').substring(0, 2) })

    if (loading) {
        return <div className="admin-loading"><div className="spinner-large"></div></div>
    }

    return (
        <div className="admin-card">
            <div className="admin-card-header-actions">
                <h2>{t('admin.terminology.pageTitle')}</h2>
                <button className="btn-save" onClick={save} disabled={saving}>
                    {saving ? <div className="btn-spinner"></div> : t('admin.common.save')}
                </button>
            </div>

            <p className="admin-help-text">
                {t('admin.terminology.pageHelp')}
            </p>

            {message && (
                <div className={`admin-message admin-message-${message.type}`}>
                    {message.text}
                </div>
            )}

            {FIELDS.map(f => (
                <fieldset key={f.key} className="admin-fieldset">
                    <legend className="admin-fieldset-legend">{t(f.labelKey)}</legend>
                    <div className="admin-fieldset-hint">
                        {t('admin.terminology.defaultI18n')} : <em>{i18nDefault(f.i18n)}</em>
                    </div>
                    <div className="admin-lang-grid">
                        {LANG_FIELDS.map(lf => (
                            <div key={lf.lang} className="form-group">
                                <label>
                                    <span className="admin-lang-flag" aria-hidden="true">{lf.flag}</span>
                                    {t(lf.labelKey)}
                                </label>
                                {f.isArea ? (
                                    <textarea
                                        rows={3}
                                        value={form[f.key]?.[lf.col] || ''}
                                        onChange={e => update(f.key, lf.col, e.target.value)}
                                        placeholder={t(f.i18n, { lng: lf.lang })}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={form[f.key]?.[lf.col] || ''}
                                        onChange={e => update(f.key, lf.col, e.target.value)}
                                        placeholder={t(f.i18n, { lng: lf.lang })}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </fieldset>
            ))}

            <div className="admin-card-footer">
                <button className="btn-save" onClick={save} disabled={saving}>
                    {saving ? <div className="btn-spinner"></div> : t('admin.common.save')}
                </button>
            </div>
        </div>
    )
}

export default TerminologyPageEditor
