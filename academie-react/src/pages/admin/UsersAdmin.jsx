import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth, useApi } from '../../context/AuthContext'
import './UsersAdmin.css'

function UsersAdmin() {
    const { t } = useTranslation()
    const { isAdmin } = useAuth()
    const { apiRequest } = useApi()

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
            setSuccess(`Invitation envoyée à ${inviteEmail}`)
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
            setSuccess('Rôle mis à jour')
            loadData()
        } catch (err) {
            setError(err.message)
        }
    }

    const handleDeleteUser = async (userId, username) => {
        if (!window.confirm(`Supprimer l'utilisateur "${username}" ?`)) return
        setError('')
        try {
            await apiRequest(`/auth/users/${userId}`, { method: 'DELETE' })
            setSuccess('Utilisateur supprimé')
            loadData()
        } catch (err) {
            setError(err.message)
        }
    }

    const handleDeleteInvitation = async (invId) => {
        setError('')
        try {
            await apiRequest(`/auth/invitations/${invId}`, { method: 'DELETE' })
            setSuccess('Invitation supprimée')
            loadData()
        } catch (err) {
            setError(err.message)
        }
    }

    if (!isAdmin) {
        return <div className="users-admin"><p>Accès réservé aux administrateurs.</p></div>
    }

    if (loading) {
        return <div className="users-admin"><div className="spinner-large"></div></div>
    }

    const roleLabels = {
        admin: 'Admin',
        moderateur: 'Modérateur',
        superviseur: 'Superviseur'
    }

    return (
        <div className="users-admin">
            <h2>{t('admin.users.title', 'Gestion des utilisateurs')}</h2>

            {error && <div className="users-alert users-alert-error">{error}</div>}
            {success && <div className="users-alert users-alert-success">{success}</div>}

            {/* Formulaire d'invitation */}
            <div className="users-section">
                <h3>{t('admin.users.invite', 'Inviter un utilisateur')}</h3>
                <form onSubmit={handleInvite} className="invite-form">
                    <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@exemple.com"
                        required
                    />
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                        <option value="moderateur">Modérateur</option>
                        <option value="superviseur">Superviseur</option>
                        <option value="admin">Admin</option>
                    </select>
                    <button type="submit" disabled={inviting} className="btn-invite">
                        {inviting ? 'Envoi...' : 'Inviter'}
                    </button>
                </form>
                <p className="invite-note">
                    L'utilisateur devra se connecter avec Google en utilisant cet email.
                </p>
            </div>

            {/* Invitations en cours */}
            {invitations.length > 0 && (
                <div className="users-section">
                    <h3>{t('admin.users.pendingInvitations', 'Invitations en cours')}</h3>
                    <div className="users-table-wrapper">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Rôle</th>
                                    <th>Invité par</th>
                                    <th>Expire</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invitations.map(inv => (
                                    <tr key={inv.id} className={inv.used ? 'row-used' : ''}>
                                        <td>{inv.email}</td>
                                        <td><span className={`role-badge role-${inv.role}`}>{roleLabels[inv.role]}</span></td>
                                        <td>{inv.invited_by_name}</td>
                                        <td>{new Date(inv.expires_at).toLocaleDateString('fr-FR')}</td>
                                        <td>
                                            {inv.used ? (
                                                <span className="status-used">Utilisée</span>
                                            ) : new Date(inv.expires_at) < new Date() ? (
                                                <span className="status-expired">Expirée</span>
                                            ) : (
                                                <span className="status-pending">En attente</span>
                                            )}
                                        </td>
                                        <td>
                                            {!inv.used && (
                                                <button
                                                    className="btn-delete-sm"
                                                    onClick={() => handleDeleteInvitation(inv.id)}
                                                >
                                                    Supprimer
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
                <h3>{t('admin.users.list', 'Utilisateurs')} ({users.length})</h3>
                <div className="users-table-wrapper">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Email</th>
                                <th>Rôle</th>
                                <th>Google</th>
                                <th>Invité par</th>
                                <th>Créé le</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td className="user-name">{u.username}</td>
                                    <td>{u.email || '—'}</td>
                                    <td>
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                            className={`role-select role-${u.role}`}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="moderateur">Modérateur</option>
                                            <option value="superviseur">Superviseur</option>
                                        </select>
                                    </td>
                                    <td>{u.has_google ? '✓' : '—'}</td>
                                    <td>{u.invited_by_name || '—'}</td>
                                    <td>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                                    <td>
                                        <button
                                            className="btn-delete-sm"
                                            onClick={() => handleDeleteUser(u.id, u.username)}
                                        >
                                            Supprimer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default UsersAdmin
