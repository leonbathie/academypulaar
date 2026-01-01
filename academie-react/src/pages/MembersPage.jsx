import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../config'
import './MembersPage.css'

function MembersPage() {
    const { t, i18n } = useTranslation()
    const [members, setMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedBios, setExpandedBios] = useState({})

    useEffect(() => {
        loadMembers()
    }, [])

    const loadMembers = async () => {
        try {
            const response = await fetch(`${API_URL}/api/members`)
            if (response.ok) {
                const data = await response.json()
                setMembers(data)
            }
        } catch (error) {
            console.error('Error loading members:', error)
        } finally {
            setLoading(false)
        }
    }

    const getRole = (member) => {
        switch (i18n.language) {
            case 'en': return member.role_en || member.role_fr
            case 'ff': return member.role_ff || member.role_fr
            default: return member.role_fr
        }
    }

    const getBio = (member) => {
        switch (i18n.language) {
            case 'en': return member.bio_en || member.bio_fr
            case 'ff': return member.bio_ff || member.bio_fr
            default: return member.bio_fr
        }
    }

    const toggleBio = (memberId) => {
        setExpandedBios(prev => ({
            ...prev,
            [memberId]: !prev[memberId]
        }))
    }

    const truncateBio = (text, maxLength = 100) => {
        if (!text || text.length <= maxLength) return text
        return text.substring(0, maxLength) + '...'
    }

    if (loading) {
        return (
            <div className="members-page">
                <div className="members-page-header">
                    <div className="container">
                        <h1 className="page-title">{t('nav.immortals')}</h1>
                    </div>
                </div>
                <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <div className="spinner"></div>
                    <p>{t('admin.header.loadingMembers')}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="members-page">
            <div className="members-page-header">
                <div className="container">
                    <h1 className="page-title">
                        {t('nav.immortals')}
                    </h1>
                    <p className="page-subtitle">
                        {t('features.immortals.description')}
                    </p>
                </div>
            </div>

            <div className="container">
                {members.length > 0 ? (
                    <div className="members-grid">
                        {members.map((member) => {
                            const bio = getBio(member)
                            const isExpanded = expandedBios[member.id]
                            const displayBio = isExpanded ? bio : truncateBio(bio)
                            const showReadMore = bio && bio.length > 100

                            return (
                                <article key={member.id} className="member-card">
                                    <div className="member-image">
                                        {member.image ? (
                                            <img
                                                src={`${API_URL}${member.image}`}
                                                alt={member.name}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="member-placeholder">
                                                <span>👤</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="member-info">
                                        <h3 className="member-name">{member.name}</h3>
                                        <span className="member-role">{getRole(member)}</span>
                                        {member.specialty && (
                                            <p className="member-specialty">{member.specialty}</p>
                                        )}
                                        {bio && (
                                            <div className="member-bio-container">
                                                <p className="member-bio">{displayBio}</p>
                                                {showReadMore && (
                                                    <button
                                                        className="btn-read-more"
                                                        onClick={() => toggleBio(member.id)}
                                                    >
                                                        {isExpanded ? t('members.readLess') : t('members.readMore')}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {member.joined && (
                                            <span className="member-joined">
                                                {t('members.since')} {member.joined}
                                            </span>
                                        )}

                                        {/* Réseaux sociaux */}
                                        {(member.email || member.website || member.facebook || member.twitter || member.linkedin) && (
                                            <div className="member-social">
                                                {member.email && (
                                                    <a href={`mailto:${member.email}`} title="Email" className="social-link">
                                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                                        </svg>
                                                    </a>
                                                )}
                                                {member.website && (
                                                    <a href={member.website} target="_blank" rel="noopener noreferrer" title="Site web" className="social-link">
                                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                                        </svg>
                                                    </a>
                                                )}
                                                {member.facebook && (
                                                    <a href={member.facebook} target="_blank" rel="noopener noreferrer" title="Facebook" className="social-link">
                                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
                                                        </svg>
                                                    </a>
                                                )}
                                                {member.twitter && (
                                                    <a href={member.twitter} target="_blank" rel="noopener noreferrer" title="Twitter/X" className="social-link">
                                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                                        </svg>
                                                    </a>
                                                )}
                                                {member.linkedin && (
                                                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="social-link">
                                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                                                        </svg>
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                ) : (
                    <div className="no-members" style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <p style={{ color: 'var(--medium-gray)' }}>{t('members.noMembers')}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MembersPage
