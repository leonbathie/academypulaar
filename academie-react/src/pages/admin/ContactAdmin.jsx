import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi, useAuth } from '../../context/AuthContext'
import ConfirmDialog from '../../components/ConfirmDialog'

function ContactAdmin() {
    const { t } = useTranslation()
    const { apiRequest } = useApi()
    const { isAdmin } = useAuth()
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedMessage, setSelectedMessage] = useState(null)
    const [filter, setFilter] = useState('all') // all, unread, read
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null })
    const closeConfirm = useCallback(() => setConfirmDialog(prev => ({ ...prev, open: false })), [])

    useEffect(() => {
        loadMessages()
    }, [])

    const loadMessages = async () => {
        try {
            const data = await apiRequest('/contact')
            setMessages(data)
        } catch (error) {
            console.error('Error loading contact messages:', error)
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (id) => {
        try {
            await apiRequest(`/contact/${id}/read`, { method: 'PUT' })
            setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m))
            if (selectedMessage?.id === id) {
                setSelectedMessage(prev => ({ ...prev, read: true }))
            }
        } catch (error) {
            console.error('Error marking as read:', error)
        }
    }

    const handleDelete = (id) => {
        setConfirmDialog({
            open: true,
            title: t('admin.contact.confirmDeleteTitle', 'Supprimer le message'),
            message: t('admin.contact.confirmDeleteMessage', 'Voulez-vous vraiment supprimer ce message ?'),
            onConfirm: async () => {
                try {
                    await apiRequest(`/contact/${id}`, { method: 'DELETE' })
                    setMessages(prev => prev.filter(m => m.id !== id))
                    if (selectedMessage?.id === id) {
                        setSelectedMessage(null)
                    }
                    closeConfirm()
                } catch (error) {
                    alert(t('admin.common.errorPrefix') + error.message)
                }
            }
        })
    }

    const openMessage = (msg) => {
        setSelectedMessage(msg)
        if (!msg.read) {
            markAsRead(msg.id)
        }
    }

    const filteredMessages = messages.filter(m => {
        if (filter === 'unread') return !m.read
        if (filter === 'read') return m.read
        return true
    })

    const unreadCount = messages.filter(m => !m.read).length

    const formatDate = (dateStr) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    if (loading) {
        return <div className="admin-loading"><div className="spinner-large"></div>{t('admin.header.loading')}</div>
    }

    return (
        <div>
            <div className="admin-card">
                <h2>
                    {t('admin.contact.title', 'Messages de contact')}
                    {unreadCount > 0 && (
                        <span style={{
                            background: 'var(--accent-red, #e74c3c)',
                            color: 'white',
                            borderRadius: '12px',
                            padding: '2px 10px',
                            fontSize: '0.8rem',
                            marginLeft: '10px',
                            verticalAlign: 'middle'
                        }}>
                            {unreadCount} {t('admin.contact.unread', 'non lu(s)')}
                        </span>
                    )}
                </h2>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <button
                        className={`btn-filter ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            border: '1px solid var(--border-color, #ddd)',
                            background: filter === 'all' ? 'var(--gold, #c9a227)' : 'transparent',
                            color: filter === 'all' ? 'white' : 'inherit',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        {t('admin.contact.filterAll', 'Tous')} ({messages.length})
                    </button>
                    <button
                        className={`btn-filter ${filter === 'unread' ? 'active' : ''}`}
                        onClick={() => setFilter('unread')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            border: '1px solid var(--border-color, #ddd)',
                            background: filter === 'unread' ? 'var(--gold, #c9a227)' : 'transparent',
                            color: filter === 'unread' ? 'white' : 'inherit',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        {t('admin.contact.filterUnread', 'Non lus')} ({unreadCount})
                    </button>
                    <button
                        className={`btn-filter ${filter === 'read' ? 'active' : ''}`}
                        onClick={() => setFilter('read')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            border: '1px solid var(--border-color, #ddd)',
                            background: filter === 'read' ? 'var(--gold, #c9a227)' : 'transparent',
                            color: filter === 'read' ? 'white' : 'inherit',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        {t('admin.contact.filterRead', 'Lus')} ({messages.length - unreadCount})
                    </button>
                </div>

                {filteredMessages.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--medium-gray)' }}>
                        {t('admin.contact.noMessages', 'Aucun message')}
                    </p>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '30px' }}></th>
                                <th>{t('admin.contact.from', 'De')}</th>
                                <th>{t('admin.contact.subject', 'Sujet')}</th>
                                <th>{t('admin.contact.date', 'Date')}</th>
                                <th>{t('admin.common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMessages.map(msg => (
                                <tr
                                    key={msg.id}
                                    onClick={() => openMessage(msg)}
                                    style={{
                                        cursor: 'pointer',
                                        fontWeight: msg.read ? 'normal' : 'bold',
                                        background: selectedMessage?.id === msg.id ? 'var(--bg-hover, rgba(201, 162, 39, 0.08))' : 'transparent'
                                    }}
                                >
                                    <td>
                                        {!msg.read && (
                                            <span style={{
                                                display: 'inline-block',
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '50%',
                                                background: 'var(--gold, #c9a227)'
                                            }} />
                                        )}
                                    </td>
                                    <td>
                                        <div>{msg.name}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{msg.email}</div>
                                    </td>
                                    <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {msg.subject}
                                    </td>
                                    <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                        {formatDate(msg.created_at)}
                                    </td>
                                    <td className="actions-cell" onClick={e => e.stopPropagation()}>
                                        <a
                                            href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                                            className="btn-edit"
                                            title={t('admin.contact.reply', 'Répondre')}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="9 17 4 12 9 7" />
                                                <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                                            </svg>
                                        </a>
                                        <button className="btn-delete" onClick={() => handleDelete(msg.id)}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedMessage && (
                <div className="admin-card" style={{ marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h3 style={{ margin: 0 }}>{selectedMessage.subject}</h3>
                            <p style={{ margin: '4px 0', fontSize: '0.9rem', opacity: 0.8 }}>
                                {t('admin.contact.from', 'De')} : <strong>{selectedMessage.name}</strong> &lt;{selectedMessage.email}&gt;
                            </p>
                            <p style={{ margin: '2px 0', fontSize: '0.85rem', opacity: 0.6 }}>
                                {formatDate(selectedMessage.created_at)}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <a
                                href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                                className="btn-add"
                                style={{ textDecoration: 'none' }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                                    <polyline points="9 17 4 12 9 7" />
                                    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                                </svg>
                                {t('admin.contact.reply', 'Répondre')}
                            </a>
                        </div>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color, #ddd)', margin: '1rem 0' }} />
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.95rem' }}>
                        {selectedMessage.message}
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

export default ContactAdmin
