import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../context/AuthContext'
import domainContent from '../../data/domainContent'

// Doit correspondre à DomainPage.jsx et TerminologieAdmin.jsx
const DOMAIN_OPTIONS = [
    { slug: 'sciences-technologie',      icon: '🔬', label: 'Sciences & Technologie' },
    { slug: 'sante-medecine',            icon: '🏥', label: 'Santé & Médecine' },
    { slug: 'sciences-humaines',         icon: '⚖️', label: 'Sciences humaines' },
    { slug: 'education',                 icon: '📚', label: 'Éducation & Généralités' },
    { slug: 'agriculture-environnement', icon: '🌾', label: 'Agriculture & Environnement' },
    { slug: 'metiers-artisanat',         icon: '🔨', label: 'Métiers & Artisanat' }
]

const LANGUAGES = [
    { code: 'fr', label: '🇫🇷 Français' },
    { code: 'en', label: 'EN Anglais' },
    { code: 'ff', label: 'SN Fulfulde' }
]

// Gabarit vide (utilisé quand ni la base ni le bundle n'ont de contenu)
const EMPTY_CONTENT = {
    introduction: { title: '', paragraphs: [] },
    didYouKnow: [],
    exampleSentences: [],
    methodology: { title: '', steps: [] },
    pronunciation: { title: '', intro: '', sounds: [] }
}

// Deep clone pour éviter de muter les bundles importés
const clone = (v) => JSON.parse(JSON.stringify(v ?? null))

const mergeWithEmpty = (src) => {
    const base = clone(EMPTY_CONTENT)
    if (!src || typeof src !== 'object') return base
    return {
        introduction: {
            title: src.introduction?.title || '',
            paragraphs: Array.isArray(src.introduction?.paragraphs) ? clone(src.introduction.paragraphs) : []
        },
        didYouKnow: Array.isArray(src.didYouKnow) ? clone(src.didYouKnow) : [],
        exampleSentences: Array.isArray(src.exampleSentences) ? clone(src.exampleSentences) : [],
        methodology: {
            title: src.methodology?.title || '',
            steps: Array.isArray(src.methodology?.steps) ? clone(src.methodology.steps) : []
        },
        pronunciation: {
            title: src.pronunciation?.title || '',
            intro: src.pronunciation?.intro || '',
            sounds: Array.isArray(src.pronunciation?.sounds) ? clone(src.pronunciation.sounds) : []
        }
    }
}

function DomainContentEditor() {
    const { t } = useTranslation()
    const { apiRequest } = useApi()
    const [domain, setDomain] = useState(DOMAIN_OPTIONS[0].slug)
    const [lang, setLang] = useState('fr')
    const [remote, setRemote] = useState({}) // { [domain]: { fr, en, ff } }
    const [form, setForm] = useState(() => clone(EMPTY_CONTENT))
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState(null)

    // Charger toutes les données au montage
    useEffect(() => {
        let cancelled = false
        apiRequest('/domain-content')
            .then(data => {
                if (cancelled) return
                setRemote(data && typeof data === 'object' ? data : {})
            })
            .catch(err => console.error('Load domain-content', err))
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [])

    // Recalculer le formulaire quand domain/lang/remote change
    useEffect(() => {
        const fromApi = remote?.[domain]?.[lang]
        const fromBundle = domainContent?.[domain]?.[lang]
        // Priorité : base > bundle > vide
        const src = fromApi && Object.keys(fromApi).length > 0 ? fromApi : fromBundle
        setForm(mergeWithEmpty(src))
        setMessage(null)
    }, [domain, lang, remote])

    const save = async () => {
        setSaving(true)
        setMessage(null)
        try {
            const updated = await apiRequest(`/domain-content/${domain}/${lang}`, {
                method: 'PUT',
                body: JSON.stringify(form)
            })
            // Mettre à jour le cache local
            setRemote(prev => ({
                ...prev,
                [domain]: { ...(prev?.[domain] || {}), [lang]: updated.content }
            }))
            setMessage({ type: 'success', text: t('admin.domainContent.saved', 'Contenu enregistré') })
            setTimeout(() => setMessage(null), 3000)
        } catch (err) {
            setMessage({ type: 'error', text: (err && err.message) || 'Erreur' })
        } finally {
            setSaving(false)
        }
    }

    const resetToDefault = async () => {
        if (!window.confirm(t('admin.domainContent.confirmReset', 'Réinitialiser ce (domaine, langue) à la valeur par défaut (bundle statique) ?'))) return
        try {
            await apiRequest(`/domain-content/${domain}/${lang}`, { method: 'DELETE' })
            setRemote(prev => {
                const next = { ...prev }
                if (next[domain]) {
                    const { [lang]: _gone, ...others } = next[domain]
                    next[domain] = others
                }
                return next
            })
            setMessage({ type: 'success', text: t('admin.domainContent.resetDone', 'Contenu réinitialisé') })
            setTimeout(() => setMessage(null), 3000)
        } catch (err) {
            setMessage({ type: 'error', text: (err && err.message) || 'Erreur' })
        }
    }

    // Helpers array
    const updateIntroTitle = (v) => setForm(f => ({ ...f, introduction: { ...f.introduction, title: v } }))
    const setParagraph = (i, v) => setForm(f => {
        const arr = [...f.introduction.paragraphs]; arr[i] = v
        return { ...f, introduction: { ...f.introduction, paragraphs: arr } }
    })
    const addParagraph = () => setForm(f => ({ ...f, introduction: { ...f.introduction, paragraphs: [...f.introduction.paragraphs, ''] } }))
    const removeParagraph = (i) => setForm(f => {
        const arr = [...f.introduction.paragraphs]; arr.splice(i, 1)
        return { ...f, introduction: { ...f.introduction, paragraphs: arr } }
    })

    const setDyk = (i, field, v) => setForm(f => {
        const arr = [...f.didYouKnow]; arr[i] = { ...arr[i], [field]: v }
        return { ...f, didYouKnow: arr }
    })
    const addDyk = () => setForm(f => ({ ...f, didYouKnow: [...f.didYouKnow, { icon: '💡', title: '', text: '' }] }))
    const removeDyk = (i) => setForm(f => {
        const arr = [...f.didYouKnow]; arr.splice(i, 1)
        return { ...f, didYouKnow: arr }
    })

    const setExample = (i, field, v) => setForm(f => {
        const arr = [...f.exampleSentences]; arr[i] = { ...arr[i], [field]: v }
        return { ...f, exampleSentences: arr }
    })
    const addExample = () => setForm(f => ({
        ...f,
        exampleSentences: [...f.exampleSentences, { ff: '', [lang === 'en' ? 'en' : 'fr']: '', context: '' }]
    }))
    const removeExample = (i) => setForm(f => {
        const arr = [...f.exampleSentences]; arr.splice(i, 1)
        return { ...f, exampleSentences: arr }
    })

    const setMethodTitle = (v) => setForm(f => ({ ...f, methodology: { ...f.methodology, title: v } }))
    const setStep = (i, field, v) => setForm(f => {
        const arr = [...f.methodology.steps]; arr[i] = { ...arr[i], [field]: field === 'num' ? Number(v) || (i + 1) : v }
        return { ...f, methodology: { ...f.methodology, steps: arr } }
    })
    const addStep = () => setForm(f => {
        const nextNum = (f.methodology.steps.length || 0) + 1
        return { ...f, methodology: { ...f.methodology, steps: [...f.methodology.steps, { num: nextNum, title: '', desc: '' }] } }
    })
    const removeStep = (i) => setForm(f => {
        const arr = [...f.methodology.steps]; arr.splice(i, 1)
        return { ...f, methodology: { ...f.methodology, steps: arr } }
    })

    const translationKey = useMemo(() => lang === 'en' ? 'en' : 'fr', [lang])

    const hasRemoteOverride = Boolean(remote?.[domain]?.[lang] && Object.keys(remote[domain][lang]).length > 0)

    if (loading) {
        return <div className="admin-loading"><div className="spinner-large"></div></div>
    }

    return (
        <div className="admin-card">
            <div className="admin-card-header-actions">
                <h2>{t('admin.domainContent.title', 'Contenu pédagogique par domaine')}</h2>
                <div className="admin-actions-row">
                    <select value={domain} onChange={e => setDomain(e.target.value)} className="domain-filter-select">
                        {DOMAIN_OPTIONS.map(d => (
                            <option key={d.slug} value={d.slug}>{d.icon} {d.label}</option>
                        ))}
                    </select>
                    <select value={lang} onChange={e => setLang(e.target.value)} className="domain-filter-select">
                        {LANGUAGES.map(l => (
                            <option key={l.code} value={l.code}>{l.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <p style={{ color: 'var(--medium-gray, #6b7280)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {t('admin.domainContent.help', 'Ce contenu alimente l\'onglet « Apprendre » sur /terminologie/:domaine. Si rien n\'est enregistré, le site public affiche le contenu par défaut livré avec l\'application.')}
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{
                    fontSize: '0.8rem',
                    padding: '0.25rem 0.6rem',
                    borderRadius: 4,
                    background: hasRemoteOverride ? '#dcfce7' : '#f3f4f6',
                    color: hasRemoteOverride ? '#166534' : '#374151'
                }}>
                    {hasRemoteOverride
                        ? t('admin.domainContent.statusOverride', 'Version personnalisée (base de données)')
                        : t('admin.domainContent.statusDefault', 'Valeur par défaut (bundle statique)')}
                </span>
                {hasRemoteOverride && (
                    <button type="button" className="btn-cancel" onClick={resetToDefault} style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                        {t('admin.domainContent.reset', 'Réinitialiser (supprimer l\'override)')}
                    </button>
                )}
            </div>

            {message && (
                <div style={{
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    borderRadius: 6,
                    background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                    color: message.type === 'success' ? '#065f46' : '#991b1b'
                }}>
                    {message.text}
                </div>
            )}

            {/* Introduction */}
            <fieldset className="admin-fieldset" style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>📝 Introduction</legend>
                <div className="form-group">
                    <label>Titre</label>
                    <input type="text" value={form.introduction.title} onChange={e => updateIntroTitle(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Paragraphes</label>
                    {form.introduction.paragraphs.map((p, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <textarea rows={2} value={p} onChange={e => setParagraph(i, e.target.value)} style={{ flex: 1 }} />
                            <button type="button" className="btn-delete" onClick={() => removeParagraph(i)} title="Supprimer">✕</button>
                        </div>
                    ))}
                    <button type="button" className="btn-add" onClick={addParagraph} style={{ fontSize: '0.85rem' }}>+ {t('admin.domainContent.addParagraph', 'Ajouter un paragraphe')}</button>
                </div>
            </fieldset>

            {/* Did You Know */}
            <fieldset className="admin-fieldset" style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>💡 Le saviez-vous ?</legend>
                {form.didYouKnow.map((item, i) => (
                    <div key={i} style={{ border: '1px solid #e5e7eb', padding: '0.75rem', borderRadius: 6, marginBottom: '0.75rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: '0.5rem', alignItems: 'start' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label>Icône</label>
                                <input type="text" value={item.icon || ''} onChange={e => setDyk(i, 'icon', e.target.value)} maxLength={4} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label>Titre</label>
                                <input type="text" value={item.title || ''} onChange={e => setDyk(i, 'title', e.target.value)} />
                            </div>
                            <button type="button" className="btn-delete" onClick={() => removeDyk(i)} style={{ marginTop: '1.4rem' }} title="Supprimer">✕</button>
                        </div>
                        <div className="form-group" style={{ marginTop: '0.5rem' }}>
                            <label>Texte</label>
                            <textarea rows={3} value={item.text || ''} onChange={e => setDyk(i, 'text', e.target.value)} />
                        </div>
                    </div>
                ))}
                <button type="button" className="btn-add" onClick={addDyk} style={{ fontSize: '0.85rem' }}>+ {t('admin.domainContent.addDyk', 'Ajouter une carte')}</button>
            </fieldset>

            {/* Example Sentences */}
            <fieldset className="admin-fieldset" style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>💬 Exemples de phrases</legend>
                {form.exampleSentences.map((ex, i) => (
                    <div key={i} style={{ border: '1px solid #e5e7eb', padding: '0.75rem', borderRadius: 6, marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <strong>Phrase #{i + 1}</strong>
                            <button type="button" className="btn-delete" onClick={() => removeExample(i)} title="Supprimer">✕</button>
                        </div>
                        <div className="form-group">
                            <label>Fulfulde (ff)</label>
                            <input type="text" value={ex.ff || ''} onChange={e => setExample(i, 'ff', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Traduction ({translationKey})</label>
                            <input type="text" value={ex[translationKey] || ''} onChange={e => setExample(i, translationKey, e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Contexte</label>
                            <input type="text" value={ex.context || ''} onChange={e => setExample(i, 'context', e.target.value)} />
                        </div>
                    </div>
                ))}
                <button type="button" className="btn-add" onClick={addExample} style={{ fontSize: '0.85rem' }}>+ {t('admin.domainContent.addExample', 'Ajouter une phrase')}</button>
            </fieldset>

            {/* Methodology */}
            <fieldset className="admin-fieldset" style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>⚙️ Méthodologie (Comment créons-nous les termes ?)</legend>
                <div className="form-group">
                    <label>Titre</label>
                    <input type="text" value={form.methodology.title} onChange={e => setMethodTitle(e.target.value)} />
                </div>
                {form.methodology.steps.map((step, i) => (
                    <div key={i} style={{ border: '1px solid #e5e7eb', padding: '0.75rem', borderRadius: 6, marginBottom: '0.75rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: '0.5rem', alignItems: 'start' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label>N°</label>
                                <input type="number" value={step.num ?? i + 1} onChange={e => setStep(i, 'num', e.target.value)} min={1} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label>Titre</label>
                                <input type="text" value={step.title || ''} onChange={e => setStep(i, 'title', e.target.value)} />
                            </div>
                            <button type="button" className="btn-delete" onClick={() => removeStep(i)} style={{ marginTop: '1.4rem' }} title="Supprimer">✕</button>
                        </div>
                        <div className="form-group" style={{ marginTop: '0.5rem' }}>
                            <label>Description</label>
                            <textarea rows={2} value={step.desc || ''} onChange={e => setStep(i, 'desc', e.target.value)} />
                        </div>
                    </div>
                ))}
                <button type="button" className="btn-add" onClick={addStep} style={{ fontSize: '0.85rem' }}>+ {t('admin.domainContent.addStep', 'Ajouter une étape')}</button>
            </fieldset>

            <div style={{ textAlign: 'right', marginTop: '1.5rem' }}>
                <button className="btn-save" onClick={save} disabled={saving}>
                    {saving ? <div className="btn-spinner"></div> : t('admin.common.save', 'Enregistrer')}
                </button>
            </div>
        </div>
    )
}

export default DomainContentEditor
