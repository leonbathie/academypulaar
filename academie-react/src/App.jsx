import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
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
import ContactAdmin from './pages/admin/ContactAdmin'
import './App.css'

function PublicLayout() {
  return (
    <div className="app">
      <Header />
      <main><Outlet /></main>
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
            {/* Routes publiques — même Header/Footer partagé */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/dictionnaire" element={<DictionaryPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/a-propos" element={<AboutPage />} />
              <Route path="/bibliotheque" element={<LibraryPage />} />
              <Route path="/questions-langue" element={<LanguageQuestionsPage />} />
              <Route path="/terminologie" element={<TerminologyPage />} />
              <Route path="/dire" element={<DireNePasDirePage />} />
              <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
              <Route path="/confidentialite" element={<ConfidentialitePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Routes admin */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />}>
              <Route index element={<DashboardAdmin />} />
              <Route path="dictionnaire" element={<DictionaryAdmin />} />
              <Route path="actualites" element={<NewsAdmin />} />
              <Route path="contenu" element={<ContentAdmin />} />
              <Route path="bibliotheque" element={<BooksAdmin />} />
              <Route path="questions" element={<QuestionsAdmin />} />
              <Route path="messages" element={<ContactAdmin />} />
              <Route path="utilisateurs" element={<UsersAdmin />} />
              <Route path="statistiques" element={<StatsAdmin />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
