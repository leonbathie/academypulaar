import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import TerminologyPageEditor from './TerminologyPageEditor'
import DomainContentEditor from './DomainContentEditor'

const TABS = [
    { id: 'page',          icon: '📄', labelKey: 'admin.terminology.tabPage' },
    { id: 'domainContent', icon: '🎓', labelKey: 'admin.terminology.tabDomainContent' }
]

function TerminologieAdmin() {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState('page')

    return (
        <div className="admin-page">
            <div className="admin-header">
                <div>
                    <h1>📘 {t('admin.terminology.title')}</h1>
                    <p>{t('admin.terminology.subtitle')}</p>
                </div>
            </div>

            <div className="admin-content">
                <div className="admin-tabs" role="tablist" aria-label={t('admin.terminology.title')}>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className="admin-tab-icon" aria-hidden="true">{tab.icon}</span>
                            <span>{t(tab.labelKey)}</span>
                        </button>
                    ))}
                </div>

                <div className="admin-tab-panel">
                    {activeTab === 'page' && <TerminologyPageEditor />}
                    {activeTab === 'domainContent' && <DomainContentEditor />}
                </div>
            </div>
        </div>
    )
}

export default TerminologieAdmin
