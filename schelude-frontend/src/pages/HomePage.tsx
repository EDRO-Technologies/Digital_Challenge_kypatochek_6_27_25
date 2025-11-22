import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Paper,
} from '@mui/material';
import {
  CalendarMonth,
  NotificationsActive,
  Schedule,
  Speed,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const features = [
    {
      icon: <CalendarMonth sx={{ fontSize: 48 }} />,
      title: 'Удобное расписание',
      description: 'Просматривайте расписание на день, неделю или любой период',
    },
    {
      icon: <NotificationsActive sx={{ fontSize: 48 }} />,
      title: 'Уведомления',
      description: 'Получайте уведомления об изменениях в Telegram',
    },
    {
      icon: <Schedule sx={{ fontSize: 48 }} />,
      title: 'Актуальность',
      description: 'Информация обновляется в реальном времени',
    },
    {
      icon: <Speed sx={{ fontSize: 48 }} />,
      title: 'Быстрый доступ',
      description: 'Мгновенный доступ к расписанию вашей группы',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 12,
          mb: 8,
        }}
      >
        <Container maxWidth="lg">
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            textAlign="center"
          >
            <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
              Умное расписание
            </Typography>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 4, opacity: 0.9 }}>
              Современная система управления расписанием {import.meta.env.VITE_APP_UNIVERSITY}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              {!isAuthenticated ? (
                <>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/schedule')}
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'grey.100' },
                      px: 4,
                      py: 1.5,
                    }}
                  >
                    Посмотреть расписание
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/login')}
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                      px: 4,
                      py: 1.5,
                    }}
                  >
                    Войти
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/schedule')}
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'grey.100' },
                    px: 4,
                    py: 1.5,
                  }}
                >
                  Перейти к расписанию
                </Button>
              )}
            </Stack>
            {user && (
              <Typography variant="h6" sx={{ mt: 3, opacity: 0.9 }}>
                Добро пожаловать, {user.name}!
                {user.groupNumber && ` Группа: ${user.groupNumber}`}
              </Typography>
            )}
          </MotionBox>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h3" align="center" gutterBottom fontWeight="bold" sx={{ mb: 6 }}>
          Возможности системы
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                sx={{
                  height: '100%',
                  transition: 'transform 0.3s',
                  '&:hover': { transform: 'translateY(-8px)' },
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="md">
          <Paper elevation={3} sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Начните использовать сейчас
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Войдите в систему или посмотрите расписание как гость
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/schedule')}
              >
                Посмотреть расписание
              </Button>
              {!isAuthenticated && (
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                >
                  Зарегистрироваться
                </Button>
              )}
            </Stack>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;