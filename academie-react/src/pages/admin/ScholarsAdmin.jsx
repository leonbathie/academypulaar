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
        try {
            const fd = new FormData()
            Object.entries(formData).forEach(([k, v]) => fd.append(k, v))
            if (selectedImage) fd.append('image', selectedImage)

            const url = editing ? `${API_URL}/scholars/${editing.id}` : `${API_URL}/scholars`
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
        }
    }

    const handleDelete = (item) => {
        setConfirmDialog({
            open: true,
            title: 'Supprimer ce savant ?',
            message: `Supprimer "${item.name}" définitivement ?`,
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

    if (loading) return <div className="admin-loading">Chargement...</div>

    return (
        <div className="admin-section">
            <div className="admin-header">
                <div>
                    <h2>Savants Fulɓe</h2>
                    <p className="admin-subtitle">Gérer les savants affichés sur la page d'accueil</p>
                </div>
                <button className="btn-add" onClick={() => openModal()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                    Ajouter un savant
                </button>
            </div>

            <div className="admin-grid">
                {scholars.length === 0 ? (
                    <p className="admin-empty">Aucun savant enregistré.</p>
                ) : scholars.map(s => (
                    <div key={s.id} className="admin-card">
                        <div className="admin-card-image" style={{ height: 200, background: '#1a1f3a' }}>
                            {s.image && (
                                <img
                                    src={`${API_URL}${s.image}`}
                                    alt={s.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            )}
                        </div>
                        <div className="admin-card-body">
                            <h3 style={{ margin: '0 0 0.3rem', color: 'var(--primary-gold)' }}>{s.name}</h3>
                            {s.years && <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', opacity: 0.7 }}>{s.years}</p>}
                            <p style={{ fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {s.bio_fr}
                            </p>
                            {!s.published && <span className="draft-badge">Brouillon</span>}
                        </div>
                        <div className="admin-card-actions">
                            <button className="btn-edit" onClick={() => openModal(s)}>Modifier</button>
                            <button className="btn-delete" onClick={() => handleDelete(s)}>Supprimer</button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editing ? 'Modifier' : 'Ajouter'} un savant</h3>
                            <button className="btn-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="admin-form">
                            <div className="form-group">
                                <label>Photo</label>
                                {imagePreview && (
                                    <img src={imagePreview} alt="Preview" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8, marginBottom: 8, display: 'block' }} />
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} />
                            </div>
                            <div className="form-group">
                                <label>Nom *</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Années (ex: 1797 – 1864)</label>
                                <input type="text" value={formData.years} onChange={e => setFormData({ ...formData, years: e.target.value })} />
                            </div>

                            <div className="lang-tabs">
                                {['fr', 'en', 'ff'].map(lang => (
                                    <button key={lang} type="button" className={`lang-tab ${activeTab === lang ? 'active' : ''}`} onClick={() => setActiveTab(lang)}>
                                        {lang.toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            {activeTab === 'fr' && (
                                <div className="form-group">
                                    <label>Biographie (Français)</label>
                                    <textarea rows={6} value={formData.bio_fr} onChange={e => setFormData({ ...formData, bio_fr: e.target.value })} />
                                </div>
                            )}
                            {activeTab === 'en' && (
                                <div className="form-group">
                                    <label>Biography (English)</label>
                                    <textarea rows={6} value={formData.bio_en} onChange={e => setFormData({ ...formData, bio_en: e.target.value })} />
                                </div>
                            )}
                            {activeTab === 'ff' && (
                                <div className="form-group">
                                    <label>Daartol (Fulfulde)</label>
                                    <textarea rows={6} value={formData.bio_ff} onChange={e => setFormData({ ...formData, bio_ff: e.target.value })} />
                                </div>
                            )}

                            <div className="form-group">
                                <label>
                                    <input type="checkbox" checked={formData.published} onChange={e => setFormData({ ...formData, published: e.target.checked })} />
                                    {' '}Publié (visible sur le site)
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={closeModal}>Annuler</button>
                                <button type="submit" className="btn-save">{editing ? 'Enregistrer' : 'Ajouter'}</button>
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
