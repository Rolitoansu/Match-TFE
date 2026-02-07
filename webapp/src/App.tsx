import './App.css'
import { Container } from '@mui/material'
import { LandingPage } from './components/LandingPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Login } from './components/Login/Login'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {

  return (
    <Container>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
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
