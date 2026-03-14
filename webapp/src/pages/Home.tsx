import { Header } from '../components/Header'
import { Outlet } from 'react-router-dom'

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col bg-gray-50/50">
      <Header />

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}