import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'

function App() {
  return (
    <AuthProvider>
      <Header />
      <Routes>
        <Route path="/" element={<main className="pt-20"><HomePage /></main>} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
      <Footer />
    </AuthProvider>
  )
}

export default App
