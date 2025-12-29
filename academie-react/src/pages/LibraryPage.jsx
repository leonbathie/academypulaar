import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../config'
import './LibraryPage.css'

function LibraryPage() {
    const { t, i18n } = useTranslation()
    const [books, setBooks] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('')

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
        switch (i18n.language) {
            case 'en': return book.title_en || book.title_fr
            case 'ff': return book.title_ff || book.title_fr
            default: return book.title_fr
        }
    }

    const getDescription = (book) => {
        switch (i18n.language) {
            case 'en': return book.description_en || book.description_fr
            case 'ff': return book.description_ff || book.description_fr
            default: return book.description_fr
        }
    }

    const getCategoryLabel = (category) => {
        const labels = {
            roman: { fr: 'Roman', en: 'Novel', ff: 'Tinndi' },
            poesie: { fr: 'Poésie', en: 'Poetry', ff: 'Jimol' },
            essai: { fr: 'Essai', en: 'Essay', ff: 'Eseey' },
            histoire: { fr: 'Histoire', en: 'History', ff: 'Taariik' },
            linguistique: { fr: 'Linguistique', en: 'Linguistics', ff: 'Ɗemngal' },
            dictionnaire: { fr: 'Dictionnaire', en: 'Dictionary', ff: 'Saggitorde' },
            enfants: { fr: 'Livres enfants', en: 'Children Books', ff: 'Defte sukaaɓe' },
            autre: { fr: 'Autre', en: 'Other', ff: 'Goɗɗum' }
        }
        return labels[category]?.[i18n.language] || labels[category]?.fr || category
    }

    const formatFileSize = (bytes) => {
        if (!bytes) return ''
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const handleDownload = (bookId) => {
        window.open(`${API_URL}/api/books/${bookId}/download`, '_blank')
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
                    <p>Chargement des livres...</p>
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
                        <h1>{i18n.language === 'en' ? 'Digital Library' : i18n.language === 'ff' ? 'Defte Amen' : 'Bibliothèque Numérique'}</h1>
                        <p>
                            {i18n.language === 'en'
                                ? 'Discover and download our collection of books and publications in Pulaar'
                                : i18n.language === 'ff'
                                    ? 'Yiytu e aawto defte amen e ɗemngal Pulaar'
                                    : 'Découvrez et téléchargez notre collection de livres et publications en Pulaar'}
                        </p>
                        <div className="library-stats">
                            <div className="stat-item">
                                <span className="stat-number">{books.length}</span>
                                <span className="stat-label">{i18n.language === 'en' ? 'Books' : i18n.language === 'ff' ? 'Defte' : 'Livres'}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{books.reduce((acc, b) => acc + (b.downloads || 0), 0)}</span>
                                <span className="stat-label">{i18n.language === 'en' ? 'Downloads' : 'Téléchargements'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                {/* Filtres */}
                {categories.length > 0 && (
                    <div className="library-filters">
                        <span className="filter-label">{i18n.language === 'en' ? 'Filter by:' : 'Filtrer par:'}</span>
                        <div className="filter-buttons">
                            <button
                                className={`filter-btn ${selectedCategory === '' ? 'active' : ''}`}
                                onClick={() => setSelectedCategory('')}
                            >
                                {i18n.language === 'en' ? 'All' : i18n.language === 'ff' ? 'Fof' : 'Tous'}
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
                                    {getDescription(book) && (
                                        <p className="book-description">{getDescription(book)}</p>
                                    )}

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

                                        {/* Prix et boutons */}
                                        {book.is_free === false && book.price > 0 && (
                                            <div className="book-price">
                                                <span className="price-label">{book.price.toLocaleString()} FCFA</span>
                                            </div>
                                        )}
                                        {book.is_free !== false ? (
                                            book.file_path && (
                                                <button className="btn-download" onClick={() => handleDownload(book.id)}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                                        <polyline points="7 10 12 15 17 10" />
                                                        <line x1="12" y1="15" x2="12" y2="3" />
                                                    </svg>
                                                    {i18n.language === 'en' ? 'Free Download' : i18n.language === 'ff' ? 'Aawto Mehre' : 'Télécharger Gratuit'}
                                                </button>
                                            )
                                        ) : (
                                            book.payment_link ? (
                                                <a href={book.payment_link} target="_blank" rel="noopener noreferrer" className="btn-buy">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                                        <line x1="1" y1="10" x2="23" y2="10" />
                                                    </svg>
                                                    {i18n.language === 'en' ? 'Buy Now' : i18n.language === 'ff' ? 'Sood Jooni' : 'Acheter'}
                                                </a>
                                            ) : (
                                                <button className="btn-buy btn-disabled" disabled>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <line x1="12" y1="8" x2="12" y2="12" />
                                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                                    </svg>
                                                    {i18n.language === 'en' ? 'Contact us' : 'Nous contacter'}
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="no-books">
                        <div className="no-books-icon">📖</div>
                        <h3>{i18n.language === 'en' ? 'No books available yet' : i18n.language === 'ff' ? 'Alaa defte tawtaa' : 'Aucun livre disponible pour le moment'}</h3>
                        <p>{i18n.language === 'en' ? 'Check back soon for new publications!' : 'Revenez bientôt pour de nouvelles publications !'}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default LibraryPage
