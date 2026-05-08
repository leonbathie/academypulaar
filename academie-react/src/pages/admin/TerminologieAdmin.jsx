import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import TerminologyPageEditor from './TerminologyPageEditor'
import DomainContentEditor from './DomainContentEditor'
import './_terminologie-redesign.css'

const TABS = [
    { id: 'page',          icon: '📄', labelKey: 'admin.terminology.tabPage' },
    { id: 'domainContent', icon: '🎓', labelKey: 'admin.terminology.tabDomainContent' }
]

function TerminologieAdmin() {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState('page')
    const activeTabConfig = TABS.find(tab => tab.id === activeTab)

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
