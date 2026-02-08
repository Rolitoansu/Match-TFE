import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

interface LoginProps {
    email: string
    password: string
}

export const Login = () => {
    const [loginData, setLoginData] = useState<LoginProps>({ email: '', password: '' })
    const [error, setError] = useState('')
    const { login } = useAuth()

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        try {
            await login(loginData.email, loginData.password)
        } catch (err) {
            setError('Credenciales incorrectas o error en el servidor')
        }
    }

    return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '2rem' }}>
    <h2>Iniciar Sesión</h2>
    <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
        <label>Email:</label>
        <input 
            type="email" 
            value={loginData.email} 
            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} 
            required 
            style={{ width: '100%', display: 'block' }}
        />
        </div>
        <div style={{ marginBottom: '1rem' }}>
        <label>Contraseña:</label>
        <input 
            type="password" 
            value={loginData.password} 
            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} 
            required 
            style={{ width: '100%', display: 'block' }}
        />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Entrar</button>
    </form>
    </div>
  )
}