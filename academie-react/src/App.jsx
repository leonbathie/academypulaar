import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import ScrollToHash from './components/ScrollToHash'
import PageTracker from './components/PageTracker'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import DictionaryPage from './pages/DictionaryPage'
import ContactPage from './pages/ContactPage'
import AboutPage from './pages/AboutPage'
import LibraryPage from './pages/LibraryPage'
import LanguageQuestionsPage from './pages/LanguageQuestionsPage'
import TerminologyPage from './pages/TerminologyPage'
import DireNePasDirePage from './pages/DireNePasDirePage'
import MentionsLegalesPage from './pages/MentionsLegalesPage'
import ConfidentialitePage from './pages/ConfidentialitePage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import DashboardAdmin from './pages/admin/DashboardAdmin'
import DictionaryAdmin from './pages/admin/DictionaryAdmin'
import NewsAdmin from './pages/admin/NewsAdmin'
import ContentAdmin from './pages/admin/ContentAdmin'
import BooksAdmin from './pages/admin/BooksAdmin'
import QuestionsAdmin from './pages/admin/QuestionsAdmin'
import StatsAdmin from './pages/admin/StatsAdmin'
import UsersAdmin from './pages/admin/UsersAdmin'
import './App.css'

function PublicLayout({ children }) {
  return (
    <div className="app">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <ScrollToHash />
          <PageTracker />
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
            <Route path="/dictionnaire" element={<PublicLayout><DictionaryPage /></PublicLayout>} />
            <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
            <Route path="/a-propos" element={<PublicLayout><AboutPage /></PublicLayout>} />
            <Route path="/bibliotheque" element={<PublicLayout><LibraryPage /></PublicLayout>} />
            <Route path="/questions-langue" element={<PublicLayout><LanguageQuestionsPage /></PublicLayout>} />
            <Route path="/terminologie" element={<PublicLayout><TerminologyPage /></PublicLayout>} />
            <Route path="/dire" element={<PublicLayout><DireNePasDirePage /></PublicLayout>} />
            <Route path="/mentions-legales" element={<PublicLayout><MentionsLegalesPage /></PublicLayout>} />
            <Route path="/confidentialite" element={<PublicLayout><ConfidentialitePage /></PublicLayout>} />

            {/* Routes admin */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />}>
              <Route index element={<DashboardAdmin />} />
              <Route path="dictionnaire" element={<DictionaryAdmin />} />
              <Route path="actualites" element={<NewsAdmin />} />
              <Route path="contenu" element={<ContentAdmin />} />
              <Route path="bibliotheque" element={<BooksAdmin />} />
              <Route path="questions" element={<QuestionsAdmin />} />
              <Route path="utilisateurs" element={<UsersAdmin />} />
              <Route path="statistiques" element={<StatsAdmin />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
