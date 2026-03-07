import { Navbar } from '../fragments/Footer'
import { Header } from '../fragments/Header'
import { Outlet } from 'react-router-dom'

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col bg-gray-50/50">
        <Header />

      <main className="flex-1 pb-20"> 
        <Outlet />
      </main>

      <footer className="fixed w-full z-50">
        <Navbar />
      </footer>
    </div>
  )
}