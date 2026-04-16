import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../context/AuthContext'
import { API_URL } from '../../config'
import ConfirmDialog from '../../components/ConfirmDialog'

function ScholarsAdmin() {
    const { t } = useTranslation()
    const { apiRequest, token } = useApi()
    const [scholars, setScholars] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState(null)
    const [activeTab, setActiveTab] = useState('fr')
    const [imagePreview, setImagePreview] = useState(null)
    const [selectedImage, setSelectedImage] = useState(null)
    const [saving, setSaving] = useState(false)
    const fileInputRef = useRef(null)
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null })
    const closeConfirm = useCallback(() => setConfirmDialog(prev => ({ ...prev, open: false })), [])
    const [formData, setFormData] = useState({
        name: '',
        years: '',
        bio_fr: '',
        bio_en: '',
        bio_ff: '',
        published: true
    })

    useEffect(() => { loadScholars() }, [])

    const loadScholars = async () => {
        try {
            const data = await apiRequest('/scholars?all=true')
            setScholars(data)
        } catch (e) {
            console.error('Load error:', e)
        } finally {
            setLoading(false)
        }
    }

    const openModal = (item = null) => {
        if (item) {
            setEditing(item)
            setFormData({
                name: item.name || '',
                years: item.years || '',
                bio_fr: item.bio_fr || '',
                bio_en: item.bio_en || '',
                bio_ff: item.bio_ff || '',
                published: item.published !== false
            })
            setImagePreview(item.image ? `${API_URL}${item.image}` : null)
        } else {
            setEditing(null)
            setFormData({ name: '', years: '', bio_fr: '', bio_en: '', bio_ff: '', published: true })
            setImagePreview(null)
        }
        setSelectedImage(null)
        setActiveTab('fr')
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditing(null)
        setImagePreview(null)
        setSelectedImage(null)
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setSelectedImage(file)
        const reader = new FileReader()
        reader.onloadend = () => setImagePreview(reader.result)
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const fd = new FormData()
            Object.entries(formData).forEach(([k, v]) => fd.append(k, v))
            if (selectedImage) fd.append('image', selectedImage)

            const url = editing ? `${API_URL}/api/scholars/${editing.id}` : `${API_URL}/api/scholars`
            const method = editing ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}` },
                body: fd
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Erreur' }))
                throw new Error(err.error || 'Erreur serveur')
            }
            await loadScholars()
            closeModal()
        } catch (err) {
            alert('Erreur : ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = (item) => {
        setConfirmDialog({
            open: true,
            title: t('admin.scholars.confirmDelete'),
            message: t('admin.scholars.confirmDeleteMessage', { name: item.name }),
            onConfirm: async () => {
                try {
                    await apiRequest(`/scholars/${item.id}`, { method: 'DELETE' })
                    await loadScholars()
                } catch (e) {
                    alert('Erreur : ' + e.message)
                }
                closeConfirm()
            }
        })
    }

    const togglePublished = async (item) => {
        try {
            const fd = new FormData()
            fd.append('name', item.name)
            fd.append('years', item.years || '')
            fd.append('bio_fr', item.bio_fr || '')
            fd.append('bio_en', item.bio_en || '')
            fd.append('bio_ff', item.bio_ff || '')
            fd.append('published', !item.published)
            const res = await fetch(`${API_URL}/api/scholars/${item.id}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: fd
            })
            if (res.ok) await loadScholars()
        } catch (e) {
            console.error(e)
        }
    }

    if (loading) return <div className="admin-loading">{t('admin.header.loading')}</div>

    return (
        <div className="admin-page">
            <div className="admin-card-header-actions">
                <div>
                    <h2>{t('admin.scholars.title')}</h2>
                    <p style={{ color: 'var(--medium-gray)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        {t('admin.scholars.subtitle')}
                    </p>
                </div>
                <button className="btn-add" onClick={() => openModal()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    {t('admin.scholars.add')}
                </button>
            </div>

            <div className="admin-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ width: 60 }}>{t('admin.scholars.photoLabel')}</th>
                            <th>{t('admin.scholars.nameLabel')}</th>
                            <th>{t('admin.scholars.yearsLabel')}</th>
                            <th>{t('admin.scholars.bioPreview')}</th>
                            <th style={{ width: 90 }}>{t('admin.scholars.status')}</th>
                            <th style={{ width: 100 }}>{t('admin.common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scholars.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--medium-gray)' }}>
                                    {t('admin.scholars.noScholars')}
                                </td>
                            </tr>
                        ) : scholars.map(s => (
                            <tr key={s.id}>
                                <td>
                                    {s.image ? (
                                        <img
                                            src={`${API_URL}${s.image}`}
                                            alt={s.name}
                                            style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', display: 'block' }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: 44, height: 44, borderRadius: 8,
                                            background: 'var(--light-gray)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                style={{ width: 20, height: 20, color: 'var(--medium-gray)' }}>
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                        </div>
                                    )}
                                </td>
                                <td><strong>{s.name}</strong></td>
                                <td style={{ color: 'var(--medium-gray)', fontSize: '0.9rem' }}>{s.years || '—'}</td>
                                <td className="td-truncate" style={{ maxWidth: 240 }}>
                                    {s.bio_fr || <span style={{ color: 'var(--medium-gray)' }}>—</span>}
                                </td>
                                <td>
                                    <button
                                        onClick={() => togglePublished(s)}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                            padding: '3px 10px', borderRadius: 20, border: 'none',
                                            fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                                            background: s.published ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                                            color: s.published ? '#16a34a' : '#dc2626'
                                        }}
                                        title={s.published ? t('admin.scholars.unpublish') : t('admin.scholars.publish')}
                                    >
                                        {s.published ? `● ${t('admin.scholars.published')}` : `○ ${t('admin.scholars.draft')}`}
                                    </button>
                                </td>
                                <td>
                                    <div className="actions-cell">
                                        <button className="btn-icon" onClick={() => openModal(s)} title={t('admin.common.edit')}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                        </button>
                                        <button className="btn-icon btn-danger" onClick={() => handleDelete(s)} title={t('admin.common.delete')}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editing ? t('admin.scholars.edit') : t('admin.scholars.add')}</h3>
                            <button className="modal-close" onClick={closeModal}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="modal-body">
                                {/* Photo */}
                                <div className="form-group">
                                    <label>{t('admin.scholars.photoLabel')}</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            width: '100%', height: 160, borderRadius: 8, cursor: 'pointer',
                                            border: '2px dashed var(--medium-gray)',
                                            background: imagePreview ? `url(${imagePreview}) center/cover` : 'var(--light-gray)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: imagePreview ? 'transparent' : 'var(--medium-gray)',
                                            transition: 'border-color 0.2s',
                                            position: 'relative', overflow: 'hidden'
                                        }}
                                    >
                                        {!imagePreview && (
                                            <div style={{ textAlign: 'center' }}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                    style={{ width: 32, height: 32, marginBottom: 8 }}>
                                                    <rect x="2" y="2" width="20" height="20" rx="2" />
                                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                                    <path d="M21 15l-5-5L5 21" />
                                                </svg>
                                                <p style={{ fontSize: '0.85rem' }}>{t('admin.scholars.clickToAddPhoto')}</p>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
                                    />
                                    {imagePreview && (
                                        <button
                                            type="button"
                                            onClick={() => { setImagePreview(null); setSelectedImage(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                                            style={{
                                                marginTop: 6, padding: '4px 12px', borderRadius: 6, border: 'none',
                                                background: 'rgba(239,68,68,0.1)', color: '#dc2626',
                                                fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600
                                            }}
                                        >
                                            {t('admin.scholars.removePhoto')}
                                        </button>
                                    )}
                                </div>

                                {/* Nom + Années */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('admin.scholars.nameRequired')}</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder={t('admin.scholars.namePlaceholder')}
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('admin.scholars.yearsLabel')}</label>
                                        <input
                                            type="text"
                                            placeholder={t('admin.scholars.yearsPlaceholder')}
                                            value={formData.years}
                                            onChange={e => setFormData({ ...formData, years: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Biographies */}
                                <div className="lang-tabs">
                                    {['fr', 'en', 'ff'].map(lang => (
                                        <button
                                            key={lang}
                                            type="button"
                                            className={`lang-tab ${activeTab === lang ? 'active' : ''}`}
                                            onClick={() => setActiveTab(lang)}
                                        >
                                            {lang === 'fr' ? '🇫🇷 FR' : lang === 'en' ? '🇬🇧 EN' : '🏳️ FF'}
                                        </button>
                                    ))}
                                </div>

                                {activeTab === 'fr' && (
                                    <div className="form-group">
                                        <label>{t('admin.scholars.bioFr')}</label>
                                        <textarea
                                            rows={5}
                                            placeholder={t('admin.scholars.bioFrPlaceholder')}
                                            value={formData.bio_fr}
                                            onChange={e => setFormData({ ...formData, bio_fr: e.target.value })}
                                        />
                                    </div>
                                )}
                                {activeTab === 'en' && (
                                    <div className="form-group">
                                        <label>{t('admin.scholars.bioEn')}</label>
                                        <textarea
                                            rows={5}
                                            placeholder={t('admin.scholars.bioEnPlaceholder')}
                                            value={formData.bio_en}
                                            onChange={e => setFormData({ ...formData, bio_en: e.target.value })}
                                        />
                                    </div>
                                )}
                                {activeTab === 'ff' && (
                                    <div className="form-group">
                                        <label>{t('admin.scholars.bioFf')}</label>
                                        <textarea
                                            rows={5}
                                            placeholder={t('admin.scholars.bioFfPlaceholder')}
                                            value={formData.bio_ff}
                                            onChange={e => setFormData({ ...formData, bio_ff: e.target.value })}
                                        />
                                    </div>
                                )}

                                {/* Publication */}
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'normal' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.published}
                                            onChange={e => setFormData({ ...formData, published: e.target.checked })}
                                            style={{ width: 'auto' }}
                                        />
                                        {t('admin.scholars.publishedLabel')}
                                    </label>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={closeModal}>{t('admin.common.cancel')}</button>
                                <button type="submit" className="btn-save" disabled={saving}>
                                    {saving ? t('admin.header.loading') : (editing ? t('admin.common.save') : t('admin.scholars.add'))}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={closeConfirm}
            />
        </div>
    )
}

export default ScholarsAdmin
