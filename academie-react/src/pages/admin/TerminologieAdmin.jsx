import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import TerminologyPageEditor from './TerminologyPageEditor'
import DomainContentEditor from './DomainContentEditor'
import './_terminologie-redesign.css'

const TABS = [
    { id: 'page',          icon: '📄', labelKey: 'admin.terminology.tabPage' },
    { id: 'domainContent', icon: '🎓', labelKey: 'admin.terminology.tabDomainContent' }
]

function TerminologieAdmin() {
    const { t } = useTranslation()
    const { apiRequest } = useApi()
    const { settings, refreshSettings } = useSettings()
    const [activeTab, setActiveTab] = useState('page')
    const [savingVisibility, setSavingVisibility] = useState(false)
    const activeTabConfig = TABS.find(tab => tab.id === activeTab)

    const visible = settings.terminologie_visible !== false

    const toggleVisibility = async () => {
        const next = !visible
        setSavingVisibility(true)
        try {
            await apiRequest('/settings/terminologie_visible', {
                method: 'PUT',
                body: JSON.stringify({ value: next })
            })
            await refreshSettings()
        } catch (error) {
            console.error('Toggle terminologie visibility error:', error)
        } finally {
            setSavingVisibility(false)
        }
    }

    return (
        <div className="terminology-admin-page">
            <div className="admin-header">
                <div className="terminology-admin-titleblock">
                    <h1>{t('admin.terminology.title')}</h1>
                    <p className="terminology-admin-subtitle">
                        {t('admin.terminology.subtitle')}
                    </p>
                </div>
            </div>

            <div className="admin-card terminology-visibility-card">
                <div className="terminology-visibility-copy">
                    <h2>{t('admin.terminology.visibilityTitle')}</h2>
                    <p>{t('admin.terminology.visibilityHelp')}</p>
                </div>
                <button
                    type="button"
                    className={`terminology-visibility-toggle ${visible ? 'is-on' : 'is-off'}`}
                    role="switch"
                    aria-checked={visible}
                    disabled={savingVisibility}
                    onClick={toggleVisibility}
                >
                    <span className="terminology-visibility-track" aria-hidden="true">
                        <span className="terminology-visibility-thumb" />
                    </span>
                    <span className="terminology-visibility-state">
                        {visible
                            ? t('admin.terminology.visibilityVisible')
                            : t('admin.terminology.visibilityHidden')}
                    </span>
                </button>
            </div>

            <div className="admin-card">
                <div className="terminology-admin-hero">
                    <div className="terminology-admin-hero-copy">
                        <span className="terminology-admin-kicker">{t('admin.terminology.pageTitle')}</span>
                        <h2>{t('admin.terminology.pageHelp')}</h2>
                    </div>
                    <div className="terminology-admin-hero-pill">
                        <span aria-hidden="true">{activeTabConfig?.icon}</span>
                        <span>{t(activeTabConfig?.labelKey)}</span>
                    </div>
                </div>

                <div className="admin-tabs terminology-admin-tabs" role="tablist" aria-label={t('admin.terminology.title')}>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            className={`admin-tab terminology-admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className="terminology-admin-tab-icon" aria-hidden="true">
                                {tab.icon}
                            </span>
                            {t(tab.labelKey)}
                        </button>
                    ))}
                </div>

                <div className="admin-tab-panel terminology-admin-panel">
                    {activeTab === 'page' && <TerminologyPageEditor />}
                    {activeTab === 'domainContent' && <DomainContentEditor />}
                </div>
            </div>
        </div>
    )
}

export default TerminologieAdmin
