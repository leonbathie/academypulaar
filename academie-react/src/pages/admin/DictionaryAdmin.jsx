import { useState, useEffect, useRef, Fragment, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi, useAuth } from '../../context/AuthContext'
import { API_URL } from '../../config'
import ConfirmDialog from '../../components/ConfirmDialog'

function DictionaryAdmin() {
    const { t, i18n } = useTranslation()
    const { apiRequest, token } = useApi()
    const { isSuperAdmin, isAdmin } = useAuth()

    // Map stored domain values to i18n keys
    const domainKeyMap = {
        scientifique: 'admin.dictionary.domScience',
        mathematiques: 'admin.dictionary.domMath',
        biologie: 'admin.dictionary.domBio',
        philosophie: 'admin.dictionary.domPhilo',
        economie: 'admin.dictionary.domEco',
        droit: 'admin.dictionary.domDroit',
        astronomie: 'admin.dictionary.domAstro',
        informatique: 'admin.dictionary.domInfo',
        botanique: 'admin.dictionary.domBota',
        vivants: 'admin.dictionary.domVivants',
        elevage: 'admin.dictionary.domElevage',
        agriculture: 'admin.dictionary.domAgri',
        peche: 'admin.dictionary.domPeche',
        forge: 'admin.dictionary.domForge',
        dictionnaire: 'admin.dictionary.domDict'
    }
    const [words, setWords] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterDomain, setFilterDomain] = useState('')
    const [expandedIds, setExpandedIds] = useState(new Set())
    const [showModal, setShowModal] = useState(false)
    const [editingWord, setEditingWord] = useState(null)
    const [activeTab, setActiveTab] = useState('fr')
    const [formData, setFormData] = useState({
        word: '',
        translation_fr: '',
        translation_en: '',
        translation_ff: '',
        category: '',
        domain: '',
        example: '',
        example_translation: ''
    })

    // Audio recording states
    const [isRecordingWord, setIsRecordingWord] = useState(false)
    const [isRecordingExample, setIsRecordingExample] = useState(false)
    const [audioWordBlob, setAudioWordBlob] = useState(null)
    const [audioExampleBlob, setAudioExampleBlob] = useState(null)
    const [audioWordUrl, setAudioWordUrl] = useState(null)
    const [audioExampleUrl, setAudioExampleUrl] = useState(null)
    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])

    // Bulk selection states
    const [selectedIds, setSelectedIds] = useState(new Set())
    const [bulkDeleting, setBulkDeleting] = useState(false)

    // PDF import states
    const [showPdfModal, setShowPdfModal] = useState(false)
    const [pdfFile, setPdfFile] = useState(null)
    const [pdfDomain, setPdfDomain] = useState('')
    const [pdfPreview, setPdfPreview] = useState(null)
    const [pdfImporting, setPdfImporting] = useState(false)
    const [pdfPreviewing, setPdfPreviewing] = useState(false)
    const [pdfResult, setPdfResult] = useState(null)
    const pdfInputRef = useRef(null)
    // Delete requests (double validation super-admin)
    const [deleteRequests, setDeleteRequests] = useState([])
    const [showDeleteRequests, setShowDeleteRequests] = useState(false)

    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null })
    const closeConfirm = useCallback(() => setConfirmDialog(prev => ({ ...prev, open: false })), [])

    useEffect(() => {
        loadWords()
        if (isAdmin) loadDeleteRequests()
    }, [])

    const loadWords = async () => {
        try {
            const data = await apiRequest('/dictionary')
            setWords(data)
        } catch (error) {
            console.error('Error loading words:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadDeleteRequests = async () => {
        try {
            const data = await apiRequest('/dictionary/delete-requests')
            setDeleteRequests(data)
        } catch (error) {
            console.error('Error loading delete requests:', error)
        }
    }

    const openModal = (word = null) => {
        if (word) {
            setEditingWord(word)
            setFormData({
                word: word.word || '',
                translation_fr: word.translation_fr || '',
                translation_en: word.translation_en || '',
                translation_ff: word.translation_ff || '',
                category: word.category || '',
                domain: word.domain || '',
                example: word.example || '',
                example_translation: word.example_translation || ''
            })
            // Set existing audio URLs
            setAudioWordUrl(word.audio_word ? `${API_URL}${word.audio_word}` : null)
            setAudioExampleUrl(word.audio_example ? `${API_URL}${word.audio_example}` : null)
        } else {
            setEditingWord(null)
            setFormData({
                word: '',
                translation_fr: '',
                translation_en: '',
                translation_ff: '',
                category: '',
                domain: '',
                example: '',
                example_translation: ''
            })
            setAudioWordUrl(null)
            setAudioExampleUrl(null)
        }
        setAudioWordBlob(null)
        setAudioExampleBlob(null)
        setActiveTab('fr')
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingWord(null)
        stopRecording()
    }

    // Audio Recording Functions
    const startRecording = async (type) => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert(t('admin.common.micRestricted'))
                return
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' })
            audioChunksRef.current = []

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                const audioUrl = URL.createObjectURL(audioBlob)

                if (type === 'word') {
                    setAudioWordBlob(audioBlob)
                    setAudioWordUrl(audioUrl)
                } else {
                    setAudioExampleBlob(audioBlob)
                    setAudioExampleUrl(audioUrl)
                }

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorderRef.current.start()

            if (type === 'word') {
                setIsRecordingWord(true)
            } else {
                setIsRecordingExample(true)
            }
        } catch (error) {
            console.error('Error accessing microphone:', error)
            alert(t('admin.common.micPermission'))
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
        setIsRecordingWord(false)
        setIsRecordingExample(false)
    }

    const deleteAudio = (type) => {
        if (type === 'word') {
            setAudioWordBlob(null)
            setAudioWordUrl(null)
        } else {
            setAudioExampleBlob(null)
            setAudioExampleUrl(null)
        }
    }

    const [isSubmitting, setIsSubmitting] = useState(false)
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (isSubmitting) return

        setIsSubmitting(true)
        try {
            const formDataToSend = new FormData()

            // Add text fields
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key])
            })

            // Add audio files if recorded
            if (audioWordBlob) {
                formDataToSend.append('audio_word', audioWordBlob, 'audio_word.webm')
            }
            if (audioExampleBlob) {
                formDataToSend.append('audio_example', audioExampleBlob, 'audio_example.webm')
            }

            const url = editingWord
                ? `${API_URL}/api/dictionary/${editingWord.id}`
                : `${API_URL}/api/dictionary`

            const response = await fetch(url, {
                method: editingWord ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSend
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || t('admin.common.recordError'))
            }

            closeModal()
            loadWords()
        } catch (error) {
            alert(t('admin.common.errorPrefix') + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = (id) => {
        if (!isAdmin) return
        setConfirmDialog({
            open: true,
            title: t('admin.dictionary.deleteRequestTitle', 'Demande de suppression'),
            message: t('admin.dictionary.deleteRequestConfirm', 'Cette demande devra être validée par un autre super-administrateur avant la suppression effective.'),
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, open: false }))
                try {
                    await apiRequest('/dictionary/delete-request', {
                        method: 'POST',
                        body: JSON.stringify({ wordIds: [id] })
                    })
                    loadDeleteRequests()
                } catch (error) {
                    alert(t('admin.common.errorPrefix') + error.message)
                }
            }
        })
    }

    // Bulk selection functions
    const toggleExpand = (id) => {
        setExpandedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredWords.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredWords.map(w => w.id)))
        }
    }

    const handleBulkDelete = () => {
        if (selectedIds.size === 0 || !isAdmin) return
        const count = selectedIds.size
        setConfirmDialog({
            open: true,
            title: t('admin.dictionary.deleteRequestTitle', 'Demande de suppression'),
            message: t('admin.dictionary.bulkDeleteRequestConfirm', { count }),
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, open: false }))
                setBulkDeleting(true)
                try {
                    await apiRequest('/dictionary/delete-request', {
                        method: 'POST',
                        body: JSON.stringify({ wordIds: [...selectedIds] })
                    })
                    setSelectedIds(new Set())
                    loadDeleteRequests()
                } catch (error) {
                    alert(t('admin.common.errorPrefix') + error.message)
                } finally {
                    setBulkDeleting(false)
                }
            }
        })
    }

    const handleApproveDelete = async (requestId) => {
        try {
            await apiRequest(`/dictionary/delete-request/${requestId}/approve`, { method: 'POST' })
            loadWords()
            loadDeleteRequests()
        } catch (error) {
            alert(t('admin.common.errorPrefix') + error.message)
        }
    }

    const handleRejectDelete = async (requestId) => {
        try {
            await apiRequest(`/dictionary/delete-request/${requestId}/reject`, { method: 'POST' })
            loadDeleteRequests()
        } catch (error) {
            alert(t('admin.common.errorPrefix') + error.message)
        }
    }

    const handleCancelDelete = async (requestId) => {
        try {
            await apiRequest(`/dictionary/delete-request/${requestId}/cancel`, { method: 'POST' })
            loadDeleteRequests()
        } catch (error) {
            alert(t('admin.common.errorPrefix') + error.message)
        }
    }

    // PDF Import Functions
    const openPdfModal = () => {
        setPdfFile(null)
        setPdfDomain('')
        setPdfPreview(null)
        setPdfResult(null)
        setShowPdfModal(true)
    }

    const closePdfModal = () => {
        setShowPdfModal(false)
        setPdfFile(null)
        setPdfPreview(null)
        setPdfResult(null)
    }

    const handlePdfPreview = async () => {
        if (!pdfFile) return
        setPdfPreviewing(true)
        setPdfResult(null)
        try {
            const formData = new FormData()
            formData.append('pdf', pdfFile)

            const response = await fetch(`${API_URL}/api/dictionary/preview-pdf`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            })

            if (!response.ok) {
                const err = await response.json().catch(() => ({}))
                throw new Error(err.error || t('admin.common.previewError'))
            }

            const data = await response.json()
            setPdfPreview(data)
        } catch (error) {
            alert(t('admin.common.errorPrefix') + error.message)
        } finally {
            setPdfPreviewing(false)
        }
    }

    const handlePdfImport = async () => {
        if (!pdfFile) return
        setPdfImporting(true)
        try {
            const formData = new FormData()
            formData.append('pdf', pdfFile)
            if (pdfDomain) formData.append('domain', pdfDomain)

            const response = await fetch(`${API_URL}/api/dictionary/import-pdf`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            })

            if (!response.ok) {
                const err = await response.json().catch(() => ({}))
                throw new Error(err.error || t('admin.common.importError'))
            }

            const data = await response.json()
            setPdfResult(data)
            setPdfPreview(null)
            loadWords()
        } catch (error) {
            alert(t('admin.common.errorPrefix') + error.message)
        } finally {
            setPdfImporting(false)
        }
    }

    const filteredWords = words.filter(word => {
        const term = searchTerm.toLowerCase()
        const matchesSearch = (word.word?.toLowerCase() || '').includes(term) ||
               (word.translation_fr?.toLowerCase() || '').includes(term) ||
               (word.translation_en?.toLowerCase() || '').includes(term) ||
               (word.translation_ff?.toLowerCase() || '').includes(term)
        const matchesDomain = !filterDomain || word.domain === filterDomain
        return matchesSearch && matchesDomain
    }).sort((a, b) => {
        const domainA = a.domain || ''
        const domainB = b.domain || ''
        if (domainA !== domainB) return domainA.localeCompare(domainB)
        return (a.word || '').localeCompare(b.word || '')
    })

    // Group words by domain for display
    const domainGroups = {}
    filteredWords.forEach(word => {
        const domain = word.domain || '_none'
        if (!domainGroups[domain]) domainGroups[domain] = []
        domainGroups[domain].push(word)
    })
    const domainKeys = Object.keys(domainGroups).sort((a, b) => {
        if (a === '_none') return 1
        if (b === '_none') return -1
        return a.localeCompare(b)
    })

    if (loading) {
        return <div className="admin-loading"><div className="spinner-large"></div></div>
    }

    return (
        <div>
            <div className="admin-card">
                <div className="admin-card-header-actions">
                    <h2>{t('admin.dictionary.title')}</h2>
                    <div className="admin-actions-row">
                        <div className="admin-search-bar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder={t('admin.dictionary.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="domain-filter-select"
                            value={filterDomain}
                            onChange={(e) => setFilterDomain(e.target.value)}
                        >
                            <option value="">{t('admin.dictionary.allDomains', 'Tous les domaines')}</option>
                            <option value="scientifique">{t('admin.dictionary.domScience')}</option>
                            <option value="mathematiques">{t('admin.dictionary.domMath')}</option>
                            <option value="biologie">{t('admin.dictionary.domBio')}</option>
                            <option value="philosophie">{t('admin.dictionary.domPhilo')}</option>
                            <option value="economie">{t('admin.dictionary.domEco')}</option>
                            <option value="droit">{t('admin.dictionary.domDroit')}</option>
                            <option value="astronomie">{t('admin.dictionary.domAstro')}</option>
                            <option value="informatique">{t('admin.dictionary.domInfo')}</option>
                            <option value="botanique">{t('admin.dictionary.domBota')}</option>
                            <option value="vivants">{t('admin.dictionary.domVivants')}</option>
                            <option value="elevage">{t('admin.dictionary.domElevage')}</option>
                            <option value="agriculture">{t('admin.dictionary.domAgri')}</option>
                            <option value="peche">{t('admin.dictionary.domPeche')}</option>
                            <option value="forge">{t('admin.dictionary.domForge')}</option>
                            <option value="dictionnaire">{t('admin.dictionary.domDict')}</option>
                        </select>
                        <button className="btn-add" style={{ background: 'linear-gradient(135deg, #e67e22, #d35400)' }} onClick={openPdfModal}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="12" y1="18" x2="12" y2="12" />
                                <line x1="9" y1="15" x2="15" y2="15" />
                            </svg>
                            {t('admin.dictionary.importPdf')}
                        </button>
                        <button className="btn-add" onClick={() => openModal()}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            {t('admin.dictionary.add')}
                        </button>
                    </div>
                </div>

                {/* Panneau des demandes de suppression en attente */}
                {isSuperAdmin && deleteRequests.filter(r => r.status === 'pending').length > 0 && (
                    <div className="delete-requests-banner" onClick={() => setShowDeleteRequests(!showDeleteRequests)}>
                        <span className="delete-requests-badge">
                            {deleteRequests.filter(r => r.status === 'pending').length}
                        </span>
                        <span>{t('admin.dictionary.pendingDeleteRequests', 'Demandes de suppression en attente')}</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, marginLeft: 'auto', transform: showDeleteRequests ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>
                )}
                {isSuperAdmin && showDeleteRequests && deleteRequests.filter(r => r.status === 'pending').length > 0 && (
                    <div className="delete-requests-panel">
                        {deleteRequests.filter(r => r.status === 'pending').map(req => (
                            <div key={req.id} className="delete-request-item">
                                <div className="delete-request-info">
                                    <strong>{req.word}</strong>
                                    <span className="delete-request-meta">
                                        {req.translation_fr && ` — ${req.translation_fr}`}
                                        {req.domain && ` (${t(domainKeyMap[req.domain] || req.domain)})`}
                                    </span>
                                    <span className="delete-request-by">
                                        {t('admin.dictionary.requestedBy', 'Demandé par')} <strong>{req.requested_by_name}</strong>
                                        {' — '}{new Date(req.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="delete-request-actions">
                                    <button className="btn-approve" onClick={(e) => { e.stopPropagation(); handleApproveDelete(req.id) }} title={t('admin.dictionary.approveDelete', 'Approuver la suppression')}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                    </button>
                                    <button className="btn-reject" onClick={(e) => { e.stopPropagation(); handleRejectDelete(req.id) }} title={t('admin.dictionary.rejectDelete', 'Rejeter')}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Bulk action bar */}
                {selectedIds.size > 0 && isAdmin && (
                    <div className="bulk-action-bar">
                        <div className="bulk-action-count">
                            <span className="bulk-count-badge">{selectedIds.size}</span>
                            {t('admin.dictionary.selectedCount', { count: selectedIds.size })}
                        </div>
                        <div className="bulk-action-buttons">
                            <button
                                className="bulk-delete-btn"
                                onClick={handleBulkDelete}
                                disabled={bulkDeleting}
                            >
                                {bulkDeleting ? (
                                    <div className="btn-spinner"></div>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                        {t('admin.dictionary.deleteSelected')}
                                    </>
                                )}
                            </button>
                            <button
                                className="bulk-deselect-btn"
                                onClick={() => setSelectedIds(new Set())}
                            >
                                {t('admin.dictionary.deselectAll')}
                            </button>
                        </div>
                    </div>
                )}

                <table className="admin-table">
                    <thead>
                        <tr>
                            {isAdmin && (
                            <th className="th-checkbox">
                                <input
                                    type="checkbox"
                                    className="bulk-checkbox"
                                    checked={filteredWords.length > 0 && selectedIds.size === filteredWords.length}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            )}
                            <th>{t('admin.dictionary.wordFulfulde')}</th>
                            <th>{t('admin.dictionary.translationFr')}</th>
                            <th>{t('admin.dictionary.domain')}</th>
                            <th>🎤</th>
                            <th>{t('admin.common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {domainKeys.map(domainKey => (
                            <Fragment key={domainKey}>
                                <tr className="domain-group-header">
                                    <td colSpan="6">
                                        <strong>
                                            {domainKey === '_none'
                                                ? t('admin.dictionary.noDomain', 'Sans domaine')
                                                : t(domainKeyMap[domainKey] || domainKey)}
                                        </strong>
                                        <span className="domain-group-count">({domainGroups[domainKey].length})</span>
                                    </td>
                                </tr>
                                {domainGroups[domainKey].map(word => {
                                    const isExpanded = expandedIds.has(word.id)
                                    return (
                                        <Fragment key={word.id}>
                                            <tr className={`${selectedIds.has(word.id) ? 'row-selected' : ''} ${isExpanded ? 'row-expanded' : ''}`}>
                                                {isAdmin && (
                                                <td className="td-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        className="bulk-checkbox"
                                                        checked={selectedIds.has(word.id)}
                                                        onChange={() => toggleSelect(word.id)}
                                                    />
                                                </td>
                                                )}
                                                <td><strong>{word.word}</strong></td>
                                                <td className="td-truncate">{word.translation_fr || '-'}</td>
                                                <td><span className="domain-badge">{word.domain ? t(domainKeyMap[word.domain] || word.domain) : '-'}</span></td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {word.audio_word && (
                                                        <span title={t('admin.common.audioTitle')}>🔊</span>
                                                    )}
                                                </td>
                                                <td className="actions-cell">
                                                    <button className="btn-expand" onClick={() => toggleExpand(word.id)} title={isExpanded ? t('admin.dictionary.seeLess') : t('admin.dictionary.seeMore')}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                                                            <polyline points="6 9 12 15 18 9" />
                                                        </svg>
                                                    </button>
                                                    <button className="btn-edit" onClick={() => openModal(word)}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>
                                                    {isAdmin && (
                                                    <button className="btn-delete" onClick={() => handleDelete(word.id)} title={t('admin.dictionary.requestDelete', 'Demander la suppression')}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                        </svg>
                                                    </button>
                                                    )}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="row-detail">
                                                    <td colSpan="6">
                                                        <div className="word-detail-grid">
                                                            <div className="word-detail-item">
                                                                <span className="word-detail-label">{t('admin.dictionary.translationFr')}</span>
                                                                <span className="word-detail-value">{word.translation_fr || '-'}</span>
                                                            </div>
                                                            <div className="word-detail-item">
                                                                <span className="word-detail-label">{t('admin.dictionary.translationEn')}</span>
                                                                <span className="word-detail-value">{word.translation_en || '-'}</span>
                                                            </div>
                                                            <div className="word-detail-item">
                                                                <span className="word-detail-label">{t('admin.dictionary.translationFf')}</span>
                                                                <span className="word-detail-value">{word.translation_ff || '-'}</span>
                                                            </div>
                                                            <div className="word-detail-item">
                                                                <span className="word-detail-label">{t('admin.dictionary.category')}</span>
                                                                <span className="word-detail-value">{word.category || '-'}</span>
                                                            </div>
                                                            {word.example && (
                                                                <div className="word-detail-item word-detail-full">
                                                                    <span className="word-detail-label">{t('admin.dictionary.example')}</span>
                                                                    <span className="word-detail-value">{word.example}</span>
                                                                </div>
                                                            )}
                                                            {word.example_translation && (
                                                                <div className="word-detail-item word-detail-full">
                                                                    <span className="word-detail-label">{t('admin.dictionary.exampleTranslation')}</span>
                                                                    <span className="word-detail-value">{word.example_translation}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    )
                                })}
                            </Fragment>
                        ))}
                        {words.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--medium-gray)' }}>
                                    {t('admin.dictionary.noWords')}
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
                            <h3>{editingWord ? t('admin.dictionary.edit') : t('admin.dictionary.add')}</h3>
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
                                    <div className="form-group">
                                        <label>{t('admin.dictionary.wordFulfulde')} *</label>
                                        <input
                                            type="text"
                                            value={formData.word}
                                            onChange={e => setFormData({ ...formData, word: e.target.value })}
                                            required
                                            style={{ fontSize: '1.1rem', fontWeight: 600 }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('admin.dictionary.category')}</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="">{t('admin.common.select')}</option>
                                            <option value="nom">{t('admin.dictionary.catNom')}</option>
                                            <option value="verbe">{t('admin.dictionary.catVerbe')}</option>
                                            <option value="adjectif">{t('admin.dictionary.catAdjectif')}</option>
                                            <option value="adverbe">{t('admin.dictionary.catAdverbe')}</option>
                                            <option value="expression">{t('admin.dictionary.catExpression')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>{t('admin.dictionary.domain')}</label>
                                    <select
                                        value={formData.domain}
                                        onChange={e => setFormData({ ...formData, domain: e.target.value })}
                                    >
                                        <option value="">{t('admin.common.select')}</option>
                                        <option value="scientifique">{t('admin.dictionary.domScience')}</option>
                                        <option value="mathematiques">{t('admin.dictionary.domMath')}</option>
                                        <option value="biologie">{t('admin.dictionary.domBio')}</option>
                                        <option value="philosophie">{t('admin.dictionary.domPhilo')}</option>
                                        <option value="economie">{t('admin.dictionary.domEco')}</option>
                                        <option value="droit">{t('admin.dictionary.domDroit')}</option>
                                        <option value="astronomie">{t('admin.dictionary.domAstro')}</option>
                                        <option value="informatique">{t('admin.dictionary.domInfo')}</option>
                                        <option value="botanique">{t('admin.dictionary.domBota')}</option>
                                        <option value="vivants">{t('admin.dictionary.domVivants')}</option>
                                        <option value="elevage">{t('admin.dictionary.domElevage')}</option>
                                        <option value="agriculture">{t('admin.dictionary.domAgri')}</option>
                                        <option value="peche">{t('admin.dictionary.domPeche')}</option>
                                        <option value="forge">{t('admin.dictionary.domForge')}</option>
                                        <option value="dictionnaire">{t('admin.dictionary.domDict')}</option>
                                    </select>
                                </div>

                                {/* Audio du mot */}
                                <div className="form-group">
                                    <label>🎤 {t('admin.dictionary.audioWord')}</label>
                                    <div className="audio-recorder">
                                        {!isRecordingWord ? (
                                            <button
                                                type="button"
                                                className="btn-record"
                                                onClick={() => startRecording('word')}
                                            >
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                                </svg>
                                                {audioWordUrl ? t('admin.dictionary.reRecord') : t('admin.dictionary.record')}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="btn-record recording"
                                                onClick={stopRecording}
                                            >
                                                <span className="recording-dot"></span>
                                                {t('admin.dictionary.stop')}
                                            </button>
                                        )}
                                        {audioWordUrl && (
                                            <div className="audio-preview">
                                                <audio controls src={audioWordUrl}></audio>
                                                <button
                                                    type="button"
                                                    className="btn-delete-audio"
                                                    onClick={() => deleteAudio('word')}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
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
                                        <div className="form-group">
                                            <label>{t('admin.dictionary.translationFr')}</label>
                                            <textarea
                                                value={formData.translation_fr}
                                                onChange={e => setFormData({ ...formData, translation_fr: e.target.value })}
                                                rows="3"
                                            />
                                        </div>
                                    )}
                                    {activeTab === 'en' && (
                                        <div className="form-group">
                                            <label>{t('admin.dictionary.translationEn')}</label>
                                            <textarea
                                                value={formData.translation_en}
                                                onChange={e => setFormData({ ...formData, translation_en: e.target.value })}
                                                rows="3"
                                            />
                                        </div>
                                    )}
                                    {activeTab === 'ff' && (
                                        <div className="form-group">
                                            <label>{t('admin.dictionary.translationFf')}</label>
                                            <textarea
                                                value={formData.translation_ff}
                                                onChange={e => setFormData({ ...formData, translation_ff: e.target.value })}
                                                placeholder={t('admin.dictionary.placeholderFf')}
                                                rows="3"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>{t('admin.dictionary.example')}</label>
                                    <textarea
                                        value={formData.example}
                                        onChange={e => setFormData({ ...formData, example: e.target.value })}
                                        placeholder={t('admin.dictionary.examplePlaceholder')}
                                        rows="2"
                                    />
                                </div>

                                {/* Audio de l'exemple */}
                                <div className="form-group">
                                    <label>🎤 {t('admin.dictionary.audioExample')}</label>
                                    <div className="audio-recorder">
                                        {!isRecordingExample ? (
                                            <button
                                                type="button"
                                                className="btn-record"
                                                onClick={() => startRecording('example')}
                                            >
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                                </svg>
                                                {audioExampleUrl ? t('admin.dictionary.reRecord') : t('admin.dictionary.record')}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="btn-record recording"
                                                onClick={stopRecording}
                                            >
                                                <span className="recording-dot"></span>
                                                {t('admin.dictionary.stop')}
                                            </button>
                                        )}
                                        {audioExampleUrl && (
                                            <div className="audio-preview">
                                                <audio controls src={audioExampleUrl}></audio>
                                                <button
                                                    type="button"
                                                    className="btn-delete-audio"
                                                    onClick={() => deleteAudio('example')}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={closeModal} disabled={isSubmitting}>{t('admin.common.cancel')}</button>
                                <button type="submit" className="btn-save" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <div className="btn-spinner"></div>
                                    ) : (
                                        editingWord ? t('admin.common.save') : t('admin.common.add')
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PDF Import Modal */}
            {showPdfModal && (
                <div className="modal-overlay" onClick={closePdfModal}>
                    <div className="modal modal-large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📄 {t('admin.dictionary.importPdf')}</h3>
                            <button className="modal-close" onClick={closePdfModal}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-form">
                            <div className="modal-body">
                                {/* File selection */}
                                <div className="form-group">
                                    <label>{t('admin.dictionary.pdfFile')}</label>
                                    <div
                                        className="pdf-drop-zone"
                                        onClick={() => pdfInputRef.current?.click()}
                                    >
                                        {pdfFile ? (
                                            <div className="pdf-drop-zone-content">
                                                <span className="pdf-drop-zone-icon">📄</span>
                                                <p className="pdf-drop-zone-filename">{pdfFile.name}</p>
                                                <p className="pdf-drop-zone-size">
                                                    {(pdfFile.size / 1024).toFixed(1)} Ko
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="pdf-drop-zone-content">
                                                <span className="pdf-drop-zone-icon">📤</span>
                                                <p className="pdf-drop-zone-text">{t('admin.dictionary.pdfClickToSelect')}</p>
                                                <p className="pdf-drop-zone-hint">
                                                    {t('admin.dictionary.pdfFormat')}
                                                </p>
                                            </div>
                                        )}
                                        <input
                                            ref={pdfInputRef}
                                            type="file"
                                            accept=".pdf"
                                            style={{ display: 'none' }}
                                            onChange={e => {
                                                setPdfFile(e.target.files[0] || null)
                                                setPdfPreview(null)
                                                setPdfResult(null)
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Domain selection */}
                                <div className="form-group">
                                    <label>{t('admin.dictionary.pdfDomain')}</label>
                                    <select value={pdfDomain} onChange={e => setPdfDomain(e.target.value)}>
                                        <option value="">{t('admin.common.select')}</option>
                                        <option value="scientifique">{t('admin.dictionary.domScience')}</option>
                                        <option value="mathematiques">{t('admin.dictionary.domMath')}</option>
                                        <option value="biologie">{t('admin.dictionary.domBio')}</option>
                                        <option value="philosophie">{t('admin.dictionary.domPhilo')}</option>
                                        <option value="economie">{t('admin.dictionary.domEco')}</option>
                                        <option value="droit">{t('admin.dictionary.domDroit')}</option>
                                        <option value="astronomie">{t('admin.dictionary.domAstro')}</option>
                                        <option value="informatique">{t('admin.dictionary.domInfo')}</option>
                                        <option value="botanique">{t('admin.dictionary.domBota')}</option>
                                        <option value="vivants">{t('admin.dictionary.domVivants')}</option>
                                        <option value="elevage">{t('admin.dictionary.domElevage')}</option>
                                        <option value="agriculture">{t('admin.dictionary.domAgri')}</option>
                                        <option value="peche">{t('admin.dictionary.domPeche')}</option>
                                        <option value="forge">{t('admin.dictionary.domForge')}</option>
                                        <option value="dictionnaire">{t('admin.dictionary.domDict')}</option>
                                    </select>
                                </div>

                                {/* Import result */}
                                {pdfResult && (
                                    <div className={`pdf-result ${pdfResult.inserted > 0 ? 'pdf-result-success' : 'pdf-result-warning'}`}>
                                        <p className="pdf-result-title">
                                            {pdfResult.inserted > 0 ? '✅' : '⚠️'} {pdfResult.message}
                                        </p>
                                        <div className="pdf-result-stats">
                                            <span>📊 {t('admin.dictionary.pdfTotal')}: <strong>{pdfResult.total}</strong></span>
                                            <span>✅ {t('admin.dictionary.pdfInserted')}: <strong>{pdfResult.inserted}</strong></span>
                                            <span>⏭️ {t('admin.dictionary.pdfSkipped')}: <strong>{pdfResult.skipped}</strong></span>
                                        </div>
                                        {pdfResult.duplicates && pdfResult.duplicates.length > 0 && (
                                            <p className="pdf-result-duplicates">
                                                {t('admin.dictionary.pdfDuplicates')}: {pdfResult.duplicates.slice(0, 20).join(', ')}
                                                {pdfResult.duplicates.length > 20 ? '...' : ''}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Preview table */}
                                {pdfPreview && pdfPreview.words && pdfPreview.words.length > 0 && (
                                    <div className="form-group">
                                        <label>
                                            {t('admin.dictionary.pdfPreviewTitle')} — {pdfPreview.total} {t('admin.dictionary.pdfWords')},
                                            {' '}{pdfPreview.newWords} {t('admin.dictionary.pdfNew')},
                                            {' '}{pdfPreview.duplicates.length} {t('admin.dictionary.pdfExisting')}
                                        </label>
                                        <div className="pdf-preview-table-wrapper">
                                            <table className="admin-table pdf-preview-table">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Fulfulde</th>
                                                        <th>{t('admin.dictionary.translationFr')}</th>
                                                        <th>{t('admin.dictionary.translationEn')}</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pdfPreview.words.map((w, idx) => {
                                                        const isDuplicate = pdfPreview.duplicates.includes(w.word)
                                                        return (
                                                            <tr key={idx} className={isDuplicate ? 'pdf-row-duplicate' : ''}>
                                                                <td>{idx + 1}</td>
                                                                <td><strong>{w.word}</strong></td>
                                                                <td>{w.translation_fr || '—'}</td>
                                                                <td>{w.translation_en || '—'}</td>
                                                                <td>
                                                                    {isDuplicate ? (
                                                                        <span className="pdf-status-duplicate">⚠️ {t('admin.dictionary.pdfDuplicate')}</span>
                                                                    ) : (
                                                                        <span className="pdf-status-new">✅ {t('admin.dictionary.pdfNewWord')}</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {pdfPreview && pdfPreview.words && pdfPreview.words.length === 0 && (
                                    <div className="pdf-no-words">
                                        <p>❌ {t('admin.dictionary.pdfNoWords')}</p>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={closePdfModal}>{t('admin.common.cancel')}</button>
                                <button
                                    type="button"
                                    className="btn-save"
                                    onClick={handlePdfPreview}
                                    disabled={!pdfFile || pdfPreviewing}
                                    style={{ background: 'var(--primary-gold)' }}
                                >
                                    {pdfPreviewing ? (
                                        <div className="btn-spinner"></div>
                                    ) : (
                                        <>👁️ {t('admin.dictionary.pdfPreview')}</>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="btn-save"
                                    onClick={handlePdfImport}
                                    disabled={!pdfFile || pdfImporting}
                                >
                                    {pdfImporting ? (
                                        <div className="btn-spinner"></div>
                                    ) : (
                                        <>📥 {t('admin.dictionary.pdfImport')}</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={closeConfirm}
                confirmText={t('admin.dictionary.sendRequest', 'Envoyer la demande')}
            />
        </div>
    )
}

export default DictionaryAdmin
