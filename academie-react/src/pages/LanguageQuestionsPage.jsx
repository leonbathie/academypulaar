import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './LanguageQuestionsPage.css'

function LanguageQuestionsPage() {
    const { t } = useTranslation()
    const [openIndex, setOpenIndex] = useState(null)

    const questions = [
        { q: t('languageQuestions.q1'), a: t('languageQuestions.a1') },
        { q: t('languageQuestions.q2'), a: t('languageQuestions.a2') },
        { q: t('languageQuestions.q3'), a: t('languageQuestions.a3') },
        { q: t('languageQuestions.q4'), a: t('languageQuestions.a4') },
        { q: t('languageQuestions.q5'), a: t('languageQuestions.a5') },
        { q: t('languageQuestions.q6'), a: t('languageQuestions.a6') }
    ]

    const toggle = (i) => {
        setOpenIndex(openIndex === i ? null : i)
    }

    return (
        <div className="lq-page">
            <div className="lq-header">
                <div className="container">
                    <h1 className="page-title">
                        {t('languageQuestions.title')} <span className="gold-accent">{t('languageQuestions.titleHighlight')}</span>
                    </h1>
                    <p className="page-subtitle">{t('languageQuestions.intro')}</p>
                </div>
            </div>

            <div className="container">
                <div className="lq-list">
                    {questions.map((item, i) => (
                        <div key={i} className={`lq-item ${openIndex === i ? 'open' : ''}`}>
                            <button className="lq-question" onClick={() => toggle(i)}>
                                <span className="lq-number">{String(i + 1).padStart(2, '0')}</span>
                                <span className="lq-text">{item.q}</span>
                                <svg className="lq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                            <div className="lq-answer">
                                <p>{item.a}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default LanguageQuestionsPage
