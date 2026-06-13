import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

export const PublicRoute = () => {
    const { user } = useAuth()

    return user ? <Navigate to="/home" replace /> : <Outlet />
};