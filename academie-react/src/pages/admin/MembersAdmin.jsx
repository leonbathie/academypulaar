import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../context/AuthContext'
import { API_URL } from '../../config'

function MembersAdmin() {
    const { t } = useTranslation()
    const { apiRequest, token } = useApi()
    const [members, setMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingMember, setEditingMember] = useState(null)
    const [activeTab, setActiveTab] = useState('fr')
    const [imagePreview, setImagePreview] = useState(null)
    const fileInputRef = useRef(null)
    const [formData, setFormData] = useState({
        name: '',
        role_fr: '',
        role_en: '',
        role_ff: '',
        specialty: '',
        bio_fr: '',
        bio_en: '',
        bio_ff: '',
        joined: '',
        facebook: '',
        twitter: '',
        linkedin: '',
        website: '',
        email: ''
    })
    const [selectedImage, setSelectedImage] = useState(null)

    useEffect(() => {
        loadMembers()
    }, [])

    const loadMembers = async () => {
        try {
            const data = await apiRequest('/members')
            setMembers(data)
        } catch (error) {
            console.error('Error loading members:', error)
        } finally {
            setLoading(false)
        }
    }

    const openModal = (member = null) => {
        if (member) {
            setEditingMember(member)
            setFormData({
                name: member.name || '',
                role_fr: member.role_fr || '',
                role_en: member.role_en || '',
                role_ff: member.role_ff || '',
                specialty: member.specialty || '',
                bio_fr: member.bio_fr || '',
                bio_en: member.bio_en || '',
                bio_ff: member.bio_ff || '',
                joined: member.joined || '',
                facebook: member.facebook || '',
                twitter: member.twitter || '',
                linkedin: member.linkedin || '',
                website: member.website || '',
                email: member.email || ''
            })
            setImagePreview(member.image ? `${API_URL}${member.image}` : null)
        } else {
            setEditingMember(null)
            setFormData({
                name: '',
                role_fr: '',
                role_en: '',
                role_ff: '',
                specialty: '',
                bio_fr: '',
                bio_en: '',
                bio_ff: '',
                joined: '',
                facebook: '',
                twitter: '',
                linkedin: '',
                website: '',
                email: ''
            })
            setImagePreview(null)
        }
        setSelectedImage(null)
        setActiveTab('fr')
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingMember(null)
        setImagePreview(null)
        setSelectedImage(null)
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setSelectedImage(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const formDataToSend = new FormData()

            // Ajouter tous les champs texte
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key])
            })

            // Ajouter l'image si sélectionnée
            if (selectedImage) {
                formDataToSend.append('image', selectedImage)
            } else if (editingMember?.image) {
                formDataToSend.append('existingImage', editingMember.image)
            }

            const url = editingMember
                ? `${API_URL}/api/members/${editingMember.id}`
                : `${API_URL}/api/members`

            const response = await fetch(url, {
                method: editingMember ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSend
            })

            if (!response.ok) {
                throw new Error(t('admin.common.errorSaving'))
            }

            closeModal()
            loadMembers()
        } catch (error) {
            alert(t('admin.common.errorPrefix') + error.message)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm(t('admin.common.confirmDeleteMember'))) return
        try {
            await apiRequest(`/members/${id}`, { method: 'DELETE' })
            loadMembers()
        } catch (error) {
            alert(t('admin.common.errorPrefix') + error.message)
        }
    }

    if (loading) {
        return <div className="admin-loading"><div className="spinner-large"></div></div>
    }

    return (
        <div>
            <div className="admin-card">
                <h2>
                    {t('admin.members.title')}
                    <button className="btn-add" onClick={() => openModal()}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        {t('admin.members.add')}
                    </button>
                </h2>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>{t('admin.members.photo')}</th>
                            <th>{t('admin.members.name')}</th>
                            <th>{t('admin.members.role')}</th>
                            <th>{t('admin.members.specialty')}</th>
                            <th>{t('admin.common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map(member => (
                            <tr key={member.id}>
                                <td>
                                    {member.image ? (
                                        <img
                                            src={`${API_URL}${member.image}`}
                                            alt={member.name}
                                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--light-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--medium-gray)' }}>
                                            👤
                                        </div>
                                    )}
                                </td>
                                <td><strong>{member.name}</strong></td>
                                <td>{member.role_fr || '-'}</td>
                                <td>{member.specialty || '-'}</td>
                                <td className="actions-cell">
                                    <button className="btn-edit" onClick={() => openModal(member)}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button className="btn-delete" onClick={() => handleDelete(member.id)}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {members.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--medium-gray)' }}>
                                    {t('admin.members.noMembers')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal modal-large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingMember ? t('admin.members.edit') : t('admin.members.add')}</h3>
                            <button className="modal-close" onClick={closeModal}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="modal-body">
                                {/* Image upload */}
                                <div className="form-group" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            width: '120px',
                                            height: '120px',
                                            borderRadius: '50%',
                                            margin: '0 auto',
                                            background: imagePreview ? `url(${imagePreview}) center/cover` : 'var(--light-gray)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            border: '3px dashed var(--medium-gray)',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        {!imagePreview && (
                                            <span style={{ color: 'var(--medium-gray)', fontSize: '2rem' }}>📷</span>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
                                    />
                                    <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--medium-gray)' }}>
                                        {t('admin.members.clickToPhoto')}
                                    </p>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('admin.members.name')} *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('admin.members.joined')}</label>
                                        <input
                                            type="text"
                                            value={formData.joined}
                                            onChange={e => setFormData({ ...formData, joined: e.target.value })}
                                            placeholder={t('admin.members.joinedPlaceholder')}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>{t('admin.members.specialty')}</label>
                                    <input
                                        type="text"
                                        value={formData.specialty}
                                        onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                                        placeholder={t('admin.members.specialtyPlaceholder')}
                                    />
                                </div>

                                {/* Réseaux sociaux et contact */}
                                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(212, 165, 55, 0.1)', borderRadius: '8px', marginBottom: '1rem' }}>
                                    <h4 style={{ marginBottom: '1rem', color: 'var(--primary-gold)', fontSize: '0.95rem' }}>📱 {t('admin.members.socialMedia')}</h4>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>📧 {t('admin.members.emailLabel')}</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="email@exemple.com"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>🌐 {t('admin.members.websiteLabel')}</label>
                                            <input
                                                type="url"
                                                value={formData.website}
                                                onChange={e => setFormData({ ...formData, website: e.target.value })}
                                                placeholder="https://exemple.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>👤 Facebook</label>
                                            <input
                                                type="url"
                                                value={formData.facebook}
                                                onChange={e => setFormData({ ...formData, facebook: e.target.value })}
                                                placeholder="https://facebook.com/..."
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>🐦 Twitter/X</label>
                                            <input
                                                type="url"
                                                value={formData.twitter}
                                                onChange={e => setFormData({ ...formData, twitter: e.target.value })}
                                                placeholder="https://twitter.com/..."
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>💼 LinkedIn</label>
                                        <input
                                            type="url"
                                            value={formData.linkedin}
                                            onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                                            placeholder="https://linkedin.com/in/..."
                                        />
                                    </div>
                                </div>

                                {/* Onglets de langues */}
                                <div className="lang-tabs">
                                    <button
                                        type="button"
                                        className={`lang-tab ${activeTab === 'fr' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('fr')}
                                    >
                                        🇫🇷 {t('admin.dictionary.translationFr')}
                                    </button>
                                    <button
                                        type="button"
                                        className={`lang-tab ${activeTab === 'en' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('en')}
                                    >
                                        🇬🇧 {t('admin.dictionary.translationEn')}
                                    </button>
                                    <button
                                        type="button"
                                        className={`lang-tab ${activeTab === 'ff' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('ff')}
                                    >
                                        SN {t('admin.dictionary.translationFf')}
                                    </button>
                                </div>

                                <div className="lang-content">
                                    {activeTab === 'fr' && (
                                        <>
                                            <div className="form-group">
                                                <label>{t('admin.members.roleLabel')} ({t('admin.common.langFr')})</label>
                                                <input
                                                    type="text"
                                                    value={formData.role_fr}
                                                    onChange={e => setFormData({ ...formData, role_fr: e.target.value })}
                                                    placeholder={t('admin.members.rolePlaceholder')}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('admin.members.bioLabel')} ({t('admin.common.langFr')})</label>
                                                <textarea
                                                    value={formData.bio_fr}
                                                    onChange={e => setFormData({ ...formData, bio_fr: e.target.value })}
                                                    rows="5"
                                                    placeholder={t('admin.members.bioPlaceholder')}
                                                />
                                            </div>
                                        </>
                                    )}
                                    {activeTab === 'en' && (
                                        <>
                                            <div className="form-group">
                                                <label>{t('admin.members.roleLabel')} ({t('admin.common.langEn')})</label>
                                                <input
                                                    type="text"
                                                    value={formData.role_en}
                                                    onChange={e => setFormData({ ...formData, role_en: e.target.value })}
                                                    placeholder={t('admin.members.rolePlaceholder')}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('admin.members.bioLabel')} ({t('admin.common.langEn')})</label>
                                                <textarea
                                                    value={formData.bio_en}
                                                    onChange={e => setFormData({ ...formData, bio_en: e.target.value })}
                                                    rows="5"
                                                    placeholder={t('admin.members.bioPlaceholder')}
                                                />
                                            </div>
                                        </>
                                    )}
                                    {activeTab === 'ff' && (
                                        <>
                                            <div className="form-group">
                                                <label>{t('admin.members.roleLabel')} ({t('admin.common.langFf')})</label>
                                                <input
                                                    type="text"
                                                    value={formData.role_ff}
                                                    onChange={e => setFormData({ ...formData, role_ff: e.target.value })}
                                                    placeholder={t('admin.members.rolePlaceholder')}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('admin.members.bioLabel')} ({t('admin.common.langFf')})</label>
                                                <textarea
                                                    value={formData.bio_ff}
                                                    onChange={e => setFormData({ ...formData, bio_ff: e.target.value })}
                                                    rows="5"
                                                    placeholder={t('admin.members.bioPlaceholder')}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={closeModal}>{t('admin.common.cancel')}</button>
                                <button type="submit" className="btn-save">
                                    {editingMember ? t('admin.common.save') : t('admin.common.add')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MembersAdmin
