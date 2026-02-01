import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../context/AuthContext'

function ContentAdmin() {
    const { t } = useTranslation()
    const { apiRequest } = useApi()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [activeTab, setActiveTab] = useState('fr')
    const [formData, setFormData] = useState({
        category: '',
        dire_fr: '',
        dire_en: '',
        dire_ff: '',
        ne_pas_dire_fr: '',
        ne_pas_dire_en: '',
        ne_pas_dire_ff: '',
        explanation_fr: '',
        explanation_en: '',
        explanation_ff: ''
    })

    useEffect(() => {
        loadItems()
    }, [])

    const loadItems = async () => {
        try {
            const data = await apiRequest('/content/dire')
            setItems(data)
        } catch (error) {
            console.error('Error loading content:', error)
        } finally {
            setLoading(false)
        }
    }

    const openModal = (item = null) => {
        if (item) {
            setEditingItem(item)
            setFormData({
                category: item.category || '',
                dire_fr: item.dire_fr || item.dire || '',
                dire_en: item.dire_en || '',
                dire_ff: item.dire_ff || '',
                ne_pas_dire_fr: item.ne_pas_dire_fr || item.ne_pas_dire || '',
                ne_pas_dire_en: item.ne_pas_dire_en || '',
                ne_pas_dire_ff: item.ne_pas_dire_ff || '',
                explanation_fr: item.explanation_fr || item.explanation || '',
                explanation_en: item.explanation_en || '',
                explanation_ff: item.explanation_ff || ''
            })
        } else {
            setEditingItem(null)
            setFormData({
                category: '',
                dire_fr: '',
                dire_en: '',
                dire_ff: '',
                ne_pas_dire_fr: '',
                ne_pas_dire_en: '',
                ne_pas_dire_ff: '',
                explanation_fr: '',
                explanation_en: '',
                explanation_ff: ''
            })
        }
        setActiveTab('fr')
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingItem(null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingItem) {
                await apiRequest(`/content/dire/${editingItem.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                })
            } else {
                await apiRequest('/content/dire', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                })
            }
            closeModal()
            loadItems()
        } catch (error) {
            alert('Erreur: ' + error.message)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Supprimer cette entrée ?')) return
        try {
            await apiRequest(`/content/dire/${id}`, { method: 'DELETE' })
            loadItems()
        } catch (error) {
            alert('Erreur: ' + error.message)
        }
    }

    if (loading) {
        return <div className="admin-loading"><div className="spinner-large"></div>{t('admin.header.loading')}</div>
    }

    return (
        <div>
            <div className="admin-card">
                <h2>
                    {t('admin.content.title')}
                    <button className="btn-add" onClick={() => openModal()}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        {t('admin.content.add')}
                    </button>
                </h2>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>{t('admin.content.dire')}</th>
                            <th>{t('admin.content.nePasDire')}</th>
                            <th>{t('admin.dictionary.category')}</th>
                            <th>{t('admin.common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id}>
                                <td style={{ color: '#22c55e' }}><strong>{item.dire_fr || item.dire}</strong></td>
                                <td style={{ color: '#ef4444' }}>{item.ne_pas_dire_fr || item.ne_pas_dire}</td>
                                <td>{item.category}</td>
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
                        {items.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--medium-gray)' }}>
                                    {t('admin.content.noContent')}
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
                            <h3>{editingItem ? t('admin.content.edit') : t('admin.content.add')}</h3>
                            <button className="modal-close" onClick={closeModal}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>{t('admin.dictionary.category')}</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="">{t('admin.common.select')}</option>
                                        <option value="Erreurs courantes">{t('admin.content.catCommon')}</option>
                                        <option value="Emprunts">{t('admin.content.catBorrowings')}</option>
                                        <option value="Usage incorrect">{t('admin.content.catIncorrect')}</option>
                                        <option value="Grammaire">{t('admin.content.catGrammar')}</option>
                                    </select>
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
                                                <label style={{ color: '#22c55e' }}>✓ {t('admin.content.weSayLabel')} (Français) *</label>
                                                <input
                                                    type="text"
                                                    value={formData.dire_fr}
                                                    onChange={e => setFormData({ ...formData, dire_fr: e.target.value })}
                                                    required
                                                    style={{ borderColor: 'rgba(34, 197, 94, 0.5)' }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label style={{ color: '#ef4444' }}>✗ {t('admin.content.weDontSayLabel')} (Français) *</label>
                                                <input
                                                    type="text"
                                                    value={formData.ne_pas_dire_fr}
                                                    onChange={e => setFormData({ ...formData, ne_pas_dire_fr: e.target.value })}
                                                    required
                                                    style={{ borderColor: 'rgba(239, 68, 68, 0.5)' }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('admin.content.explanationLabel')} (Français)</label>
                                                <textarea
                                                    value={formData.explanation_fr}
                                                    onChange={e => setFormData({ ...formData, explanation_fr: e.target.value })}
                                                    rows="3"
                                                />
                                            </div>
                                        </>
                                    )}
                                    {activeTab === 'en' && (
                                        <>
                                            <div className="form-group">
                                                <label style={{ color: '#22c55e' }}>✓ {t('admin.content.weSayLabel')} (English)</label>
                                                <input
                                                    type="text"
                                                    value={formData.dire_en}
                                                    onChange={e => setFormData({ ...formData, dire_en: e.target.value })}
                                                    style={{ borderColor: 'rgba(34, 197, 94, 0.5)' }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label style={{ color: '#ef4444' }}>✗ {t('admin.content.weDontSayLabel')} (English)</label>
                                                <input
                                                    type="text"
                                                    value={formData.ne_pas_dire_en}
                                                    onChange={e => setFormData({ ...formData, ne_pas_dire_en: e.target.value })}
                                                    style={{ borderColor: 'rgba(239, 68, 68, 0.5)' }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('admin.content.explanationLabel')} (English)</label>
                                                <textarea
                                                    value={formData.explanation_en}
                                                    onChange={e => setFormData({ ...formData, explanation_en: e.target.value })}
                                                    rows="3"
                                                />
                                            </div>
                                        </>
                                    )}
                                    {activeTab === 'ff' && (
                                        <>
                                            <div className="form-group">
                                                <label style={{ color: '#22c55e' }}>✓ {t('admin.content.weSayLabel')} (Pulaar)</label>
                                                <input
                                                    type="text"
                                                    value={formData.dire_ff}
                                                    onChange={e => setFormData({ ...formData, dire_ff: e.target.value })}
                                                    style={{ borderColor: 'rgba(34, 197, 94, 0.5)' }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label style={{ color: '#ef4444' }}>✗ {t('admin.content.weDontSayLabel')} (Pulaar)</label>
                                                <input
                                                    type="text"
                                                    value={formData.ne_pas_dire_ff}
                                                    onChange={e => setFormData({ ...formData, ne_pas_dire_ff: e.target.value })}
                                                    style={{ borderColor: 'rgba(239, 68, 68, 0.5)' }}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('admin.content.explanationLabel')} (Pulaar)</label>
                                                <textarea
                                                    value={formData.explanation_ff}
                                                    onChange={e => setFormData({ ...formData, explanation_ff: e.target.value })}
                                                    rows="3"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={closeModal}>{t('admin.common.cancel')}</button>
                                <button type="submit" className="btn-save">
                                    {editingItem ? t('admin.common.save') : t('admin.common.add')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ContentAdmin
