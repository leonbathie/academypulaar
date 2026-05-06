import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../context/AuthContext'

function TerminologieAdmin() {
    const { t } = useTranslation()
    const { apiRequest } = useApi()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({ key: '', value_fr: '', value_en: '', value_ff: '' })

    useEffect(() => { load() }, [])

    const load = async () => {
        try {
            setLoading(true)
            const data = await apiRequest('/terminologie')
            // data is map: key -> {value_fr,value_en,value_ff}
            const arr = Object.keys(data).map(k => ({ key: k, ...data[k] }))
            setItems(arr)
        } catch (err) {
            console.error('Load terminologie', err)
        } finally {
            setLoading(false)
        }
    }

    const openEdit = (item) => {
        setEditing(item.key)
        setForm({ key: item.key, value_fr: item.value_fr || '', value_en: item.value_en || '', value_ff: item.value_ff || '' })
    }

    const openNew = () => {
        setEditing('new')
        setForm({ key: '', value_fr: '', value_en: '', value_ff: '' })
    }

    const save = async (e) => {
        e.preventDefault()
        try {
            const entries = [{ key: form.key, value_fr: form.value_fr, value_en: form.value_en, value_ff: form.value_ff }]
            await apiRequest('/terminologie', { method: 'POST', body: JSON.stringify({ entries }) })
            setEditing(null)
            await load()
        } catch (err) {
            alert(t('admin.common.errorPrefix') + (err.message || err))
        }
    }

    const remove = async (key) => {
        if (!window.confirm(t('admin.common.confirmDeleteContent'))) return
        try {
            await apiRequest(`/terminologie/${encodeURIComponent(key)}`, { method: 'DELETE' })
            await load()
        } catch (err) {
            alert(t('admin.common.errorPrefix') + (err.message || err))
        }
    }

    if (loading) return <div className="admin-loading"><div className="spinner-large" />{t('admin.header.loading')}</div>

    return (
        <div>
            <div className="admin-card">
                <h2>
                    {t('admin.terminology.title', 'Terminologie')}
                    <button className="btn-add" onClick={openNew}>{t('admin.common.add')}</button>
                </h2>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Key</th>
                            <th>FR</th>
                            <th>EN</th>
                            <th>FF</th>
                            <th>{t('admin.common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(it => (
                            <tr key={it.key}>
                                <td><strong>{it.key}</strong></td>
                                <td style={{ whiteSpace: 'pre-wrap' }}>{it.value_fr}</td>
                                <td style={{ whiteSpace: 'pre-wrap' }}>{it.value_en}</td>
                                <td style={{ whiteSpace: 'pre-wrap' }}>{it.value_ff}</td>
                                <td className="actions-cell">
                                    <button className="btn-edit" onClick={() => openEdit(it)}>{t('admin.common.edit')}</button>
                                    <button className="btn-delete" onClick={() => remove(it.key)}>{t('admin.common.delete')}</button>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>{t('admin.terminology.noItems', 'Aucun élément')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {editing && (
                <div className="modal-overlay" onClick={() => setEditing(null)}>
                    <div className="modal modal-large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editing === 'new' ? t('admin.common.add') : t('admin.common.edit')}</h3>
                            <button className="modal-close" onClick={() => setEditing(null)}>×</button>
                        </div>
                        <form className="modal-form" onSubmit={save}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Key</label>
                                    <input required value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>FR</label>
                                    <textarea rows={3} value={form.value_fr} onChange={e => setForm({ ...form, value_fr: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>EN</label>
                                    <textarea rows={3} value={form.value_en} onChange={e => setForm({ ...form, value_en: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>FF</label>
                                    <textarea rows={3} value={form.value_ff} onChange={e => setForm({ ...form, value_ff: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setEditing(null)}>{t('admin.common.cancel')}</button>
                                <button type="submit" className="btn-save">{t('admin.common.save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TerminologieAdmin
