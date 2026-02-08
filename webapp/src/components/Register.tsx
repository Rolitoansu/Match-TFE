import { Button, Stack, TextField, Typography } from '@mui/material'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

interface RegisterProps {
    email: string
    name: string
    surname: string
    password: string
    repeatPassword: string
}

export const Register = () => {
    const [registerData, setRegisterData] = useState<RegisterProps>({ email: '', name: '', surname: '', password: '', repeatPassword: '' })
    const [error, setError] = useState('')
    const { register } = useAuth()

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        register(registerData.email, registerData.name, registerData.surname, registerData.password)
    }

    return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ textAlign: 'center' }}>
          Registro de usuario
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
            <TextField
            label="Email"
            variant="outlined"
            fullWidth
            required
            type="email"
            onChange={(e) => { setRegisterData({ ...registerData, email: e.target.value }) }}
            />

            <TextField
            label="Nombre"
            variant="outlined"
            fullWidth
            required
            type="text"
            onChange={(e) => { setRegisterData({ ...registerData, name: e.target.value }) }}
            />

            <TextField
            label="Apellidos"
            variant="outlined"
            fullWidth
            required
            type="text"
            onChange={(e) => { setRegisterData({ ...registerData, surname: e.target.value }) }}
            />
            
            <TextField
            label="Contraseña"
            variant="outlined"
            fullWidth
            required
            type="password"
            onChange={(e) => { setRegisterData({ ...registerData, password: e.target.value }) }}
            />

            <TextField
            label="Repetir contraseña"
            variant="outlined"
            fullWidth
            required
            type="password"
            onChange={(e) => { setRegisterData({ ...registerData, repeatPassword: e.target.value }) }}
            />

            <Button 
            type="submit" 
            variant="contained" 
            size="large"
            fullWidth
            sx={{ mt: 2 }}
            >
            Registrarse
            </Button>
        </Stack>
        </Box>
    </Paper>
    </Box>
)
}