import { LandingPage } from './components/LandingPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Login } from './components/Login'
import { Register } from './components/Register'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/routes/ProtectedRoute'
import { PublicRoute } from './components/routes/PublicRoute'
import { Home } from './components/Home/Home'
import { Explore } from './components/Home/Explore'
import { Profile } from './components/Profile/Profile'
import { Proposals } from './components/Proposals/Proposals'
import { NewProposal } from './components/Proposals/NewProposal'
import { ProposalDetails } from './components/Proposals/ProposalDetails'
import { Chat } from './components/Chat/Chat'
import './i18n'


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
