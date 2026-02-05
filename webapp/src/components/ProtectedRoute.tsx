import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const ProtectedRoute = () => {
    const { user, isAuthenticated, loading } = useAuth()
    const location = useLocation()

    if (loading) return <div>Cargando permisos...</div>
    
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (!user) {
        return <Navigate to="/unauthorized" replace />
    }

    return <Outlet />
}