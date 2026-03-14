import { BrowserRouter, Route, Routes, Outlet, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { ProtectedRoute } from './components/routes/ProtectedRoute'
import { PublicRoute } from './components/routes/PublicRoute'
import { lazy } from 'react'
import './i18n'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const Home = lazy(() => import('./pages/Home'))
const Chat = lazy(() => import('./pages/Chat'))
const Explore = lazy(() => import('./pages/Explore'))
const Profile = lazy(() => import('./pages/Profile'))
const Proposals = lazy(() => import('./pages/proposals/Proposals'))
const NewProposal = lazy(() => import('./pages/proposals/NewProposal'))
const ProposalDetails = lazy(() => import('./pages/proposals/ProposalDetails'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))

const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminLayout = lazy(() => import('./pages/AdminLayout'))
const Admin = lazy(() => import('./pages/Admin'))
const AdministrationRoute = lazy(() => import('./components/routes/AdministrationRoute'))

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthProvider><Outlet /></AuthProvider>}>
          <Route path="/" element={<LandingPage />} />
          <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
          </Route>
          <Route element={<ProtectedRoute />}>
              <Route element={<Home />}>
                <Route path="home" element={<Explore />} />
                <Route path="chat" element={<Chat />} />
                <Route path="profile" element={<Profile />} />
                <Route path="proposals" element={<Proposals />} />
                <Route path="proposals/new" element={<NewProposal />} />
                <Route path="proposals/details/:id" element={<ProposalDetails />} />
              </Route>
          </Route>
        </Route>
        <Route element={<AdminAuthProvider><Outlet /></AdminAuthProvider>}>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<AdministrationRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
