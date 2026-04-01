import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../context/AuthContext'
import { API_URL } from '../../config'
import ConfirmDialog from '../../components/ConfirmDialog'

function NewsAdmin() {
    const { t, i18n } = useTranslation()
    const { apiRequest, token } = useApi()
    const [news, setNews] = useState([])
    const [loading, setLoading] = useState(true)
    const [visibleCount, setVisibleCount] = useState(5)
    const [showModal, setShowModal] = useState(false)
    const [editingNews, setEditingNews] = useState(null)
    const [activeTab, setActiveTab] = useState('fr')
    const [imagePreview, setImagePreview] = useState(null)
    const [selectedImage, setSelectedImage] = useState(null)
    const fileInputRef = useRef(null)
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null })
    const closeConfirm = useCallback(() => setConfirmDialog(prev => ({ ...prev, open: false })), [])
    const [formData, setFormData] = useState({
        title_fr: '',
        title_en: '',
        title_ff: '',
        excerpt_fr: '',
        excerpt_en: '',
        excerpt_ff: '',
        content_fr: '',
        content_en: '',
        content_ff: '',
        category: '',
        type: '',
        date: '',
        published: true,
        link: '',
        contact_email: '',
        contact_phone: ''
    })

    useEffect(() => {
        loadNews()
    }, [])

    const loadNews = async () => {
        try {
            const data = await apiRequest('/news')
            setNews(data)
        } catch (error) {
            console.error('Error loading news:', error)
        } finally {
            setLoading(false)
        }
    }

    const openModal = (item = null) => {
        if (item) {
            setEditingNews(item)
            setFormData({
                title_fr: item.title_fr || item.title || '',
                title_en: item.title_en || '',
                title_ff: item.title_ff || '',
                excerpt_fr: item.excerpt_fr || item.excerpt || '',
                excerpt_en: item.excerpt_en || '',
                excerpt_ff: item.excerpt_ff || '',
                content_fr: item.content_fr || item.content || '',
                content_en: item.content_en || '',
                content_ff: item.content_ff || '',
                category: item.category || '',
                type: item.type || '',
                date: item.date ? item.date.split('T')[0] : '',
                published: item.published !== false,
                link: item.link || '',
                contact_email: item.contact_email || '',
                contact_phone: item.contact_phone || ''
            })
            setImagePreview(item.image ? `${API_URL}${item.image}` : null)
        } else {
            setEditingNews(null)
            setFormData({
                title_fr: '',
                title_en: '',
                title_ff: '',
                excerpt_fr: '',
                excerpt_en: '',
                excerpt_ff: '',
                content_fr: '',
                content_en: '',
                content_ff: '',
                category: '',
                type: '',
                date: new Date().toISOString().split('T')[0],
                published: true,
                link: '',
                contact_email: '',
                contact_phone: ''
            })
            setImagePreview(null)
        }
        setSelectedImage(null)
        setActiveTab('fr')
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingNews(null)
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
            } else if (editingNews?.image) {
                formDataToSend.append('existingImage', editingNews.image)
            }

            const url = editingNews
                ? `${API_URL}/api/news/${editingNews.id}`
                : `${API_URL}/api/news`

            const response = await fetch(url, {
                method: editingNews ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSend
            })

            if (!response.ok) {
                throw new Error(t('admin.common.errorSaving'))
            }

            closeModal()
            loadNews()
        } catch (error) {
            alert(t('admin.common.errorPrefix') + error.message)
        }
    }

    const handleDelete = (id) => {
        setConfirmDialog({
            open: true,
            title: t('admin.common.confirmDeleteTitle', 'Confirmer la suppression'),
            message: t('admin.common.confirmDeleteNews'),
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, open: false }))
                try {
                    await apiRequest(`/news/${id}`, { method: 'DELETE' })
                    loadNews()
                } catch (error) {
                    alert(t('admin.common.errorPrefix') + error.message)
                }
            }
        })
    }

    if (loading) {
        return <div className="admin-loading"><div className="spinner-large"></div>{t('admin.header.loading')}</div>
    }

    return (
        <div>
            <div className="admin-card">
                <h2>
                    {t('admin.news.title')}
                    <button className="btn-add" onClick={() => openModal()}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        {t('admin.news.add')}
                    </button>
                </h2>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>{t('admin.news.image')}</th>
                            <th>{t('admin.news.titleLabel')}</th>
                            <th>{t('admin.news.category')}</th>
                            <th>{t('admin.news.date')}</th>
                            <th>{t('admin.common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {news.slice(0, visibleCount).map(item => (
                            <tr key={item.id}>
                                <td>
                                    {item.image ? (
                                        <img
                                            src={`${API_URL}${item.image}`}
                                            alt={item.title_fr || item.title}
                                            style={{ width: '60px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{ width: '60px', height: '40px', borderRadius: '4px', background: 'var(--light-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--medium-gray)' }}>
                                            📰
                                        </div>
                                    )}
                                </td>
                                <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><strong>{item.title_fr || item.title}</strong></td>
                                <td>{item.category}</td>
                                <td>{item.date ? new Date(item.date).toLocaleDateString(i18n.language === 'ff' ? 'fr-FR' : i18n.language) : '-'}</td>
                                <td className="actions-cell">
                                    <button className="btn-edit" onClick={() => openModal(item)}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button className="btn-delete" onClick={() => handleDelete(item.id)}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {news.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--medium-gray)' }}>
                                    {t('admin.news.noNews')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {news.length > visibleCount && (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <button
                            className="btn-add"
                            onClick={() => setVisibleCount(prev => prev + 5)}
                            style={{ margin: '0 auto' }}
                        >
                            {t('admin.common.seeMore', 'Voir plus')} ({visibleCount}/{news.length})
                        </button>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal modal-large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingNews ? t('admin.news.edit') : t('admin.news.add')}</h3>
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
                                <div className="form-group">
                                    <label>{t('admin.news.coverLabel')}</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            width: '100%',
                                            height: '150px',
                                            borderRadius: '8px',
                                            background: imagePreview ? `url(${imagePreview}) center/cover` : 'var(--light-gray)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            border: '2px dashed var(--medium-gray)',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        {!imagePreview && (
                                            <div style={{ textAlign: 'center', color: 'var(--medium-gray)' }}>
                                                <span style={{ fontSize: '2rem', display: 'block' }}>🖼️</span>
                                                <span>{t('admin.news.clickToAddImage')}</span>
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
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('admin.news.category')}</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="">{t('admin.common.select')}</option>
                                            <option value="language">{t('news.language')}</option>
                                            <option value="publication">{t('news.publication')}</option>
                                            <option value="event">{t('news.event')}</option>
                                            <option value="general">{t('news.general')}</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>{t('admin.news.date')}</label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Liens et contact */}
                                <div className="form-group">
                                    <label>🔗 {t('admin.news.redirectLink')}</label>
                                    <input
                                        type="url"
                                        value={formData.link}
                                        onChange={e => setFormData({ ...formData, link: e.target.value })}
                                        placeholder="https://..."
                                    />
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
                                        En {t('admin.dictionary.translationEn')}
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
                                                <label>{t('admin.news.titleLabel')} ({t('admin.common.langFr')}) *</label>
                                                <input
                                                    type="text"
                                                    value={formData.title_fr}
                                                    onChange={e => setFormData({ ...formData, title_fr: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('admin.news.excerpt')} ({t('admin.common.langFr')})</label>
                                                <textarea
                                                    value={formData.excerpt_fr}
                                                    onChange={e => setFormData({ ...formData, excerpt_fr: e.target.value })}
                                                    rows="2"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('admin.news.content')} ({t('admin.common.langFr')})</label>
                                                <textarea
                                                    value={formData.content_fr}
                                                    onChange={e => setFormData({ ...formData, content_fr: e.target.value })}
                                                    rows="5"
                                                />
                                            </div>
                                        </>
                                    )}
                                    {activeTab === 'en' && (
                                        <>
                                            <div className="form-group">
                                                <label>{t('admin.news.titleLabel')} ({t('admin.common.langEn')})</label>
                                                <input
                                                    type="text"
                                                    value={formData.title_en}
                                                    onChange={e => setFormData({ ...formData, title_en: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('admin.news.excerpt')} ({t('admin.common.langEn')})</label>
                                                <textarea
                                                    value={formData.excerpt_en}
                                                    onChange={e => setFormData({ ...formData, excerpt_en: e.target.value })}
                                                    rows="2"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('admin.news.content')} ({t('admin.common.langEn')})</label>
                                                <textarea
                                                    value={formData.content_en}
                                                    onChange={e => setFormData({ ...formData, content_en: e.target.value })}
                                                    rows="5"
                                                />
                                            </div>
                                        </>
                                    )}
                                    {activeTab === 'ff' && (
                                        <>
                                            <div className="form-group">
                                                <label>{t('admin.news.titleLabel')} ({t('admin.common.langFf')})</label>
                                                <input
                                                    type="text"
                                                    value={formData.title_ff}
                                                    onChange={e => setFormData({ ...formData, title_ff: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('admin.news.excerpt')} ({t('admin.common.langFf')})</label>
                                                <textarea
                                                    value={formData.excerpt_ff}
                                                    onChange={e => setFormData({ ...formData, excerpt_ff: e.target.value })}
                                                    rows="2"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('admin.news.content')} ({t('admin.common.langFf')})</label>
                                                <textarea
                                                    value={formData.content_ff}
                                                    onChange={e => setFormData({ ...formData, content_ff: e.target.value })}
                                                    rows="5"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.published}
                                            onChange={e => setFormData({ ...formData, published: e.target.checked })}
                                            style={{ width: 'auto' }}
                                        />
                                        {t('admin.news.publishNow')}
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={closeModal}>{t('admin.common.cancel')}</button>
                                <button type="submit" className="btn-save">
                                    {editingNews ? t('admin.common.save') : t('admin.common.add')}
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
                confirmText={t('admin.common.delete', 'Supprimer')}
            />
        </div>
    )
}

export default NewsAdmin
