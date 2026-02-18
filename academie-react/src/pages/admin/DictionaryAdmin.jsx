import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../context/AuthContext'
import { API_URL } from '../../config'

function DictionaryAdmin() {
    const { t } = useTranslation()
    const { apiRequest, token } = useApi()
    const [words, setWords] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
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

    useEffect(() => {
        loadWords()
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
                alert('L\'accès au microphone est restreint aux connexions sécurisées (HTTPS). Si vous êtes en test, utilisez localhost ou configurez SSL sur votre serveur.')
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
            alert('Impossible d\'accéder au microphone. Vérifiez les permissions de votre navigateur.')
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
                throw new Error(errorData.message || 'Erreur lors de l\'enregistrement')
            }

            closeModal()
            loadWords()
        } catch (error) {
            alert('Erreur: ' + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Supprimer ce mot ?')) return
        try {
            await apiRequest(`/dictionary/${id}`, { method: 'DELETE' })
            loadWords()
        } catch (error) {
            alert('Erreur: ' + error.message)
        }
    }

    const filteredWords = words.filter(word => {
        const term = searchTerm.toLowerCase()
        return (word.word?.toLowerCase() || '').includes(term) ||
               (word.translation_fr?.toLowerCase() || '').includes(term) ||
               (word.translation_en?.toLowerCase() || '').includes(term) ||
               (word.translation_ff?.toLowerCase() || '').includes(term)
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
                        <button className="btn-add" onClick={() => openModal()}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            {t('admin.dictionary.add')}
                        </button>
                    </div>
                </div>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>{t('admin.dictionary.wordPulaar')}</th>
                            <th>{t('admin.dictionary.translationFr')}</th>
                            <th>{t('admin.dictionary.translationEn')}</th>
                            <th>{t('admin.dictionary.translationFf')}</th>
                            <th>{t('admin.dictionary.domain')}</th>
                            <th>🎤</th>
                            <th>{t('admin.common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredWords.map(word => (
                            <tr key={word.id}>
                                <td><strong>{word.word}</strong></td>
                                <td>{word.translation_fr || '-'}</td>
                                <td>{word.translation_en || '-'}</td>
                                <td>{word.translation_ff || '-'}</td>
                                <td><span className="domain-badge">{word.domain || '-'}</span></td>
                                <td style={{ textAlign: 'center' }}>
                                    {word.audio_word && (
                                        <span title="Audio du mot">🔊</span>
                                    )}
                                </td>
                                <td className="actions-cell">
                                    <button className="btn-edit" onClick={() => openModal(word)}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button className="btn-delete" onClick={() => handleDelete(word.id)}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {words.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--medium-gray)' }}>
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
                                        <label>{t('admin.dictionary.wordPulaar')} *</label>
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
                                                placeholder={t('admin.dictionary.placeholderFr')}
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
                                                placeholder={t('admin.dictionary.placeholderEn')}
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
                                                Arrêter
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
        </div>
    )
}

export default DictionaryAdmin
