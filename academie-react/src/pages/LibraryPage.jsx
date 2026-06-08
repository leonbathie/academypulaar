import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../config'
import './LibraryPage.css'

function LibraryPage() {
    const { t, i18n } = useTranslation()
    const lang = (i18n.language || 'fr').substring(0, 2)
    const [books, setBooks] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('')
    const [expandedBooks, setExpandedBooks] = useState({})

    const toggleExpand = useCallback((bookId) => {
        setExpandedBooks(prev => ({ ...prev, [bookId]: !prev[bookId] }))
    }, [])

    useEffect(() => {
        loadBooks()
    }, [])

    const loadBooks = async () => {
        try {
            const response = await fetch(`${API_URL}/api/books?published=true`)
            if (response.ok) {
                const data = await response.json()
                setBooks(data)
            }
        } catch (error) {
            console.error('Error loading books:', error)
        } finally {
            setLoading(false)
        }
    }

    const getTitle = (book) => {
        switch (lang) {
            case 'en': return book.title_en || book.title_fr
            case 'ff': return book.title_ff || book.title_fr
            default: return book.title_fr
        }
    }

    const getDescription = (book) => {
        switch (lang) {
            case 'en': return book.description_en || book.description_fr
            case 'ff': return book.description_ff || book.description_fr
            default: return book.description_fr
        }
    }

    const getCategoryLabel = (category) => {
        const labels = {
            celluka: { fr: 'Apprendre le Fulfulde', en: 'Learning Fulfulde', ff: 'Celluka/ Mbinndiin Fulfulde' },
            caggitorde: { fr: 'Dictionnaires', en: 'Dictionaries', ff: 'Caggitorɗe' },
            conce: { fr: 'Littérature', en: 'Literature', ff: 'Coñce' },
            ganndine: { fr: 'Sciences', en: 'Sciences', ff: 'Ganndine' }
        }
        return labels[category]?.[lang] || labels[category]?.fr || category
    }

    const formatFileSize = (bytes) => {
        if (!bytes) return ''
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const handleDownload = (bookId) => {
        // Téléchargement direct sans ouvrir d'onglet : le serveur renvoie
        // Content-Disposition: attachment, donc le lien déclenche le
        // téléchargement sans navigation de la page.
        const link = document.createElement('a')
        link.href = `${API_URL}/api/books/${bookId}/download`
        link.setAttribute('download', '')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const categories = [...new Set(books.map(b => b.category).filter(Boolean))]

    const filteredBooks = selectedCategory
        ? books.filter(b => b.category === selectedCategory)
        : books

    if (loading) {
        return (
            <div className="library-page">
                <div className="library-loading">
                    <div className="spinner"></div>
                    <p>{t('admin.header.loadingBooks')}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="library-page">
            {/* Header */}
            <div className="library-header">
                <div className="container">
                    <div className="library-header-content">
                        <div className="library-icon">📚</div>
                        <h1>{t('library.title')}</h1>
                        <p>
                            {t('library.intro')}
                        </p>
                        <div className="library-stats">
                            <div className="stat-item">
                                <span className="stat-number">{books.length}</span>
                                <span className="stat-label">{t('library.stats.books')}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{books.reduce((acc, b) => acc + (b.downloads || 0), 0)}</span>
                                <span className="stat-label">{t('library.stats.downloads')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                {/* Filtres */}
                {categories.length > 0 && (
                    <div className="library-filters">
                        <span className="filter-label">{t('library.filters.label')}</span>
                        <div className="filter-buttons">
                            <button
                                className={`filter-btn ${selectedCategory === '' ? 'active' : ''}`}
                                onClick={() => setSelectedCategory('')}
                            >
                                {t('library.filters.all')}
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {getCategoryLabel(cat)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Grille de livres */}
                {filteredBooks.length > 0 ? (
                    <div className="books-grid">
                        {filteredBooks.map(book => (
                            <article key={book.id} className="book-card">
                                <div className="book-cover">
                                    {book.cover_image ? (
                                        <img src={`${API_URL}${book.cover_image}`} alt={getTitle(book)} />
                                    ) : (
                                        <div className="book-cover-placeholder">
                                            <svg viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M6.5 2h11a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 2v16h11V4h-11zm2 2h7v2h-7V6zm0 4h7v2h-7v-2zm0 4h4v2h-4v-2z" />
                                            </svg>
                                        </div>
                                    )}
                                    {book.category && (
                                        <span className="book-badge">{getCategoryLabel(book.category)}</span>
                                    )}
                                </div>

                                <div className="book-content">
                                    <h3 className="book-title">{getTitle(book)}</h3>
                                    {book.author && (
                                        <p className="book-author">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                            {book.author}
                                        </p>
                                    )}
                                    {getDescription(book) && (() => {
                                        const desc = getDescription(book)
                                        const isExpanded = expandedBooks[book.id]
                                        const isLong = desc.length > 120
                                        return (
                                            <>
                                                <p className={`book-description${isExpanded ? ' expanded' : ''}`}>
                                                    {isExpanded ? desc : isLong ? desc.substring(0, 120) + '...' : desc}
                                                </p>
                                                {isLong && (
                                                    <button className="btn-read-more" onClick={() => toggleExpand(book.id)}>
                                                        {isExpanded ? t('common.readLess', 'Réduire') : t('common.readMore', 'Lire la suite')}
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                                                            <path d={isExpanded ? "M19 12H5M12 5l-7 7 7 7" : "M5 12h14M12 5l7 7-7 7"} />
                                                        </svg>
                                                    </button>
                                                )}
                                            </>
                                        )
                                    })()}

                                    <div className="book-footer">
                                        <div className="book-meta">
                                            {book.year && (
                                                <span className="meta-item">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                        <line x1="16" y1="2" x2="16" y2="6" />
                                                        <line x1="8" y1="2" x2="8" y2="6" />
                                                        <line x1="3" y1="10" x2="21" y2="10" />
                                                    </svg>
                                                    {book.year}
                                                </span>
                                            )}
                                            {book.file_size && (
                                                <span className="meta-item">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                        <polyline points="14 2 14 8 20 8" />
                                                    </svg>
                                                    {formatFileSize(book.file_size)}
                                                </span>
                                            )}
                                            <span className="meta-item downloads">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                                {book.downloads || 0}
                                            </span>
                                        </div>

                                        {/* Bouton de téléchargement simple */}
                                        {book.file_path && (
                                            <button className="btn-download" onClick={() => handleDownload(book.id)}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                                {i18n.language === 'en' ? 'Download' : i18n.language === 'ff' ? 'Aawto' : 'Télécharger'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="no-books">
                        <div className="no-books-icon">📖</div>
                        <h3>{i18n.language === 'en' ? 'No books available' : i18n.language === 'ff' ? 'Alaa defte' : 'Aucun livre disponible'}</h3>
                    </div>
                )}
            </div>
        </div>
    )
}

export default LibraryPage
