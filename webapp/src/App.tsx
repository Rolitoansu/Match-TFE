import { Container } from '@mui/material'
import { LandingPage } from './components/LandingPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Login } from './components/Login'
import { Register } from './components/Register'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/routes/ProtectedRoute'
import { PublicRoute } from './components/routes/PublicRoute'
import { Home } from './components/Home'
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

               <Route path="/home" element={<Home />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </Container>
  )
}

export default App
