import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/routes/ProtectedRoute'
import { PublicRoute } from './components/routes/PublicRoute'
import { lazy } from 'react'
import './i18n'

const LandingPage = lazy(() => import('./components/LandingPage'))
const Home = lazy(() => import('./components/Home/Home'))
const Chat = lazy(() => import('./components/Chat/Chat'))
const Explore = lazy(() => import('./components/Home/Explore'))
const Profile = lazy(() => import('./components/Profile/Profile'))
const Proposals = lazy(() => import('./components/Proposals/Proposals'))
const NewProposal = lazy(() => import('./components/Proposals/NewProposal'))
const ProposalDetails = lazy(() => import('./components/Proposals/ProposalDetails'))
const Login = lazy(() => import('./components/Login'))
const Register = lazy(() => import('./components/Register'))

function App() {

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
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
                <Route path="proposals/mock" element={<ProposalDetails />} />
              </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
