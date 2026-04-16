import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../context/AuthContext'
import { API_URL } from '../../config'
import ConfirmDialog from '../../components/ConfirmDialog'

function HeroAdmin() {
    const { t } = useTranslation()
    const { apiRequest, token } = useApi()
    const [slides, setSlides] = useState([])
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
        title_fr: '',
        title_en: '',
        title_ff: '',
        subtitle_fr: '',
        subtitle_en: '',
        subtitle_ff: '',
        sort_order: 0,
        published: true
    })

    useEffect(() => { loadSlides() }, [])

    const loadSlides = async () => {
        try {
            const data = await apiRequest('/hero?all=true')
            setSlides(data)
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
                title_fr: item.title_fr || '',
                title_en: item.title_en || '',
                title_ff: item.title_ff || '',
                subtitle_fr: item.subtitle_fr || '',
                subtitle_en: item.subtitle_en || '',
                subtitle_ff: item.subtitle_ff || '',
                sort_order: item.sort_order || 0,
                published: item.published !== false
            })
            setImagePreview(item.image ? `${API_URL}${item.image}` : null)
        } else {
            setEditing(null)
            setFormData({
                title_fr: '', title_en: '', title_ff: '',
                subtitle_fr: '', subtitle_en: '', subtitle_ff: '',
                sort_order: slides.length,
                published: true
            })
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

    const removeImage = () => {
        setSelectedImage(null)
        setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const fd = new FormData()
            Object.entries(formData).forEach(([k, v]) => fd.append(k, v))
            if (selectedImage) fd.append('image', selectedImage)

            const url = editing ? `${API_URL}/api/hero/${editing.id}` : `${API_URL}/api/hero`
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
            await loadSlides()
            closeModal()
        } catch (err) {
            alert('Erreur : ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = (item) => {
        const title = item.title_fr || item.title_en || `Slide #${item.id}`
        setConfirmDialog({
            open: true,
            title: 'Supprimer cette slide ?',
            message: `Supprimer "${title}" définitivement ?`,
            onConfirm: async () => {
                try {
                    await apiRequest(`/hero/${item.id}`, { method: 'DELETE' })
                    await loadSlides()
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
            fd.append('title_fr', item.title_fr || '')
            fd.append('title_en', item.title_en || '')
            fd.append('title_ff', item.title_ff || '')
            fd.append('subtitle_fr', item.subtitle_fr || '')
            fd.append('subtitle_en', item.subtitle_en || '')
            fd.append('subtitle_ff', item.subtitle_ff || '')
            fd.append('sort_order', item.sort_order || 0)
            fd.append('published', !item.published)

            const res = await fetch(`${API_URL}/api/hero/${item.id}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: fd
            })
            if (res.ok) await loadSlides()
        } catch (e) {
            console.error(e)
        }
    }

    const moveSlide = async (index, direction) => {
        const newSlides = [...slides]
        const targetIndex = index + direction
        if (targetIndex < 0 || targetIndex >= newSlides.length) return

        ;[newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]]

        const orders = newSlides.map((s, i) => ({ id: s.id, sort_order: i }))
        try {
            await apiRequest('/hero/reorder/batch', {
                method: 'PUT',
                body: JSON.stringify({ orders })
            })
            await loadSlides()
        } catch (e) {
            console.error(e)
        }
    }

    if (loading) return <div className="admin-loading">Chargement...</div>

    return (
        <div className="admin-section">
            <div className="admin-header">
                <div>
                    <h2>🎬 Slides Hero</h2>
                    <p className="admin-subtitle">Gérer les images et textes du carrousel de la page d'accueil</p>
                </div>
                <button className="btn-add" onClick={() => openModal()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                    Ajouter une slide
                </button>
            </div>

            {/* Info box */}
            <div style={{
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: 12,
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.9rem',
                color: 'var(--primary-gold, #d4af37)'
            }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20, flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>Les images de fond doivent être en haute résolution (minimum 1920×1080) pour un rendu optimal.</span>
            </div>

            <div className="admin-grid">
                {slides.length === 0 ? (
                    <div className="admin-empty" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, margin: '0 auto 1rem', opacity: 0.4 }}>
                            <rect x="2" y="2" width="20" height="20" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                        </svg>
                        <p>Aucune slide configurée. Ajoutez votre première slide !</p>
                    </div>
                ) : slides.map((s, index) => (
                    <div key={s.id} className="admin-card" style={{ position: 'relative' }}>
                        {/* Image preview */}
                        <div className="admin-card-image" style={{
                            height: 180,
                            background: s.image ? `url(${API_URL}${s.image}) center/cover` : 'linear-gradient(135deg, #1a1f3a 0%, #2a1a3a 100%)',
                            position: 'relative'
                        }}>
                            {!s.image && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 40, height: 40 }}>
                                        <rect x="2" y="2" width="20" height="20" rx="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <path d="M21 15l-5-5L5 21" />
                                    </svg>
                                </div>
                            )}
                            {/* Order badge */}
                            <span style={{
                                position: 'absolute', top: 8, left: 8,
                                background: 'rgba(0,0,0,0.6)', color: '#fff',
                                borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem',
                                fontWeight: 600
                            }}>
                                #{index + 1}
                            </span>
                            {/* Published badge */}
                            <span style={{
                                position: 'absolute', top: 8, right: 8,
                                background: s.published ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                                color: s.published ? '#22c55e' : '#ef4444',
                                borderRadius: 6, padding: '2px 8px', fontSize: '0.7rem',
                                fontWeight: 600, border: `1px solid ${s.published ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`
                            }}>
                                {s.published ? '● Publié' : '○ Brouillon'}
                            </span>
                        </div>

                        <div className="admin-card-body">
                            <h3 style={{ margin: '0 0 0.3rem', color: 'var(--primary-gold)', fontSize: '1rem' }}>
                                {s.title_fr || s.title_en || '(Sans titre)'}
                            </h3>
                            {s.subtitle_fr && (
                                <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', opacity: 0.7, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {s.subtitle_fr}
                                </p>
                            )}
                            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                {s.title_fr && <span style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--primary-gold)', borderRadius: 4, padding: '1px 6px', fontSize: '0.65rem' }}>FR</span>}
                                {s.title_en && <span style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', borderRadius: 4, padding: '1px 6px', fontSize: '0.65rem' }}>EN</span>}
                                {s.title_ff && <span style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', borderRadius: 4, padding: '1px 6px', fontSize: '0.65rem' }}>FF</span>}
                            </div>
                        </div>

                        <div className="admin-card-actions" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {/* Move buttons */}
                            <button
                                className="btn-edit"
                                onClick={() => moveSlide(index, -1)}
                                disabled={index === 0}
                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', opacity: index === 0 ? 0.4 : 1 }}
                                title="Monter"
                            >↑</button>
                            <button
                                className="btn-edit"
                                onClick={() => moveSlide(index, 1)}
                                disabled={index === slides.length - 1}
                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', opacity: index === slides.length - 1 ? 0.4 : 1 }}
                                title="Descendre"
                            >↓</button>
                            <button
                                className="btn-edit"
                                onClick={() => togglePublished(s)}
                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                                title={s.published ? 'Dépublier' : 'Publier'}
                            >
                                {s.published ? '👁️' : '👁️‍🗨️'}
                            </button>
                            <button className="btn-edit" onClick={() => openModal(s)}>Modifier</button>
                            <button className="btn-delete" onClick={() => handleDelete(s)}>Supprimer</button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
                        <div className="modal-header">
                            <h3>{editing ? 'Modifier' : 'Ajouter'} une slide Hero</h3>
                            <button className="btn-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="admin-form">
                            {/* Image upload */}
                            <div className="form-group">
                                <label>Image de fond</label>
                                {imagePreview && (
                                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
                                        <img src={imagePreview} alt="Preview" style={{
                                            maxWidth: '100%', maxHeight: 200, borderRadius: 8, display: 'block',
                                            objectFit: 'cover'
                                        }} />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            style={{
                                                position: 'absolute', top: 4, right: 4,
                                                background: 'rgba(239,68,68,0.9)', color: '#fff',
                                                border: 'none', borderRadius: '50%',
                                                width: 24, height: 24, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.8rem'
                                            }}
                                        >×</button>
                                    </div>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} />
                                <small style={{ color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                                    Recommandé : 1920×1080 minimum, format JPG/PNG/WebP
                                </small>
                            </div>

                            {/* Langue tabs */}
                            <div className="lang-tabs">
                                {['fr', 'en', 'ff'].map(lang => (
                                    <button key={lang} type="button" className={`lang-tab ${activeTab === lang ? 'active' : ''}`} onClick={() => setActiveTab(lang)}>
                                        {lang === 'fr' ? '🇫🇷 FR' : lang === 'en' ? '🇬🇧 EN' : '🏳️ FF'}
                                    </button>
                                ))}
                            </div>

                            {activeTab === 'fr' && (
                                <>
                                    <div className="form-group">
                                        <label>Titre (Français)</label>
                                        <input type="text" value={formData.title_fr} onChange={e => setFormData({ ...formData, title_fr: e.target.value })}
                                            placeholder="Ex: Préservons notre patrimoine linguistique" />
                                    </div>
                                    <div className="form-group">
                                        <label>Sous-titre (Français)</label>
                                        <textarea rows={3} value={formData.subtitle_fr} onChange={e => setFormData({ ...formData, subtitle_fr: e.target.value })}
                                            placeholder="Ex: Découvrez la richesse de la langue Pulaar..." />
                                    </div>
                                </>
                            )}
                            {activeTab === 'en' && (
                                <>
                                    <div className="form-group">
                                        <label>Title (English)</label>
                                        <input type="text" value={formData.title_en} onChange={e => setFormData({ ...formData, title_en: e.target.value })}
                                            placeholder="Ex: Preserving our linguistic heritage" />
                                    </div>
                                    <div className="form-group">
                                        <label>Subtitle (English)</label>
                                        <textarea rows={3} value={formData.subtitle_en} onChange={e => setFormData({ ...formData, subtitle_en: e.target.value })}
                                            placeholder="Ex: Discover the richness of the Pulaar language..." />
                                    </div>
                                </>
                            )}
                            {activeTab === 'ff' && (
                                <>
                                    <div className="form-group">
                                        <label>Tiitoonde (Fulfulde)</label>
                                        <input type="text" value={formData.title_ff} onChange={e => setFormData({ ...formData, title_ff: e.target.value })}
                                            placeholder="Ex: Ndeeneten ɗemngal men" />
                                    </div>
                                    <div className="form-group">
                                        <label>Les-tiitoonde (Fulfulde)</label>
                                        <textarea rows={3} value={formData.subtitle_ff} onChange={e => setFormData({ ...formData, subtitle_ff: e.target.value })}
                                            placeholder="Ex: Ƴeewee ngalu ɗemngal Pulaar..." />
                                    </div>
                                </>
                            )}

                            {/* Ordre & Publication */}
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                <div className="form-group" style={{ flex: '0 0 100px' }}>
                                    <label>Ordre</label>
                                    <input type="number" min="0" value={formData.sort_order}
                                        onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={formData.published}
                                            onChange={e => setFormData({ ...formData, published: e.target.checked })} />
                                        Publié (visible sur le site)
                                    </label>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={closeModal}>Annuler</button>
                                <button type="submit" className="btn-save" disabled={saving}>
                                    {saving ? 'Enregistrement...' : (editing ? 'Enregistrer' : 'Ajouter')}
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

export default HeroAdmin
