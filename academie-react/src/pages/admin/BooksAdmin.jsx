import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../context/AuthContext'
import { API_URL } from '../../config'

function BooksAdmin() {
    const { t } = useTranslation()
    const { apiRequest, token } = useApi()
    const [books, setBooks] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingBook, setEditingBook] = useState(null)
    const [activeTab, setActiveTab] = useState('fr')
    const [selectedFile, setSelectedFile] = useState(null)
    const fileInputRef = useRef(null)
    const [formData, setFormData] = useState({
        title_fr: '',
        title_en: '',
        title_ff: '',
        description_fr: '',
        description_en: '',
        description_ff: '',
        category: ''
    })

    useEffect(() => {
        loadBooks()
    }, [])

    const loadBooks = async () => {
        try {
            const data = await apiRequest('/books')
            setBooks(data)
        } catch (error) {
            console.error('Error loading books:', error)
        } finally {
            setLoading(false)
        }
    }

    const openModal = (book = null) => {
        if (book) {
            setEditingBook(book)
            setFormData({
                title_fr: book.title_fr || '',
                title_en: book.title_en || '',
                title_ff: book.title_ff || '',
                description_fr: book.description_fr || '',
                description_en: book.description_en || '',
                description_ff: book.description_ff || '',
                category: book.category || ''
            })
        } else {
            setEditingBook(null)
            setFormData({
                title_fr: '',
                title_en: '',
                title_ff: '',
                description_fr: '',
                description_en: '',
                description_ff: '',
                category: ''
            })
        }
        setSelectedFile(null)
        setActiveTab('fr')
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingBook(null)
        setSelectedFile(null)
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setSelectedFile(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const formDataToSend = new FormData()
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key])
            })

            if (selectedFile) {
                formDataToSend.append('file', selectedFile)
            } else if (editingBook?.file_path) {
                formDataToSend.append('existingFile', editingBook.file_path)
                formDataToSend.append('existingFileSize', editingBook.file_size)
            }

            const url = editingBook
                ? `${API_URL}/api/books/${editingBook.id}`
                : `${API_URL}/api/books`

            const response = await fetch(url, {
                method: editingBook ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSend
            })

            if (response.ok) {
                loadBooks()
                closeModal()
            } else {
                let errorMsg = 'Erreur lors de la sauvegarde'
                if (response.status === 413) {
                    errorMsg = 'Le fichier est trop volumineux (max 100 Mo)'
                } else {
                    try {
                        const error = await response.json()
                        errorMsg = error.error || errorMsg
                    } catch {
                        // Response is not JSON (e.g. Nginx HTML error page)
                    }
                }
                alert(errorMsg)
            }
        } catch (error) {
            console.error('Save book error:', error)
            alert('Erreur lors de la sauvegarde')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce livre ?')) return

        try {
            const response = await fetch(`${API_URL}/api/books/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                loadBooks()
            }
        } catch (error) {
            console.error('Delete book error:', error)
        }
    }

    const formatFileSize = (bytes) => {
        if (!bytes) return '-'
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    if (loading) {
        return <div className="admin-loading">{t('admin.header.loading')}</div>
    }

    return (
        <div className="admin-page">
            <div className="admin-header">
                <div>
                    <h1>📚 {t('admin.books.title')}</h1>
                    <p>{t('admin.dashboard.welcomeCard.text')} {t('admin.dashboard.welcomeCard.content')}</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    + {t('admin.books.add')}
                </button>
            </div>

            <div className="admin-content">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>{t('admin.books.titleLabel')}</th>
                            <th>{t('admin.dictionary.category')}</th>
                            <th>{t('admin.books.file')}</th>
                            <th>{t('admin.books.downloads')}</th>
                            <th>{t('admin.common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {books.map(book => (
                            <tr key={book.id}>
                                <td>
                                    <strong>{book.title_fr}</strong>
                                </td>
                                <td>{book.category || '-'}</td>
                                <td>{formatFileSize(book.file_size)}</td>
                                <td>{book.downloads || 0}</td>
                                <td>
                                    <button className="btn-icon" onClick={() => openModal(book)} title={t('admin.common.edit')}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button className="btn-icon btn-danger" onClick={() => handleDelete(book.id)} title={t('admin.common.delete')}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3,6 5,6 21,6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {books.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--medium-gray)' }}>
                                    {t('admin.common.noData')}
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
                            <h3>{editingBook ? t('admin.books.edit') : t('admin.books.add')}</h3>
                            <button className="modal-close" onClick={closeModal}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="modal-body">
                                <div className="form-row">
                                    {/* Fichier */}
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>📁 {t('admin.books.fileLabel')}</label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{
                                                padding: '1.5rem',
                                                borderRadius: '8px',
                                                background: 'var(--light-gray)',
                                                cursor: 'pointer',
                                                border: '2px dashed var(--medium-gray)',
                                                textAlign: 'center'
                                            }}
                                        >
                                            {selectedFile ? (
                                                <span>✅ {selectedFile.name} ({formatFileSize(selectedFile.size)})</span>
                                            ) : editingBook?.file_path ? (
                                                <span>📄 {t('admin.books.existingFile')} ({formatFileSize(editingBook.file_size)})</span>
                                            ) : (
                                                <span>{t('admin.books.clickToAddFile')}</span>
                                            )}
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.epub,.mobi,.doc,.docx"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('admin.dictionary.category')}</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="">{t('admin.common.select')}</option>
                                            <option value="roman">Roman</option>
                                            <option value="poesie">Poésie</option>
                                            <option value="essai">Essai</option>
                                            <option value="histoire">Histoire</option>
                                            <option value="linguistique">Linguistique</option>
                                            <option value="dictionnaire">Dictionnaire</option>
                                            <option value="enfants">Livres enfants</option>
                                            <option value="autre">Autre</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Onglets de langues */}
                                <div className="lang-tabs">
                                    <button type="button" className={`lang-tab ${activeTab === 'fr' ? 'active' : ''}`} onClick={() => setActiveTab('fr')}>
                                        🇫🇷 {t('admin.dictionary.translationFr')}
                                    </button>
                                    <button type="button" className={`lang-tab ${activeTab === 'en' ? 'active' : ''}`} onClick={() => setActiveTab('en')}>
                                        🇬🇧 {t('admin.dictionary.translationEn')}
                                    </button>
                                    <button type="button" className={`lang-tab ${activeTab === 'ff' ? 'active' : ''}`} onClick={() => setActiveTab('ff')}>
                                        SN {t('admin.dictionary.translationFf')}
                                    </button>
                                </div>

                                {/* Contenu FR */}
                                {activeTab === 'fr' && (
                                    <div className="lang-content">
                                        <div className="form-group">
                                            <label>Titre *</label>
                                            <input
                                                type="text"
                                                value={formData.title_fr}
                                                onChange={e => setFormData({ ...formData, title_fr: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>{t('admin.books.description')}</label>
                                            <textarea
                                                value={formData.description_fr}
                                                onChange={e => setFormData({ ...formData, description_fr: e.target.value })}
                                                rows="4"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Contenu EN */}
                                {activeTab === 'en' && (
                                    <div className="lang-content">
                                        <div className="form-group">
                                            <label>Title</label>
                                            <input
                                                type="text"
                                                value={formData.title_en}
                                                onChange={e => setFormData({ ...formData, title_en: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>{t('admin.books.description')}</label>
                                            <textarea
                                                value={formData.description_en}
                                                onChange={e => setFormData({ ...formData, description_en: e.target.value })}
                                                rows="4"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Contenu FF */}
                                {activeTab === 'ff' && (
                                    <div className="lang-content">
                                        <div className="form-group">
                                            <label>Tiitoonde</label>
                                            <input
                                                type="text"
                                                value={formData.title_ff}
                                                onChange={e => setFormData({ ...formData, title_ff: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Cifol</label>
                                            <textarea
                                                value={formData.description_ff}
                                                onChange={e => setFormData({ ...formData, description_ff: e.target.value })}
                                                rows="4"
                                            />
                                        </div>
                                    </div>
                                )}

                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    {t('admin.common.cancel')}
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingBook ? t('admin.common.save') : t('admin.common.add')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default BooksAdmin
