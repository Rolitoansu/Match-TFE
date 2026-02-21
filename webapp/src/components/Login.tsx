import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LogIn, Loader2 } from "lucide-react"

interface LoginProps {
    email: string
    password: string
}

export default function Login() {
    const [loginData, setLoginData] = useState<LoginProps>({ email: '', password: '' })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const { login } = useAuth()

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)
        try {
            await login(loginData.email, loginData.password)
            navigate('/home')
        } catch (err) {
            setError('Credenciales incorrectas o error en el servidor')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6">
            <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-xl border border-border">
                
                <div className="mb-8 flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <LogIn className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Bienvenido de nuevo</h2>
                    <p className="text-sm text-muted-foreground text-center">
                        Introduce tus credenciales para acceder a Match-TFE
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-foreground ml-1">
                            Correo electrónico
                        </label>
                        <input 
                            type="email" 
                            className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
                            value={loginData.email} 
                            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} 
                            required 
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-foreground ml-1">
                            Contraseña
                        </label>
                        <input 
                            type="password"
                            className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            value={loginData.password} 
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} 
                            required 
                        />
                    </div>

                    {error && (
                        <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive font-medium">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            "Iniciar Sesión"
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    ¿No tienes cuenta? <a href="/register" className="underline underline-offset-4 hover:text-primary">Regístrate</a>
                </p>
            </div>
        </div>
    )
}