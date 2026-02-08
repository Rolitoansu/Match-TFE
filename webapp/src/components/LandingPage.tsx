import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Container, Typography, Box } from '@mui/material';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return (
    <Container>
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h2">Bienvenido a Match TFE</Typography>
        <Typography variant="h5" sx={{ mb: 4 }}>
          La plataforma para conectar con tu Trabajo Fin de Grado ideal.
        </Typography>
        <Button variant="contained" href="/login" sx={{ mr: '1rem' }}>
          Iniciar Sesión
        </Button>
        <Button variant="contained" href="/register">
          Crear cuenta
        </Button>
      </Box>
    </Container>
  );
};