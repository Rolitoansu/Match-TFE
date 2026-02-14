import { Container } from '@mui/material'
import { LandingPage } from './components/LandingPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Login } from './components/Login'
import { Register } from './components/Register'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PublicRoute } from './components/PublicRoute'
import './i18n'

function App() {

  return (
    <Container>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route element={<PublicRoute />}>
               <Route path="/login" element={<Login />} />
               <Route path="/register" element={<Register />} />
            </Route>
            <Route element={<ProtectedRoute />}>
               <Route path="/home" element={<h1>Home - Solo para usuarios autenticados</h1>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </Container>
  )
}

export default App
