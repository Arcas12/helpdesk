import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Alert, CircularProgress
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      // El AuthProvider guarda el usuario y App.tsx redirige al dashboard
    } catch (err: any) {
      setError(
        err.response?.data?.message ?? 'Credenciales inválidas. Intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'grey.100'
    }}>
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>

          {/* Ícono y título */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box sx={{
              bgcolor: 'primary.main', borderRadius: '50%',
              p: 1.5, mb: 2
            }}>
              <LockOutlinedIcon sx={{ color: 'white', fontSize: 32 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Mesa de Ayuda
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Inicia sesión para continuar
            </Typography>
          </Box>

          {/* Error */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Formulario */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar sesión'}
            </Button>
          </Box>

          {/* Credenciales de prueba */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
              <strong>Credenciales de prueba:</strong>
            </Typography>
            {[
              { role: 'Admin',      email: 'admin@helpdesk.com', pass: 'Admin123!' },
              { role: 'Agente',     email: 'agent@helpdesk.com', pass: 'Agent123!' },
              { role: 'Solicitante',email: 'user@helpdesk.com',  pass: 'User123!'  },
            ].map(({ role, email: e, pass }) => (
              <Typography
                key={role}
                variant="caption"
                sx={{ display: 'block', cursor: 'pointer', color: 'primary.main', mb: 0.5 }}
                onClick={() => { setEmail(e); setPassword(pass); }}
              >
                {role}: {e} / {pass}
              </Typography>
            ))}
          </Box>

        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
