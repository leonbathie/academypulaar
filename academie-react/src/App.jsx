import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SettingsProvider, useSettings } from './context/SettingsContext'
import ScrollToHash from './components/ScrollToHash'
import PageTracker from './components/PageTracker'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import './App.css'

// Pages publiques courantes : lazy mais avec preload sur idle (cf. plus bas)
const DictionaryPage = lazy(() => import('./pages/DictionaryPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const HistoirePage = lazy(() => import('./pages/HistoirePage'))
const MissionsPage = lazy(() => import('./pages/MissionsPage'))
const LibraryPage = lazy(() => import('./pages/LibraryPage'))
const LanguageQuestionsPage = lazy(() => import('./pages/LanguageQuestionsPage'))
const TerminologyPage = lazy(() => import('./pages/TerminologyPage'))
const DomainPage = lazy(() => import('./pages/DomainPage'))
const MentionsLegalesPage = lazy(() => import('./pages/MentionsLegalesPage'))
const ConfidentialitePage = lazy(() => import('./pages/ConfidentialitePage'))
const DireNePasDirePage = lazy(() => import('./pages/DireNePasDirePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// Routes admin : lazy strict (jamais charges pour les visiteurs anonymes)
const LoginPage = lazy(() => import('./pages/LoginPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const DashboardAdmin = lazy(() => import('./pages/admin/DashboardAdmin'))
const DictionaryAdmin = lazy(() => import('./pages/admin/DictionaryAdmin'))
const NewsAdmin = lazy(() => import('./pages/admin/NewsAdmin'))
const ContentAdmin = lazy(() => import('./pages/admin/ContentAdmin'))
const BooksAdmin = lazy(() => import('./pages/admin/BooksAdmin'))
const ScholarsAdmin = lazy(() => import('./pages/admin/ScholarsAdmin'))
const QuestionsAdmin = lazy(() => import('./pages/admin/QuestionsAdmin'))
const StatsAdmin = lazy(() => import('./pages/admin/StatsAdmin'))
const UsersAdmin = lazy(() => import('./pages/admin/UsersAdmin'))
const ContactAdmin = lazy(() => import('./pages/admin/ContactAdmin'))
const TerminologieAdmin = lazy(() => import('./pages/admin/TerminologieAdmin'))

function PageLoader() {
    return (
        <div style={{
            minHeight: '50vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }} aria-label="Chargement">
            <div className="spinner-large" />
        </div>
    )
}

// Garde la page terminologie : visible publiquement selon le réglage admin,
// mais toujours accessible aux admins (pour prévisualiser quand elle est cachée).
function TerminologyGuard({ children }) {
    const { settings, loading } = useSettings()
    const { isAdmin } = useAuth()

    if (loading) {
        return <PageLoader />
    }
    if (settings.terminologie_visible === false && !isAdmin) {
        return <NotFoundPage />
    }
    return children
}

function PublicLayout() {
    return (
        <div className="app">
            <Header />
            <main>
                <Suspense fallback={<PageLoader />}>
                    <Outlet />
                </Suspense>
            </main>
            <Footer />
        </div>
    )
}

function AdminLazyLayout() {
    return (
        <Suspense fallback={<PageLoader />}>
            <AdminPage />
        </Suspense>
    )
}

function App() {
    return (
        <AuthProvider>
            <SettingsProvider>
            <ThemeProvider>
                <BrowserRouter>
                    <ScrollToHash />
                    <PageTracker />
                    <Routes>
                        {/* Routes publiques — meme Header/Footer partage */}
                        <Route element={<PublicLayout />}>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/dictionnaire" element={<DictionaryPage />} />
                            <Route path="/contact" element={<ContactPage />} />
                            <Route path="/a-propos" element={<AboutPage />} />
                            <Route path="/a-propos/histoire" element={<HistoirePage />} />
                            <Route path="/a-propos/missions" element={<MissionsPage />} />
                            <Route path="/bibliotheque" element={<LibraryPage />} />
                            <Route path="/questions-langue" element={<LanguageQuestionsPage />} />
                            <Route path="/dire" element={<DireNePasDirePage />} />
                            <Route path="/terminologie" element={<TerminologyGuard><TerminologyPage /></TerminologyGuard>} />
                            <Route path="/terminologie/:domain" element={<TerminologyGuard><DomainPage /></TerminologyGuard>} />
                            <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
                            <Route path="/confidentialite" element={<ConfidentialitePage />} />
                            <Route path="*" element={<NotFoundPage />} />
                        </Route>

                        {/* Routes admin (chargees uniquement quand visitees) */}
                        <Route path="/login" element={
                            <Suspense fallback={<PageLoader />}><LoginPage /></Suspense>
                        } />
                        <Route path="/admin" element={<AdminLazyLayout />}>
                            <Route index element={
                                <Suspense fallback={<PageLoader />}><DashboardAdmin /></Suspense>
                            } />
                            <Route path="dictionnaire" element={
                                <Suspense fallback={<PageLoader />}><DictionaryAdmin /></Suspense>
                            } />
                            <Route path="actualites" element={
                                <Suspense fallback={<PageLoader />}><NewsAdmin /></Suspense>
                            } />
                            <Route path="contenu" element={
                                <Suspense fallback={<PageLoader />}><ContentAdmin /></Suspense>
                            } />
                            <Route path="bibliotheque" element={
                                <Suspense fallback={<PageLoader />}><BooksAdmin /></Suspense>
                            } />
                            <Route path="savants" element={
                                <Suspense fallback={<PageLoader />}><ScholarsAdmin /></Suspense>
                            } />
                            <Route path="questions" element={
                                <Suspense fallback={<PageLoader />}><QuestionsAdmin /></Suspense>
                            } />
                            <Route path="messages" element={
                                <Suspense fallback={<PageLoader />}><ContactAdmin /></Suspense>
                            } />
                            <Route path="utilisateurs" element={
                                <Suspense fallback={<PageLoader />}><UsersAdmin /></Suspense>
                            } />
                            <Route path="statistiques" element={
                                <Suspense fallback={<PageLoader />}><StatsAdmin /></Suspense>
                            } />
                            <Route path="terminologie" element={
                                <Suspense fallback={<PageLoader />}><TerminologieAdmin /></Suspense>
                            } />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
            </SettingsProvider>
        </AuthProvider>
    )
}

export default App
