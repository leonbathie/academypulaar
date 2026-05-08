import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../context/AuthContext'
import domainContent from '../../data/domainContent'

// Doit correspondre a DomainPage.jsx + TerminologieAdmin.jsx
const DOMAIN_OPTIONS = [
    { slug: 'sciences-technologie',      icon: '🔬', labelKey: 'terminology.domScience' },
    { slug: 'sante-medecine',            icon: '🏥', labelKey: 'terminology.domHealth' },
    { slug: 'sciences-humaines',         icon: '⚖️', labelKey: 'terminology.domHuman' },
    { slug: 'agriculture-environnement', icon: '🌾', labelKey: 'terminology.domAgri' },
    { slug: 'metiers-artisanat',         icon: '🔨', labelKey: 'terminology.domCrafts' }
]

const LANGUAGES = [
    { code: 'fr', flag: '🇫🇷', labelKey: 'admin.terminology.lang.fr' },
    { code: 'en', flag: '🇬🇧', labelKey: 'admin.terminology.lang.en' },
    { code: 'ff', flag: '🌍', labelKey: 'admin.terminology.lang.ff' }
]

// Sections de l'editeur. Sur mobile, une seule est rendue a la fois (nav par chips).
const EDITOR_SECTIONS = [
    { id: 'intro',    icon: '📝', labelKey: 'admin.domainContent.sectionIntro' },
    { id: 'dyk',      icon: '💡', labelKey: 'admin.domainContent.sectionDyk' },
    { id: 'examples', icon: '💬', labelKey: 'admin.domainContent.sectionExamples' },
    { id: 'method',   icon: '⚙️', labelKey: 'admin.domainContent.sectionMethod' }
]

const EMPTY_CONTENT = {
    introduction: { title: '', paragraphs: [] },
    didYouKnow: [],
    exampleSentences: [],
    methodology: { title: '', steps: [] },
    pronunciation: { title: '', intro: '', sounds: [] }
}

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
    const [remote, setRemote] = useState({})
    const [form, setForm] = useState(() => clone(EMPTY_CONTENT))
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState(null)
    // Section active : sur mobile, on n'affiche qu'une section a la fois
    // (nav par chips). Sur desktop, toutes les sections sont visibles.
    const [activeSection, setActiveSection] = useState('intro')

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

    useEffect(() => {
        const fromApi = remote?.[domain]?.[lang]
        const fromBundle = domainContent?.[domain]?.[lang]
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
            setRemote(prev => ({
                ...prev,
                [domain]: { ...(prev?.[domain] || {}), [lang]: updated.content }
            }))
            setMessage({ type: 'success', text: t('admin.domainContent.saved') })
            setTimeout(() => setMessage(null), 3000)
        } catch (err) {
            setMessage({ type: 'error', text: (err && err.message) || t('admin.common.errorPrefix') })
        } finally {
            setSaving(false)
        }
    }

    const resetToDefault = async () => {
        if (!window.confirm(t('admin.domainContent.confirmReset'))) return
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
            setMessage({ type: 'success', text: t('admin.domainContent.resetDone') })
            setTimeout(() => setMessage(null), 3000)
        } catch (err) {
            setMessage({ type: 'error', text: (err && err.message) || t('admin.common.errorPrefix') })
        }
    }

    // Helpers introduction
    const setIntroTitle = (v) => setForm(f => ({ ...f, introduction: { ...f.introduction, title: v } }))
    const setParagraph = (i, v) => setForm(f => {
        const arr = [...f.introduction.paragraphs]; arr[i] = v
        return { ...f, introduction: { ...f.introduction, paragraphs: arr } }
    })
    const addParagraph = () => setForm(f => ({ ...f, introduction: { ...f.introduction, paragraphs: [...f.introduction.paragraphs, ''] } }))
    const removeParagraph = (i) => setForm(f => {
        const arr = [...f.introduction.paragraphs]; arr.splice(i, 1)
        return { ...f, introduction: { ...f.introduction, paragraphs: arr } }
    })

    // Helpers Did-you-know
    const setDyk = (i, field, v) => setForm(f => {
        const arr = [...f.didYouKnow]; arr[i] = { ...arr[i], [field]: v }
        return { ...f, didYouKnow: arr }
    })
    const addDyk = () => setForm(f => ({ ...f, didYouKnow: [...f.didYouKnow, { icon: '💡', title: '', text: '' }] }))
    const removeDyk = (i) => setForm(f => {
        const arr = [...f.didYouKnow]; arr.splice(i, 1)
        return { ...f, didYouKnow: arr }
    })

    // Helpers exemples
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

    // Helpers methodologie
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
    const activeDomain = DOMAIN_OPTIONS.find(d => d.slug === domain)
    const activeLang = LANGUAGES.find(l => l.code === lang)

    if (loading) {
        return <div className="admin-loading"><div className="spinner-large"></div></div>
    }

    return (
        <div className="admin-card domain-editor-shell">
            <div className="admin-card-header-actions domain-editor-toolbar">
                <h2>{t('admin.domainContent.title')}</h2>
                <div className="admin-actions-row">
                    <select
                        value={domain}
                        onChange={e => setDomain(e.target.value)}
                        className="domain-filter-select"
                        aria-label={t('admin.domainContent.selectDomain')}
                    >
                        {DOMAIN_OPTIONS.map(d => (
                            <option key={d.slug} value={d.slug}>{d.icon} {t(d.labelKey)}</option>
                        ))}
                    </select>
                    <select
                        value={lang}
                        onChange={e => setLang(e.target.value)}
                        className="domain-filter-select"
                        aria-label={t('admin.domainContent.selectLanguage')}
                    >
                        {LANGUAGES.map(l => (
                            <option key={l.code} value={l.code}>{l.flag} {t(l.labelKey)}</option>
                        ))}
                    </select>
                </div>
            </div>

            <p className="admin-help-text">{t('admin.domainContent.help')}</p>

            {activeDomain && (
                <div className="admin-context-pill" aria-live="polite">
                    <span className="admin-context-pill-icon" aria-hidden="true">{activeDomain.icon}</span>
                    <span className="admin-context-pill-text">
                        <strong>{t(activeDomain.labelKey)}</strong>
                        <span className="admin-context-pill-divider" aria-hidden="true">·</span>
                        <span>{activeLang?.flag} {t(activeLang?.labelKey || 'admin.terminology.lang.fr')}</span>
                    </span>
                </div>
            )}

            <div className="admin-status-row">
                <span className={`admin-status-badge ${hasRemoteOverride ? 'admin-status-badge-override' : 'admin-status-badge-default'}`}>
                    {hasRemoteOverride
                        ? t('admin.domainContent.statusOverride')
                        : t('admin.domainContent.statusDefault')}
                </span>
                {hasRemoteOverride && (
                    <button type="button" className="btn-cancel admin-status-reset" onClick={resetToDefault}>
                        {t('admin.domainContent.reset')}
                    </button>
                )}
            </div>

            {message && (
                <div className={`admin-message admin-message-${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* Nav sections : visible uniquement en mobile, change activeSection */}
            <nav className="domain-editor-section-nav" role="tablist" aria-label={t('admin.domainContent.title')}>
                {EDITOR_SECTIONS.map(s => (
                    <button
                        key={s.id}
                        type="button"
                        role="tab"
                        aria-selected={activeSection === s.id}
                        className={`domain-editor-section-chip ${activeSection === s.id ? 'is-active' : ''}`}
                        onClick={() => setActiveSection(s.id)}
                    >
                        <span className="domain-editor-section-chip-icon" aria-hidden="true">{s.icon}</span>
                        <span className="domain-editor-section-chip-label">{t(s.labelKey)}</span>
                    </button>
                ))}
            </nav>

            {/* Section : Introduction */}
            <div className={`admin-fieldset domain-editor-section ${activeSection === 'intro' ? 'is-active' : ''}`} data-section="intro">
                <div className="admin-fieldset-header">
                    <span className="admin-fieldset-icon" aria-hidden="true">📝</span>
                    <div>
                        <h3 className="admin-fieldset-title">{t('admin.domainContent.sectionIntro')}</h3>
                    </div>
                </div>
                <div className="admin-fieldset-content">
                    <div className="form-group">
                        <label>{t('admin.domainContent.fieldTitle')}</label>
                        <input type="text" value={form.introduction.title} onChange={e => setIntroTitle(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>{t('admin.domainContent.fieldParagraphs')}</label>
                        {form.introduction.paragraphs.length === 0 && (
                            <div className="admin-empty-state" style={{ padding: 'var(--space-md)' }}>
                                <span className="admin-empty-state-icon" aria-hidden="true">📝</span>
                                {t('admin.domainContent.emptyParagraphs')}
                            </div>
                        )}
                        {form.introduction.paragraphs.map((p, i) => (
                            <div key={i} className="admin-row-with-remove">
                                <textarea rows={2} value={p} onChange={e => setParagraph(i, e.target.value)} />
                                <button type="button" className="btn-icon-remove" onClick={() => removeParagraph(i)} aria-label={t('admin.common.remove')}>✕</button>
                            </div>
                        ))}
                        <button type="button" className="btn-add-inline" onClick={addParagraph}>
                            + {t('admin.domainContent.addParagraph')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Section : Le saviez-vous ? */}
            <div className={`admin-fieldset domain-editor-section ${activeSection === 'dyk' ? 'is-active' : ''}`} data-section="dyk">
                <div className="admin-fieldset-header">
                    <span className="admin-fieldset-icon" aria-hidden="true">💡</span>
                    <div>
                        <h3 className="admin-fieldset-title">{t('admin.domainContent.sectionDyk')}</h3>
                    </div>
                </div>
                <div className="admin-fieldset-content">
                    {form.didYouKnow.length === 0 && (
                        <div className="admin-empty-state">
                            <span className="admin-empty-state-icon" aria-hidden="true">💡</span>
                            {t('admin.domainContent.emptyDyk')}
                        </div>
                    )}
                    {form.didYouKnow.map((item, i) => (
                        <div key={i} className="admin-card-inner">
                            <div className="admin-row-3col">
                                <div className="form-group">
                                    <label>{t('admin.domainContent.fieldIcon')}</label>
                                    <input type="text" value={item.icon || ''} onChange={e => setDyk(i, 'icon', e.target.value)} maxLength={4} />
                                </div>
                                <div className="form-group">
                                    <label>{t('admin.domainContent.fieldTitle')}</label>
                                    <input type="text" value={item.title || ''} onChange={e => setDyk(i, 'title', e.target.value)} />
                                </div>
                                <button type="button" className="btn-icon-remove" onClick={() => removeDyk(i)} aria-label={t('admin.common.remove')}>✕</button>
                            </div>
                            <div className="form-group">
                                <label>{t('admin.domainContent.fieldText')}</label>
                                <textarea rows={3} value={item.text || ''} onChange={e => setDyk(i, 'text', e.target.value)} />
                            </div>
                        </div>
                    ))}
                    <button type="button" className="btn-add-inline" onClick={addDyk}>
                        + {t('admin.domainContent.addDyk')}
                    </button>
                </div>
            </div>

            {/* Section : Exemples de phrases */}
            <div className={`admin-fieldset domain-editor-section ${activeSection === 'examples' ? 'is-active' : ''}`} data-section="examples">
                <div className="admin-fieldset-header">
                    <span className="admin-fieldset-icon" aria-hidden="true">💬</span>
                    <div>
                        <h3 className="admin-fieldset-title">{t('admin.domainContent.sectionExamples')}</h3>
                    </div>
                </div>
                <div className="admin-fieldset-content">
                    {form.exampleSentences.length === 0 && (
                        <div className="admin-empty-state">
                            <span className="admin-empty-state-icon" aria-hidden="true">💬</span>
                            {t('admin.domainContent.emptyExamples')}
                        </div>
                    )}
                    {form.exampleSentences.map((ex, i) => (
                        <div key={i} className="admin-card-inner">
                            <div className="admin-card-inner-header">
                                <strong>{t('admin.domainContent.sentenceNumber', { num: i + 1 })}</strong>
                                <button type="button" className="btn-icon-remove" onClick={() => removeExample(i)} aria-label={t('admin.common.remove')}>✕</button>
                            </div>
                            <div className="form-group">
                                <label>{t('admin.domainContent.fieldFulfulde')}</label>
                                <input type="text" value={ex.ff || ''} onChange={e => setExample(i, 'ff', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>{t('admin.domainContent.fieldTranslation', { lang: translationKey.toUpperCase() })}</label>
                                <input type="text" value={ex[translationKey] || ''} onChange={e => setExample(i, translationKey, e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>{t('admin.domainContent.fieldContext')}</label>
                                <input type="text" value={ex.context || ''} onChange={e => setExample(i, 'context', e.target.value)} />
                            </div>
                        </div>
                    ))}
                    <button type="button" className="btn-add-inline" onClick={addExample}>
                        + {t('admin.domainContent.addExample')}
                    </button>
                </div>
            </div>

            {/* Section : Methodologie */}
            <div className={`admin-fieldset domain-editor-section ${activeSection === 'method' ? 'is-active' : ''}`} data-section="method">
                <div className="admin-fieldset-header">
                    <span className="admin-fieldset-icon" aria-hidden="true">⚙️</span>
                    <div>
                        <h3 className="admin-fieldset-title">{t('admin.domainContent.sectionMethod')}</h3>
                    </div>
                </div>
                <div className="admin-fieldset-content">
                    <div className="form-group">
                        <label>{t('admin.domainContent.fieldTitle')}</label>
                        <input type="text" value={form.methodology.title} onChange={e => setMethodTitle(e.target.value)} />
                    </div>
                    {form.methodology.steps.length === 0 && (
                        <div className="admin-empty-state">
                            <span className="admin-empty-state-icon" aria-hidden="true">⚙️</span>
                            {t('admin.domainContent.emptySteps')}
                        </div>
                    )}
                    {form.methodology.steps.map((step, i) => (
                        <div key={i} className="admin-card-inner">
                            <div className="admin-row-3col">
                                <div className="form-group">
                                    <label>{t('admin.domainContent.fieldNumber')}</label>
                                    <input type="number" value={step.num ?? i + 1} onChange={e => setStep(i, 'num', e.target.value)} min={1} />
                                </div>
                                <div className="form-group">
                                    <label>{t('admin.domainContent.fieldTitle')}</label>
                                    <input type="text" value={step.title || ''} onChange={e => setStep(i, 'title', e.target.value)} />
                                </div>
                                <button type="button" className="btn-icon-remove" onClick={() => removeStep(i)} aria-label={t('admin.common.remove')}>✕</button>
                            </div>
                            <div className="form-group">
                                <label>{t('admin.domainContent.fieldDescription')}</label>
                                <textarea rows={2} value={step.desc || ''} onChange={e => setStep(i, 'desc', e.target.value)} />
                            </div>
                        </div>
                    ))}
                    <button type="button" className="btn-add-inline" onClick={addStep}>
                        + {t('admin.domainContent.addStep')}
                    </button>
                </div>
            </div>

            <div className="admin-card-footer domain-editor-footer">
                <button className="btn-save" onClick={save} disabled={saving}>
                    {saving ? <div className="btn-spinner"></div> : t('admin.common.save')}
                </button>
            </div>
        </div>
    )
}

export default DomainContentEditor
