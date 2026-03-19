import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './ConfirmDialog.css'

function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmText, cancelText, danger = true }) {
    const { t } = useTranslation()

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [open])

    useEffect(() => {
        const handleKey = (e) => {
            if (!open) return
            if (e.key === 'Escape') onCancel()
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [open, onCancel])

    if (!open) return null

    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
                {title && <h3 className="confirm-title">{title}</h3>}
                <p className="confirm-message">{message}</p>
                <div className="confirm-actions">
                    <button className="confirm-btn confirm-btn-cancel" onClick={onCancel}>
                        {cancelText || t('admin.common.cancel', 'Annuler')}
                    </button>
                    <button className={`confirm-btn ${danger ? 'confirm-btn-danger' : 'confirm-btn-primary'}`} onClick={onConfirm}>
                        {confirmText || t('admin.common.confirm', 'Confirmer')}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmDialog
