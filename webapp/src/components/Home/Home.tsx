import { Navbar } from '../fragments/Navbar'
import { Header } from '../fragments/Header'
import { Outlet } from 'react-router-dom'

export default function Home() {
  return (
    <div className="flex h-svh flex-col bg-gray-50/50 overflow-hidden">
      <Header />
    <main className="flex-1 overflow-y-auto">
      <Outlet />
      <div className="h-24 w-full shrink-0" /> 
    </main>
    <Navbar />
    </div>
  )
}