import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
  Alert,
  Tab,
  Tabs,
} from '@mui/material';
import { Login, PersonAdd } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';

const loginSchema = yup.object({
  email: yup.string().email('Неверный формат email').required('Email обязателен'),
  password: yup.string().min(6, 'Пароль должен быть не менее 6 символов').required('Пароль обязателен'),
});

const registerSchema = yup.object({
  name: yup.string().required('Имя обязательно'),
  email: yup.string().email('Неверный формат email').required('Email обязателен'),
  password: yup.string().min(6, 'Пароль должен быть не менее 6 символов').required('Пароль обязателен'),
  groupNumber: yup.string(),
});

const guestSchema = yup.object({
  groupNumber: yup.string().required('Номер группы обязателен'),
  name: yup.string(),
});

const LoginPage: React.FC = () => {
  const [tab, setTab] = useState(0);
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

  const registerForm = useFormik({
    initialValues: { name: '', email: '', password: '', groupNumber: '' },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      try {
        const response = await authService.register(values);
        login(response.token, response.user as any);
        navigate('/');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Ошибка регистрации');
      } finally {
        setLoading(false);
      }
    },
  });

  const guestForm = useFormik({
    initialValues: { groupNumber: '', name: '' },
    validationSchema: guestSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      try {
        const response = await authService.createGuest(values.groupNumber, values.name);
        login(response.token, response.user as any);
        navigate('/schedule');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Ошибка создания гостевого доступа');
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

          <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ mb: 3 }}>
            <Tab label="Вход" />
            <Tab label="Регистрация" />
            <Tab label="Гость" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {tab === 0 && (
            <form onSubmit={loginForm.handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
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
          )}

          {tab === 1 && (
            <form onSubmit={registerForm.handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Имя"
                  name="name"
                  value={registerForm.values.name}
                  onChange={registerForm.handleChange}
                  error={registerForm.touched.name && Boolean(registerForm.errors.name)}
                  helperText={registerForm.touched.name && registerForm.errors.name}
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={registerForm.values.email}
                  onChange={registerForm.handleChange}
                  error={registerForm.touched.email && Boolean(registerForm.errors.email)}
                  helperText={registerForm.touched.email && registerForm.errors.email}
                />
                <TextField
                  fullWidth
                  label="Пароль"
                  name="password"
                  type="password"
                  value={registerForm.values.password}
                  onChange={registerForm.handleChange}
                  error={registerForm.touched.password && Boolean(registerForm.errors.password)}
                  helperText={registerForm.touched.password && registerForm.errors.password}
                />
                <TextField
                  fullWidth
                  label="Номер группы (опционально)"
                  name="groupNumber"
                  value={registerForm.values.groupNumber}
                  onChange={registerForm.handleChange}
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  size="large"
                  startIcon={<PersonAdd />}
                  disabled={loading}
                >
                  {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                </Button>
              </Stack>
            </form>
          )}

          {tab === 2 && (
            <form onSubmit={guestForm.handleSubmit}>
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Введите номер вашей группы для быстрого доступа к расписанию
                </Typography>
                <TextField
                  fullWidth
                  label="Номер группы"
                  name="groupNumber"
                  placeholder="Например: ИВТ-101"
                  value={guestForm.values.groupNumber}
                  onChange={guestForm.handleChange}
                  error={guestForm.touched.groupNumber && Boolean(guestForm.errors.groupNumber)}
                  helperText={guestForm.touched.groupNumber && guestForm.errors.groupNumber}
                />
                <TextField
                  fullWidth
                  label="Имя (опционально)"
                  name="name"
                  value={guestForm.values.name}
                  onChange={guestForm.handleChange}
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  size="large"
                  disabled={loading}
                >
                  {loading ? 'Вход...' : 'Войти как гость'}
                </Button>
              </Stack>
            </form>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;