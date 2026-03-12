import { Navigate, Outlet } from 'react-router-dom'
import useAdminAuth from '../../hooks/useAdminAuth'

export default function AdministrationRoute() {
    const { admin } = useAdminAuth()
    return admin ? <Outlet /> : <Navigate to="/admin/login" replace />
}
