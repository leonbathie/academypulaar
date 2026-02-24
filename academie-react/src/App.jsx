import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import ScrollToHash from './components/ScrollToHash'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import DictionaryPage from './pages/DictionaryPage'
import ContactPage from './pages/ContactPage'
import AboutPage from './pages/AboutPage'
import LibraryPage from './pages/LibraryPage'
import LanguageQuestionsPage from './pages/LanguageQuestionsPage'
import TerminologyPage from './pages/TerminologyPage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import DashboardAdmin from './pages/admin/DashboardAdmin'
import DictionaryAdmin from './pages/admin/DictionaryAdmin'
import NewsAdmin from './pages/admin/NewsAdmin'
import ContentAdmin from './pages/admin/ContentAdmin'
import BooksAdmin from './pages/admin/BooksAdmin'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <ScrollToHash />
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={
              <div className="app">
                <Header />
                <main><HomePage /></main>
                <Footer />
              </div>
            } />
            <Route path="/dictionnaire" element={
              <div className="app">
                <Header />
                <main><DictionaryPage /></main>
                <Footer />
              </div>
            } />
            <Route path="/contact" element={
              <div className="app">
                <Header />
                <main><ContactPage /></main>
                <Footer />
              </div>
            } />
            <Route path="/a-propos" element={
              <div className="app">
                <Header />
                <main><AboutPage /></main>
                <Footer />
              </div>
            } />
            <Route path="/bibliotheque" element={
              <div className="app">
                <Header />
                <main><LibraryPage /></main>
                <Footer />
              </div>
            } />
            <Route path="/questions-langue" element={
              <div className="app">
                <Header />
                <main><LanguageQuestionsPage /></main>
                <Footer />
              </div>
            } />
            <Route path="/terminologie" element={
              <div className="app">
                <Header />
                <main><TerminologyPage /></main>
                <Footer />
              </div>
            } />

            {/* Routes admin */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />}>
              <Route index element={<DashboardAdmin />} />
              <Route path="dictionnaire" element={<DictionaryAdmin />} />
              <Route path="actualites" element={<NewsAdmin />} />
              <Route path="contenu" element={<ContentAdmin />} />
              <Route path="bibliotheque" element={<BooksAdmin />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={
              <div className="app">
                <Header />
                <main><NotFoundPage /></main>
                <Footer />
              </div>
            } />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
