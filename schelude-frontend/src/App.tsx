import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import getTheme from './theme/theme';
import { useThemeStore } from './stores/themeStore';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SchedulePage from './pages/SchedulePage';
import DashboardPage from './pages/admin/DashboardPage';
import SessionsPage from './pages/admin/SessionsPage';
import CoursesPage from './pages/admin/CoursesPage';
import RoomsPage from './pages/admin/RoomsPage';
import UsersPage from './pages/admin/UsersPage';
import NotificationsPage from './pages/admin/NotificationsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App: React.FC = () => {
  const { mode } = useThemeStore();
  const { isAuthenticated } = useAuthStore();
  const theme = getTheme(mode);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
            } />
            <Route path="/" element={
              <Layout>
                <HomePage />
              </Layout>
            } />
            <Route path="/schedule" element={
              <Layout>
                <SchedulePage />
              </Layout>
            } />
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/sessions" element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <Layout>
                  <SessionsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/courses" element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <Layout>
                  <CoursesPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/rooms" element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <Layout>
                  <RoomsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <Layout>
                  <UsersPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/notifications" element={
              <ProtectedRoute roles={['admin', 'superadmin']}>
                <Layout>
                  <NotificationsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
