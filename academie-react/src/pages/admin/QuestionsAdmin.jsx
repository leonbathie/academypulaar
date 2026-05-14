import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../context/AuthContext'
import ConfirmDialog from '../../components/ConfirmDialog'

function QuestionsAdmin() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language || 'fr'
    const { apiRequest } = useApi()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null })
    const closeConfirm = useCallback(() => setConfirmDialog(prev => ({ ...prev, open: false })), [])
    const [showModal, setShowModal] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [activeTab, setActiveTab] = useState('fr')
    const [formData, setFormData] = useState({
        question_fr: '',
        question_en: '',
        question_ff: '',
        answer_fr: '',
        answer_en: '',
        answer_ff: '',
        sort_order: 0
    })

    useEffect(() => {
        loadItems()
    }, [])

    const loadItems = async () => {
        try {
            const data = await apiRequest('/questions')
            setItems(data)
        } catch (error) {
            console.error('Error loading questions:', error)
        } finally {
            setLoading(false)
        }
    }

    const openModal = (item = null) => {
        if (item) {
            setEditingItem(item)
            setFormData({
                question_fr: item.question_fr || '',
                question_en: item.question_en || '',
                question_ff: item.question_ff || '',
                answer_fr: item.answer_fr || '',
                answer_en: item.answer_en || '',
                answer_ff: item.answer_ff || '',
                sort_order: item.sort_order || 0
            })
        } else {
            setEditingItem(null)
            setFormData({
                question_fr: '',
                question_en: '',
                question_ff: '',
                answer_fr: '',
                answer_en: '',
                answer_ff: '',
                sort_order: items.length + 1
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
                await apiRequest(`/questions/${editingItem.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                })
            } else {
                await apiRequest('/questions', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                })
            }
            closeModal()
            loadItems()
        } catch (error) {
            alert(t('admin.common.errorPrefix') + error.message)
        }
    }

    const handleDelete = (id) => {
        setConfirmDialog({
            open: true,
            title: t('admin.common.confirmDeleteTitle', 'Confirmer la suppression'),
            message: t('admin.common.confirmDeleteQuestion'),
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, open: false }))
                try {
                    await apiRequest(`/questions/${id}`, { method: 'DELETE' })
                    loadItems()
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
            <div className="admin-header">
                <h1>{t('admin.questions.title')}</h1>
                <button className="btn-primary" onClick={() => openModal()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {t('admin.questions.add')}
                </button>
            </div>

            <div className="admin-card">
                <table className="admin-table modern">
                    <thead>
                        <tr>
                            <th style={{ width: '5%' }}>#</th>
                            <th style={{ width: '35%' }}>{t('admin.questions.questionLabel').toUpperCase()}</th>
                            <th style={{ width: '45%' }}>{t('admin.questions.answerLabel').toUpperCase()}</th>
                            <th style={{ width: '15%' }}>{t('admin.common.actions').toUpperCase()}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={item.id}>
                                <td>{item.sort_order || index + 1}</td>
                                <td>{item[`question_${lang}`] || item.question_fr}</td>
                                <td>
                                    <span className="truncate-text">
                                        {item[`answer_${lang}`] || item.answer_fr}
                                    </span>
                                </td>
                                <td className="actions-cell">
                                    <button className="btn-icon btn-edit" onClick={() => openModal(item)}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button className="btn-icon btn-delete" onClick={() => handleDelete(item.id)}>
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
                                <td colSpan="4" className="no-data-cell">
                                    {t('admin.questions.noQuestions')}
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
                            <h3>{editingItem ? t('admin.questions.edit') : t('admin.questions.add')}</h3>
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
                                    <label>{t('admin.questions.orderLabel')}</label>
                                    <input
                                        type="number"
                                        value={formData.sort_order}
                                        onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                                        min="0"
                                        style={{ width: '100px' }}
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
                                                <label>{t('admin.questions.questionLabel')} ({t('admin.common.langFr')}) *</label>
                                                <input
                                                    type="text"
                                                    value={formData.question_fr}
                                                    onChange={e => setFormData({ ...formData, question_fr: e.target.value })}
                                                    required
                                                    placeholder={t('admin.questions.questionPlaceholder')}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('admin.questions.answerLabel')} ({t('admin.common.langFr')}) *</label>
                                                <textarea
                                                    value={formData.answer_fr}
                                                    onChange={e => setFormData({ ...formData, answer_fr: e.target.value })}
                                                    required
                                                    rows="5"
                                                    placeholder={t('admin.questions.answerPlaceholder')}
                                                />
                                            </div>
                                        </>
                                    )}
                                    {activeTab === 'en' && (
                                        <>
                                            <div className="form-group">
                                                <label>{t('admin.questions.questionLabel')} ({t('admin.common.langEn')})</label>
                                                <input
                                                    type="text"
                                                    value={formData.question_en}
                                                    onChange={e => setFormData({ ...formData, question_en: e.target.value })}
                                                    placeholder={t('admin.questions.questionPlaceholder')}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('admin.questions.answerLabel')} ({t('admin.common.langEn')})</label>
                                                <textarea
                                                    value={formData.answer_en}
                                                    onChange={e => setFormData({ ...formData, answer_en: e.target.value })}
                                                    rows="5"
                                                    placeholder={t('admin.questions.answerPlaceholder')}
                                                />
                                            </div>
                                        </>
                                    )}
                                    {activeTab === 'ff' && (
                                        <>
                                            <div className="form-group">
                                                <label>{t('admin.questions.questionLabel')} ({t('admin.common.langFf')})</label>
                                                <input
                                                    type="text"
                                                    value={formData.question_ff}
                                                    onChange={e => setFormData({ ...formData, question_ff: e.target.value })}
                                                    placeholder={t('admin.questions.questionPlaceholder')}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{t('admin.questions.answerLabel')} ({t('admin.common.langFf')})</label>
                                                <textarea
                                                    value={formData.answer_ff}
                                                    onChange={e => setFormData({ ...formData, answer_ff: e.target.value })}
                                                    rows="5"
                                                    placeholder={t('admin.questions.answerPlaceholder')}
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

export default QuestionsAdmin
