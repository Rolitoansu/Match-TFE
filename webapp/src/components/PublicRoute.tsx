import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const PublicRoute = () => {
    const { user } = useAuth()

    console.log(user)
    if (user) {
        return <Navigate to="/home" replace />
    }

    return <Outlet />
};