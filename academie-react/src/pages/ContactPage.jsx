import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './ContactPage.css'

function ContactPage() {
    const { t, i18n } = useTranslation()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    })
    const [status, setStatus] = useState(null)

    const labels = {
        fr: {
            name: 'Nom complet',
            email: 'Email',
            subject: 'Sujet',
            message: 'Message',
            send: 'Envoyer',
            sending: 'Envoi en cours...',
            success: 'Message envoyé avec succès !',
            error: 'Une erreur est survenue. Veuillez réessayer.',
            required: 'Ce champ est requis'
        },
        en: {
            name: 'Full name',
            email: 'Email',
            subject: 'Subject',
            message: 'Message',
            send: 'Send',
            sending: 'Sending...',
            success: 'Message sent successfully!',
            error: 'An error occurred. Please try again.',
            required: 'This field is required'
        },
        ff: {
            name: 'Innde timmuɗe',
            email: 'Iimeel',
            subject: 'Toɓɓere',
            message: 'Ɓataake',
            send: 'Neldu',
            sending: 'Neldude...',
            success: 'Ɓataake neldaama!',
            error: 'Juumre waɗii. Fuɗɗito.',
            required: 'Ɗum waɗɗii'
        }
    }

    const l = labels[i18n.language] || labels.fr

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setStatus('sending')

        // Simulate sending (in production, use EmailJS or backend)
        setTimeout(() => {
            console.log('Form submitted:', formData)
            setStatus('success')
            setFormData({ name: '', email: '', subject: '', message: '' })

            // Reset status after 5 seconds
            setTimeout(() => setStatus(null), 5000)
        }, 1500)
    }

    return (
        <div className="contact-page">
            <div className="contact-page-header">
                <div className="container">
                    <h1 className="page-title">{t('common.contact')}</h1>
                    <p className="page-subtitle">
                        {i18n.language === 'ff'
                            ? 'Jokkondiren e amen'
                            : i18n.language === 'en'
                                ? 'Get in touch with us'
                                : 'Entrez en contact avec nous'}
                    </p>
                </div>
            </div>

            <div className="container">
                <div className="contact-layout">
                    <div className="contact-info">
                        <h2>
                            {i18n.language === 'ff' ? 'Kumpital' : i18n.language === 'en' ? 'Information' : 'Informations'}
                        </h2>

                        <div className="info-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            <div>
                                <h4>{i18n.language === 'ff' ? 'Ɗo ngonɗen' : i18n.language === 'en' ? 'Address' : 'Adresse'}</h4>
                                <p>Dakar, Sénégal</p>
                            </div>
                        </div>

                        <div className="info-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            <div>
                                <h4>Email</h4>
                                <p>contact@goomufulowidto.org</p>
                            </div>
                        </div>

                        <div className="info-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            <div>
                                <h4>{i18n.language === 'ff' ? 'Telefon' : i18n.language === 'en' ? 'Phone' : 'Téléphone'}</h4>
                                <p>+221 77 000 00 00</p>
                            </div>
                        </div>

                        <div className="social-links">
                            <a href="#" className="social-link" aria-label="Facebook">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                                </svg>
                            </a>
                            <a href="#" className="social-link" aria-label="Twitter">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                                </svg>
                            </a>
                            <a href="#" className="social-link" aria-label="Instagram">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    <form className="contact-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">{l.name}</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">{l.email}</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="subject">{l.subject}</label>
                            <input
                                type="text"
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">{l.message}</label>
                            <textarea
                                id="message"
                                name="message"
                                rows="5"
                                value={formData.message}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary submit-btn"
                            disabled={status === 'sending'}
                        >
                            {status === 'sending' ? l.sending : l.send}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                        </button>

                        {status === 'success' && (
                            <div className="form-status success">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                {l.success}
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="form-status error">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                {l.error}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ContactPage
