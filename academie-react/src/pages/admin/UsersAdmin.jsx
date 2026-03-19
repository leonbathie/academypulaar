import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth, useApi } from '../../context/AuthContext'
import ConfirmDialog from '../../components/ConfirmDialog'
import './UsersAdmin.css'

function UsersAdmin() {
    const { t, i18n } = useTranslation()
    const { isAdmin, isSuperAdmin } = useAuth()
    const { apiRequest } = useApi()
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null })

    const [users, setUsers] = useState([])
    const [invitations, setInvitations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Formulaire invitation
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState('moderateur')
    const [inviting, setInviting] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [usersData, invitationsData] = await Promise.all([
                apiRequest('/auth/users'),
                apiRequest('/auth/invitations')
            ])
            setUsers(usersData)
            setInvitations(invitationsData)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleInvite = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setInviting(true)

        try {
            await apiRequest('/auth/invitations', {
                method: 'POST',
                body: JSON.stringify({ email: inviteEmail, role: inviteRole })
            })
            setSuccess(t('admin.users.inviteSent', { email: inviteEmail }))
            setInviteEmail('')
            setInviteRole('moderateur')
            loadData()
        } catch (err) {
            setError(err.message)
        } finally {
            setInviting(false)
        }
    }

    const handleChangeRole = async (userId, newRole) => {
        setError('')
        try {
            await apiRequest(`/auth/users/${userId}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role: newRole })
            })
            setSuccess(t('admin.users.roleUpdated'))
            loadData()
        } catch (err) {
            setError(err.message)
        }
    }

    const handleDeleteUser = (userId, username) => {
        setConfirmDialog({
            open: true,
            title: t('admin.users.confirmDeleteTitle', 'Supprimer l\'utilisateur'),
            message: t('admin.users.confirmDelete', { username }),
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, open: false }))
                setError('')
                try {
                    await apiRequest(`/auth/users/${userId}`, { method: 'DELETE' })
                    setSuccess(t('admin.users.userDeleted'))
                    loadData()
                } catch (err) {
                    setError(err.message)
                }
            }
        })
    }

    const handleDeleteInvitation = async (invId) => {
        setError('')
        try {
            await apiRequest(`/auth/invitations/${invId}`, { method: 'DELETE' })
            setSuccess(t('admin.users.invitationDeleted'))
            loadData()
        } catch (err) {
            setError(err.message)
        }
    }

    if (!isAdmin) {
        return <div className="users-admin"><p>{t('admin.users.accessDenied')}</p></div>
    }

    if (loading) {
        return <div className="users-admin"><div className="spinner-large"></div></div>
    }

    const roleLabels = {
        admin: t('admin.users.roleAdmin'),
        moderateur: t('admin.users.roleModerator')
    }

    return (
        <div className="users-admin">
            <h2>{t('admin.users.title')}</h2>

            {error && <div className="users-alert users-alert-error">{error}</div>}
            {success && <div className="users-alert users-alert-success">{success}</div>}

            {/* Formulaire d'invitation */}
            <div className="users-section">
                <h3>{t('admin.users.invite')}</h3>
                <form onSubmit={handleInvite} className="invite-form">
                    <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@exemple.com"
                        required
                    />
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                        <option value="moderateur">{t('admin.users.roleModerator')}</option>
                        <option value="admin">{t('admin.users.roleAdmin')}</option>
                    </select>
                    <button type="submit" disabled={inviting} className="btn-invite">
                        {inviting ? t('admin.users.sending') : t('admin.users.inviteBtn')}
                    </button>
                </form>
                <p className="invite-note">
                    {t('admin.users.inviteNote')}
                </p>
            </div>

            {/* Invitations en cours */}
            {invitations.length > 0 && (
                <div className="users-section">
                    <h3>{t('admin.users.pendingInvitations')}</h3>
                    <div className="users-table-wrapper">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>{t('admin.users.email')}</th>
                                    <th>{t('admin.users.role')}</th>
                                    <th>{t('admin.users.invitedBy')}</th>
                                    <th>{t('admin.users.expires')}</th>
                                    <th>{t('admin.users.status')}</th>
                                    <th>{t('admin.users.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invitations.map(inv => (
                                    <tr key={inv.id} className={inv.used ? 'row-used' : ''}>
                                        <td>{inv.email}</td>
                                        <td><span className={`role-badge role-${inv.role}`}>{roleLabels[inv.role]}</span></td>
                                        <td>{inv.invited_by_name}</td>
                                        <td>{inv.expires_at ? new Date(inv.expires_at).toLocaleDateString(i18n.language) : '—'}</td>
                                        <td>
                                            {inv.used ? (
                                                <span className="status-used">{t('admin.users.statusUsed')}</span>
                                            ) : (
                                                <span className="status-pending">{t('admin.users.statusPending')}</span>
                                            )}
                                        </td>
                                        <td>
                                            {!inv.used && (
                                                <button
                                                    className="btn-delete-sm"
                                                    onClick={() => handleDeleteInvitation(inv.id)}
                                                >
                                                    {t('admin.users.deleteBtn')}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Liste des utilisateurs */}
            <div className="users-section">
                <h3>{t('admin.users.list')} ({users.length})</h3>
                <div className="users-table-wrapper">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>{t('admin.users.name')}</th>
                                <th>{t('admin.users.email')}</th>
                                <th>{t('admin.users.role')}</th>
                                <th>{t('admin.users.google')}</th>
                                <th>{t('admin.users.invitedBy')}</th>
                                <th>{t('admin.users.createdAt')}</th>
                                {isAdmin && <th>{t('admin.users.actions')}</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td className="user-name">{u.username}</td>
                                    <td>{u.email || '—'}</td>
                                    <td>
                                        {(isSuperAdmin && !u.is_super_admin) || (isAdmin && !isSuperAdmin && u.role === 'moderateur') ? (
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                                className={`role-select role-${u.role}`}
                                            >
                                                <option value="admin">{t('admin.users.roleAdmin')}</option>
                                                <option value="moderateur">{t('admin.users.roleModerator')}</option>
                                            </select>
                                        ) : (
                                            <span className={`role-badge role-${u.role}`}>{roleLabels[u.role]}</span>
                                        )}
                                    </td>
                                    <td>{u.has_google ? '✓' : '—'}</td>
                                    <td>{u.invited_by_name || '—'}</td>
                                    <td>{new Date(u.created_at).toLocaleDateString(i18n.language)}</td>
                                    {isAdmin && (
                                        <td>
                                            {!u.is_super_admin && (isSuperAdmin || u.role !== 'admin') && (
                                                <button
                                                    className="btn-delete-sm"
                                                    onClick={() => handleDeleteUser(u.id, u.username)}
                                                >
                                                    {t('admin.users.deleteBtn')}
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={useCallback(() => setConfirmDialog(prev => ({ ...prev, open: false })), [])}
                confirmText={t('admin.users.deleteBtn')}
            />
        </div>
    )
}

export default UsersAdmin
