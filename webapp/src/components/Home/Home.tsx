import { Navbar } from '../fragments/Navbar'
import { Header } from '../fragments/Header'
import { Outlet } from 'react-router-dom'

export const Home = () => {
  return (
    <div className="flex min-h-svh flex-col bg-gray-50/50">
      <Header />
      <Outlet />
      <Navbar />
    </div>
  )
}

export default Home