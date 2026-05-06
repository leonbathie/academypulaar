import { useState, useEffect, useRef, Fragment, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi, useAuth } from '../../context/AuthContext'
import { API_URL } from '../../config'
import ConfirmDialog from '../../components/ConfirmDialog'

// Alignement avec DomainPage.jsx : 6 méta-domaines de terminologie et leurs sous-domaines
const DOMAIN_CONFIG = {
    'sciences-technologie':      { icon: '🔬', labelKey: 'terminology.domScience', filters: ['scientifique', 'mathematiques', 'informatique', 'astronomie'] },
    'sante-medecine':            { icon: '🏥', labelKey: 'terminology.domHealth',  filters: ['biologie', 'vivants'] },
    'sciences-humaines':         { icon: '⚖️', labelKey: 'terminology.domHuman',   filters: ['philosophie', 'economie', 'droit'] },
    'education':                 { icon: '📚', labelKey: 'terminology.domEdu',     filters: ['dictionnaire'] },
    'agriculture-environnement': { icon: '🌾', labelKey: 'terminology.domAgri',    filters: ['agriculture', 'botanique', 'vivants', 'elevage', 'peche'] },
    'metiers-artisanat':         { icon: '🔨', labelKey: 'terminology.domCrafts',  filters: ['forge'] }
}

// Union de tous les sous-domaines appartenant à la terminologie
const TERMINOLOGY_SUBDOMAINS = Array.from(new Set(Object.values(DOMAIN_CONFIG).flatMap(c => c.filters)))

// Mapping sous-domaine → clé i18n (réutilise celles de DictionaryAdmin)
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

// Retrouver le méta-domaine pour un sous-domaine donné
const findMetaDomain = (subdomain) => {
    for (const [meta, cfg] of Object.entries(DOMAIN_CONFIG)) {
        if (cfg.filters.includes(subdomain)) return meta
    }
    return null
}

function TerminologieAdmin() {
    const { t, i18n } = useTranslation()
    const { apiRequest, token } = useApi()
    const { isSuperAdmin, isAdmin, user } = useAuth()

    const normalizeFulfuldeText = (value) => (value ?? '').toString().normalize('NFC').trim()
    const searchNormalizer = (value) => normalizeFulfuldeText(value).toLowerCase()
    const collator = new Intl.Collator(i18n.language || 'ff', { sensitivity: 'base', numeric: true })

    const [words, setWords] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterMeta, setFilterMeta] = useState('')
    const [expandedIds, setExpandedIds] = useState(new Set())
    const [showModal, setShowModal] = useState(false)
    const [editingWord, setEditingWord] = useState(null)
    const [activeTab, setActiveTab] = useState('fr')
    const [formData, setFormData] = useState({
        word: '', translation_fr: '', translation_en: '', translation_ff: '',
        category: '', domain: '', example: '', example_translation: ''
    })

    // Audio recording states
    const [isRecordingWord, setIsRecordingWord] = useState(false)
    const [isRecordingExample, setIsRecordingExample] = useState(false)
    const [audioWordBlob, setAudioWordBlob] = useState(null)
    const [audioExampleBlob, setAudioExampleBlob] = useState(null)
    const [audioWordUrl, setAudioWordUrl] = useState(null)
    const [audioExampleUrl, setAudioExampleUrl] = useState(null)
    const [removedAudioWord, setRemovedAudioWord] = useState(false)
    const [removedAudioExample, setRemovedAudioExample] = useState(false)
    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])

    // Bulk selection states
    const [selectedIds, setSelectedIds] = useState(new Set())
    const [bulkDeleting, setBulkDeleting] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Delete requests (double validation super-admin)
    const [deleteRequests, setDeleteRequests] = useState([])
    const [showDeleteRequests, setShowDeleteRequests] = useState(false)
    const [deleteFilterMeta, setDeleteFilterMeta] = useState('')
    const [selectedDeleteIds, setSelectedDeleteIds] = useState(new Set())
    const [bulkProcessingDelete, setBulkProcessingDelete] = useState(false)

    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, confirmText: '' })
    const closeConfirm = useCallback(() => setConfirmDialog(prev => ({ ...prev, open: false })), [])

    useEffect(() => {
        loadWords()
        if (isAdmin) loadDeleteRequests()
    }, [])

    const loadWords = async () => {
        try {
            const data = await apiRequest('/dictionary')
            // Ne conserver que les mots appartenant aux sous-domaines de terminologie
            setWords(data.filter(w => w.domain && TERMINOLOGY_SUBDOMAINS.includes(w.domain)))
        } catch (error) {
            console.error('Error loading words:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadDeleteRequests = async () => {
        try {
            const data = await apiRequest('/dictionary/delete-requests')
            // Restreindre aux demandes concernant les mots de terminologie
            setDeleteRequests(data.filter(r => r.domain && TERMINOLOGY_SUBDOMAINS.includes(r.domain)))
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
            setAudioWordUrl(word.audio_word ? `${API_URL}${word.audio_word}` : null)
            setAudioExampleUrl(word.audio_example ? `${API_URL}${word.audio_example}` : null)
        } else {
            setEditingWord(null)
            setFormData({
                word: '', translation_fr: '', translation_en: '', translation_ff: '',
                category: '', domain: '', example: '', example_translation: ''
            })
            setAudioWordUrl(null)
            setAudioExampleUrl(null)
        }
        setAudioWordBlob(null)
        setAudioExampleBlob(null)
        setRemovedAudioWord(false)
        setRemovedAudioExample(false)
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
                if (event.data.size > 0) audioChunksRef.current.push(event.data)
            }

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                const audioUrl = URL.createObjectURL(audioBlob)
                if (type === 'word') {
                    setAudioWordBlob(audioBlob); setAudioWordUrl(audioUrl); setRemovedAudioWord(false)
                } else {
                    setAudioExampleBlob(audioBlob); setAudioExampleUrl(audioUrl); setRemovedAudioExample(false)
                }
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorderRef.current.start()
            if (type === 'word') setIsRecordingWord(true)
            else setIsRecordingExample(true)
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
            setAudioWordBlob(null); setAudioWordUrl(null); setRemovedAudioWord(true)
        } else {
            setAudioExampleBlob(null); setAudioExampleUrl(null); setRemovedAudioExample(true)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (isSubmitting) return
        // Garde : n'accepter que les sous-domaines de terminologie
        if (!formData.domain || !TERMINOLOGY_SUBDOMAINS.includes(formData.domain)) {
            alert(t('admin.terminology.invalidDomain', 'Veuillez sélectionner un domaine de terminologie'))
            return
        }
        setIsSubmitting(true)
        try {
            const formDataToSend = new FormData()
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, normalizeFulfuldeText(formData[key]))
            })
            if (audioWordBlob) formDataToSend.append('audio_word', audioWordBlob, 'audio_word.webm')
            if (audioExampleBlob) formDataToSend.append('audio_example', audioExampleBlob, 'audio_example.webm')
            if (removedAudioWord && !audioWordBlob) formDataToSend.append('remove_audio_word', '1')
            if (removedAudioExample && !audioExampleBlob) formDataToSend.append('remove_audio_example', '1')

            const url = editingWord
                ? `${API_URL}/api/dictionary/${editingWord.id}`
                : `${API_URL}/api/dictionary`

            const response = await fetch(url, {
                method: editingWord ? 'PUT' : 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formDataToSend
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || errorData.message || t('admin.common.recordError'))
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
        if (selectedIds.size === filteredWords.length) setSelectedIds(new Set())
        else setSelectedIds(new Set(filteredWords.map(w => w.id)))
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

    const toggleSelectDelete = (id) => {
        setSelectedDeleteIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id); else next.add(id)
            return next
        })
    }

    const filteredPendingRequests = deleteRequests
        .filter(r => r.status === 'pending')
        .filter(r => !deleteFilterMeta || findMetaDomain(r.domain) === deleteFilterMeta)

    const toggleSelectAllDelete = () => {
        if (selectedDeleteIds.size === filteredPendingRequests.length) setSelectedDeleteIds(new Set())
        else setSelectedDeleteIds(new Set(filteredPendingRequests.map(r => r.id)))
    }

    const processBulk = async (action) => {
        if (selectedDeleteIds.size === 0) return
        const ids = Array.from(selectedDeleteIds)
        setBulkProcessingDelete(true)
        try {
            const endpoint = action === 'approve'
                ? '/dictionary/delete-requests/bulk-approve'
                : '/dictionary/delete-requests/bulk-reject'
            const result = await apiRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify({ ids })
            })
            setSelectedDeleteIds(new Set())
            await loadWords()
            await loadDeleteRequests()
            if (action === 'approve') {
                const msg = `✅ ${result.wordsDeleted || 0} mot(s) supprimé(s) (${result.approved || 0} demande(s) approuvée(s))`
                    + (result.skippedSelf ? `\n⚠️ ${result.skippedSelf} ignorée(s) — vous êtes l'auteur (un autre super-admin doit valider)` : '')
                alert(msg)
            } else {
                alert(`✅ ${result.rejected || 0} demande(s) rejetée(s)`)
            }
        } catch (e) {
            alert(t('admin.common.errorPrefix') + (e.message || String(e)))
        } finally {
            setBulkProcessingDelete(false)
        }
    }

    const handleBulkApproveDelete = () => {
        setConfirmDialog({
            open: true,
            title: t('admin.dictionary.bulkApproveTitle', 'Approuver en masse'),
            message: t('admin.dictionary.bulkApproveConfirm', { count: selectedDeleteIds.size, defaultValue: 'Approuver {{count}} suppression(s) ?' }),
            confirmText: t('admin.dictionary.approveAll', 'Tout approuver'),
            onConfirm: () => { setConfirmDialog(prev => ({ ...prev, open: false })); processBulk('approve') }
        })
    }

    const handleBulkRejectDelete = () => {
        setConfirmDialog({
            open: true,
            title: t('admin.dictionary.bulkRejectTitle', 'Rejeter en masse'),
            message: t('admin.dictionary.bulkRejectConfirm', { count: selectedDeleteIds.size, defaultValue: 'Rejeter {{count}} demande(s) ?' }),
            confirmText: t('admin.dictionary.rejectAll', 'Tout rejeter'),
            onConfirm: () => { setConfirmDialog(prev => ({ ...prev, open: false })); processBulk('reject') }
        })
    }

    const selectedMineCount = filteredPendingRequests
        .filter(r => selectedDeleteIds.has(r.id) && user && r.requested_by === user.id)
        .length

    const handleBulkCancelDelete = () => {
        if (selectedMineCount === 0) return
        setConfirmDialog({
            open: true,
            title: t('admin.dictionary.bulkCancelTitle', 'Annuler mes demandes'),
            message: t('admin.dictionary.bulkCancelConfirm', { count: selectedMineCount, defaultValue: 'Annuler {{count}} de mes demandes ? (les mots ne seront pas supprimés)' }),
            confirmText: t('admin.dictionary.cancelMine', 'Annuler mes demandes'),
            onConfirm: () => {
                setConfirmDialog(prev => ({ ...prev, open: false }))
                const mineIds = filteredPendingRequests
                    .filter(r => selectedDeleteIds.has(r.id) && user && r.requested_by === user.id)
                    .map(r => r.id)
                processBulkCancel(mineIds)
            }
        })
    }

    const processBulkCancel = async (ids) => {
        if (!ids || ids.length === 0) return
        setBulkProcessingDelete(true)
        try {
            const result = await apiRequest('/dictionary/delete-requests/bulk-cancel', {
                method: 'POST',
                body: JSON.stringify({ ids })
            })
            setSelectedDeleteIds(new Set())
            await loadDeleteRequests()
            alert(`✅ ${result.cancelled || 0} demande(s) annulée(s)`)
        } catch (e) {
            alert(t('admin.common.errorPrefix') + (e.message || String(e)))
        } finally {
            setBulkProcessingDelete(false)
        }
    }

    // Appliquer les filtres (recherche + méta-domaine)
    const filteredWords = words.filter(word => {
        const term = searchNormalizer(searchTerm)
        const matchesSearch = !term ||
            searchNormalizer(word.word).includes(term) ||
            searchNormalizer(word.translation_fr).includes(term) ||
            searchNormalizer(word.translation_en).includes(term) ||
            searchNormalizer(word.translation_ff).includes(term)
        const matchesMeta = !filterMeta || findMetaDomain(word.domain) === filterMeta
        return matchesSearch && matchesMeta
    }).sort((a, b) => {
        const metaA = findMetaDomain(a.domain) || 'zzz'
        const metaB = findMetaDomain(b.domain) || 'zzz'
        if (metaA !== metaB) return collator.compare(metaA, metaB)
        return collator.compare(a.word || '', b.word || '')
    })

    // Grouper par méta-domaine de terminologie (ordre défini dans DOMAIN_CONFIG)
    const metaGroups = {}
    filteredWords.forEach(word => {
        const meta = findMetaDomain(word.domain) || '_none'
        if (!metaGroups[meta]) metaGroups[meta] = []
        metaGroups[meta].push(word)
    })
    const metaKeys = Object.keys(DOMAIN_CONFIG).filter(k => metaGroups[k])
    if (metaGroups['_none']) metaKeys.push('_none')

    if (loading) return <div className="admin-loading"><div className="spinner-large"></div></div>

    return (
        <div>
            <div className="admin-card">
                <div className="admin-card-header-actions">
                    <h2>{t('admin.terminology.title', 'Terminologie')}</h2>
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
                            value={filterMeta}
                            onChange={(e) => setFilterMeta(e.target.value)}
                        >
                            <option value="">{t('admin.dictionary.allDomains', 'Tous les domaines')}</option>
                            {Object.entries(DOMAIN_CONFIG).map(([key, cfg]) => (
                                <option key={key} value={key}>{cfg.icon} {t(cfg.labelKey)}</option>
                            ))}
                        </select>
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
                        <div className="delete-requests-toolbar">
                            <div className="delete-requests-toolbar-left">
                                <label className="delete-requests-select-all">
                                    <input
                                        type="checkbox"
                                        checked={filteredPendingRequests.length > 0 && selectedDeleteIds.size === filteredPendingRequests.length}
                                        onChange={toggleSelectAllDelete}
                                    />
                                    <span>{t('admin.dictionary.selectAllVisible', 'Tout sélectionner')} ({filteredPendingRequests.length})</span>
                                </label>
                                <select
                                    className="delete-requests-filter"
                                    value={deleteFilterMeta}
                                    onChange={(e) => { setDeleteFilterMeta(e.target.value); setSelectedDeleteIds(new Set()) }}
                                >
                                    <option value="">{t('admin.dictionary.allDomains', 'Tous les domaines')}</option>
                                    {Object.entries(DOMAIN_CONFIG).map(([key, cfg]) => (
                                        <option key={key} value={key}>{cfg.icon} {t(cfg.labelKey)}</option>
                                    ))}
                                </select>
                            </div>
                            {selectedDeleteIds.size > 0 && (
                                <div className="delete-requests-bulk-actions">
                                    <span className="delete-requests-selected-count">{selectedDeleteIds.size} {t('admin.dictionary.selected', 'sélectionné(s)')}</span>
                                    <button className="btn-approve-bulk" onClick={handleBulkApproveDelete} disabled={bulkProcessingDelete}>
                                        {bulkProcessingDelete ? <div className="btn-spinner"></div> : <>✓ {t('admin.dictionary.approveAll', 'Tout approuver')}</>}
                                    </button>
                                    <button className="btn-reject-bulk" onClick={handleBulkRejectDelete} disabled={bulkProcessingDelete}>
                                        {bulkProcessingDelete ? <div className="btn-spinner"></div> : <>✕ {t('admin.dictionary.rejectAll', 'Tout rejeter')}</>}
                                    </button>
                                    {selectedMineCount > 0 && (
                                        <button className="btn-cancel-bulk" onClick={handleBulkCancelDelete} disabled={bulkProcessingDelete} title={t('admin.dictionary.cancelMineHelp', 'Annuler uniquement vos propres demandes')}>
                                            {bulkProcessingDelete ? <div className="btn-spinner"></div> : <>↩ {t('admin.dictionary.cancelMine', 'Annuler mes demandes')} ({selectedMineCount})</>}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {filteredPendingRequests.map(req => (
                            <div key={req.id} className="delete-request-item">
                                <input
                                    type="checkbox"
                                    className="delete-request-checkbox"
                                    checked={selectedDeleteIds.has(req.id)}
                                    onChange={() => toggleSelectDelete(req.id)}
                                    onClick={(e) => e.stopPropagation()}
                                />
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
                            <button className="bulk-delete-btn" onClick={handleBulkDelete} disabled={bulkDeleting}>
                                {bulkDeleting ? (<div className="btn-spinner"></div>) : (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                        {t('admin.dictionary.deleteSelected')}
                                    </>
                                )}
                            </button>
                            <button className="bulk-deselect-btn" onClick={() => setSelectedIds(new Set())}>
                                {t('admin.dictionary.deselectAll')}
                            </button>
                        </div>
                    </div>
                )}

                <div className="admin-table-wrapper">
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
                        {metaKeys.map(metaKey => {
                            const metaLabel = metaKey === '_none'
                                ? t('admin.terminology.otherGroup', 'Autre')
                                : `${DOMAIN_CONFIG[metaKey].icon} ${t(DOMAIN_CONFIG[metaKey].labelKey)}`
                            return (
                                <Fragment key={metaKey}>
                                    <tr className="domain-group-header">
                                        <td colSpan={isAdmin ? 6 : 5}>
                                            <strong>{metaLabel}</strong>
                                            <span className="domain-group-count">({metaGroups[metaKey].length})</span>
                                        </td>
                                    </tr>
                                    {metaGroups[metaKey].map(word => {
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
                                                        {word.audio_word && <span title={t('admin.common.audioTitle')}>🔊</span>}
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
                                                        <td colSpan={isAdmin ? 6 : 5}>
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
                            )
                        })}
                        {filteredWords.length === 0 && (
                            <tr>
                                <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--medium-gray)' }}>
                                    {t('admin.terminology.noItems', 'Aucun mot de terminologie')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
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
                                    <label>{t('admin.dictionary.domain')} *</label>
                                    <select
                                        value={formData.domain}
                                        onChange={e => setFormData({ ...formData, domain: e.target.value })}
                                        required
                                    >
                                        <option value="">{t('admin.common.select')}</option>
                                        {Object.entries(DOMAIN_CONFIG).map(([metaKey, cfg]) => (
                                            <optgroup key={metaKey} label={`${cfg.icon} ${t(cfg.labelKey)}`}>
                                                {cfg.filters.map(sub => (
                                                    <option key={sub} value={sub}>{t(domainKeyMap[sub] || sub)}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>

                                {/* Audio du mot */}
                                <div className="form-group">
                                    <label>🎤 {t('admin.dictionary.audioWord')}</label>
                                    <div className="audio-recorder">
                                        {!isRecordingWord ? (
                                            <button type="button" className="btn-record" onClick={() => startRecording('word')}>
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                                </svg>
                                                {audioWordUrl ? t('admin.dictionary.reRecord') : t('admin.dictionary.record')}
                                            </button>
                                        ) : (
                                            <button type="button" className="btn-record recording" onClick={stopRecording}>
                                                <span className="recording-dot"></span>
                                                {t('admin.dictionary.stop')}
                                            </button>
                                        )}
                                        {audioWordUrl && (
                                            <div className="audio-preview">
                                                <audio controls src={audioWordUrl}></audio>
                                                <button type="button" className="btn-delete-audio" onClick={() => deleteAudio('word')}>✕</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Onglets de langues */}
                                <div className="lang-tabs">
                                    <button type="button" className={`lang-tab ${activeTab === 'fr' ? 'active' : ''}`} onClick={() => setActiveTab('fr')}>🇫🇷 {t('admin.dictionary.translationFr')}</button>
                                    <button type="button" className={`lang-tab ${activeTab === 'en' ? 'active' : ''}`} onClick={() => setActiveTab('en')}>En {t('admin.dictionary.translationEn')}</button>
                                    <button type="button" className={`lang-tab ${activeTab === 'ff' ? 'active' : ''}`} onClick={() => setActiveTab('ff')}>SN {t('admin.dictionary.translationFf')}</button>
                                </div>

                                <div className="lang-content">
                                    {activeTab === 'fr' && (
                                        <div className="form-group">
                                            <label>{t('admin.dictionary.translationFr')}</label>
                                            <textarea value={formData.translation_fr} onChange={e => setFormData({ ...formData, translation_fr: e.target.value })} rows="3" />
                                        </div>
                                    )}
                                    {activeTab === 'en' && (
                                        <div className="form-group">
                                            <label>{t('admin.dictionary.translationEn')}</label>
                                            <textarea value={formData.translation_en} onChange={e => setFormData({ ...formData, translation_en: e.target.value })} rows="3" />
                                        </div>
                                    )}
                                    {activeTab === 'ff' && (
                                        <div className="form-group">
                                            <label>{t('admin.dictionary.translationFf')}</label>
                                            <textarea value={formData.translation_ff} onChange={e => setFormData({ ...formData, translation_ff: e.target.value })} placeholder={t('admin.dictionary.placeholderFf')} rows="3" />
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>{t('admin.dictionary.example')}</label>
                                    <textarea value={formData.example} onChange={e => setFormData({ ...formData, example: e.target.value })} placeholder={t('admin.dictionary.examplePlaceholder')} rows="2" />
                                </div>

                                {/* Audio de l'exemple */}
                                <div className="form-group">
                                    <label>🎤 {t('admin.dictionary.audioExample')}</label>
                                    <div className="audio-recorder">
                                        {!isRecordingExample ? (
                                            <button type="button" className="btn-record" onClick={() => startRecording('example')}>
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                                </svg>
                                                {audioExampleUrl ? t('admin.dictionary.reRecord') : t('admin.dictionary.record')}
                                            </button>
                                        ) : (
                                            <button type="button" className="btn-record recording" onClick={stopRecording}>
                                                <span className="recording-dot"></span>
                                                {t('admin.dictionary.stop')}
                                            </button>
                                        )}
                                        {audioExampleUrl && (
                                            <div className="audio-preview">
                                                <audio controls src={audioExampleUrl}></audio>
                                                <button type="button" className="btn-delete-audio" onClick={() => deleteAudio('example')}>✕</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={closeModal} disabled={isSubmitting}>{t('admin.common.cancel')}</button>
                                <button type="submit" className="btn-save" disabled={isSubmitting}>
                                    {isSubmitting ? (<div className="btn-spinner"></div>) : (editingWord ? t('admin.common.save') : t('admin.common.add'))}
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
                confirmText={confirmDialog.confirmText || t('admin.dictionary.sendRequest', 'Envoyer la demande')}
            />
        </div>
    )
}

export default TerminologieAdmin
