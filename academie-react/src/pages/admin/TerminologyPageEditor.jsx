import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../context/AuthContext'

// Les clés stockées dans la table `content` (section = 'terminologie').
// Si une valeur est vide, la page publique affiche la traduction i18n par défaut.
const FIELDS = [
    { key: 'why_title',    i18n: 'terminology.why',        isArea: false, labelFr: 'Titre — Pourquoi une terminologie Fulfulde ?' },
    { key: 'why_text',     i18n: 'terminology.whyText',    isArea: true,  labelFr: 'Texte — Pourquoi une terminologie Fulfulde ?' },
    { key: 'method_title', i18n: 'terminology.method',     isArea: false, labelFr: 'Titre — Méthode de création' },
    { key: 'method_text',  i18n: 'terminology.methodText', isArea: true,  labelFr: 'Texte — Méthode de création' }
]

const LANG_FIELDS = [
    { lang: 'fr', col: 'value_fr', flag: '🇫🇷', label: 'Français' },
    { lang: 'en', col: 'value_en', flag: 'EN',   label: 'Anglais' },
    { lang: 'ff', col: 'value_ff', flag: 'SN',   label: 'Fulfulde' }
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
            // data = { key: { value_fr, value_en, value_ff }, ... }
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
            setMessage({ type: 'success', text: t('admin.terminology.pageSaved', 'Contenu enregistré') })
            setTimeout(() => setMessage(null), 3000)
        } catch (err) {
            setMessage({ type: 'error', text: (err && err.message) || 'Erreur' })
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
                <h2>{t('admin.terminology.pageTitle', 'Page Terminologie — Pourquoi & Méthode')}</h2>
                <button className="btn-save" onClick={save} disabled={saving}>
                    {saving ? <div className="btn-spinner"></div> : t('admin.common.save', 'Enregistrer')}
                </button>
            </div>

            <p style={{ color: 'var(--medium-gray, #6b7280)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {t('admin.terminology.pageHelp', 'Ces textes apparaissent sur /terminologie. Laisser un champ vide affiche la traduction par défaut de l\'application.')}
            </p>

            {message && (
                <div className={`admin-message admin-message-${message.type}`} style={{
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    borderRadius: 6,
                    background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                    color: message.type === 'success' ? '#065f46' : '#991b1b'
                }}>
                    {message.text}
                </div>
            )}

            {FIELDS.map(f => (
                <div key={f.key} className="form-group" style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                        {f.labelFr}
                    </label>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                        {t('admin.terminology.defaultI18n', 'Valeur par défaut')} : <em>{i18nDefault(f.i18n)}</em>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                        {LANG_FIELDS.map(lf => (
                            <div key={lf.lang}>
                                <label style={{ fontSize: '0.85rem', color: '#374151' }}>{lf.flag} {lf.label}</label>
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
                </div>
            ))}

            <div style={{ textAlign: 'right' }}>
                <button className="btn-save" onClick={save} disabled={saving}>
                    {saving ? <div className="btn-spinner"></div> : t('admin.common.save', 'Enregistrer')}
                </button>
            </div>
        </div>
    )
}

export default TerminologyPageEditor
