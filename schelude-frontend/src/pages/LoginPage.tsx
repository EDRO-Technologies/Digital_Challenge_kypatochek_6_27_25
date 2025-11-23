import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
} from '@mui/material';
import { Login } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';

const loginSchema = yup.object({
  email: yup.string().required('Логин обязателен'),
  password: yup.string().required('Пароль обязателен'),
});

const LoginPage: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const loginForm = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      try {
        const response = await authService.login(values.email, values.password);
        login(response.token, response.user as any);
        navigate('/');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Ошибка входа');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
            Умное расписание
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 3 }}>
            {import.meta.env.VITE_APP_UNIVERSITY}
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Вход для администратора
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <form onSubmit={loginForm.handleSubmit}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Логин"
                name="email"
                value={loginForm.values.email}
                onChange={loginForm.handleChange}
                error={loginForm.touched.email && Boolean(loginForm.errors.email)}
                helperText={loginForm.touched.email && loginForm.errors.email}
              />
              <TextField
                fullWidth
                label="Пароль"
                name="password"
                type="password"
                value={loginForm.values.password}
                onChange={loginForm.handleChange}
                error={loginForm.touched.password && Boolean(loginForm.errors.password)}
                helperText={loginForm.touched.password && loginForm.errors.password}
              />
              <Button
                fullWidth
                variant="contained"
                type="submit"
                size="large"
                startIcon={<Login />}
                disabled={loading}
              >
                {loading ? 'Вход...' : 'Войти'}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;