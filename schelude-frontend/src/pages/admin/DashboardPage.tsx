import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Paper,
} from '@mui/material';
import {
  EventNote,
  School,
  MeetingRoom,
  People,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { sessionService } from '../../services/sessionService';
import { courseService } from '../../services/courseService';
import { roomService } from '../../services/roomService';
import { userService } from '../../services/userService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            bgcolor: color,
            borderRadius: 2,
            p: 1.5,
            color: 'white',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const DashboardPage: React.FC = () => {
  const { data: sessions } = useQuery({
    queryKey: ['sessions', 'all'],
    queryFn: () => sessionService.getAll({ limit: 1000 }),
  });

  const { data: courses } = useQuery({
    queryKey: ['courses', 'all'],
    queryFn: () => courseService.getAll(),
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms', 'all'],
    queryFn: () => roomService.getAll(),
  });

  const { data: users } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => userService.getAll(),
  });

  const sessionsByType = React.useMemo(() => {
    if (!sessions?.sessions) return [];
    const types = sessions.sessions.reduce((acc: any, session: any) => {
      acc[session.type] = (acc[session.type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [sessions]);

  const sessionsByStatus = React.useMemo(() => {
    if (!sessions?.sessions) return [];
    const statuses = sessions.sessions.reduce((acc: any, session: any) => {
      acc[session.status] = (acc[session.status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [sessions]);

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 4 }}>
        Панель управления
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Всего занятий"
            value={sessions?.total || 0}
            icon={<EventNote />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Курсов"
            value={courses?.courses?.length || 0}
            icon={<School />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Аудиторий"
            value={rooms?.rooms?.length || 0}
            icon={<MeetingRoom />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Пользователей"
            value={users?.users?.length || 0}
            icon={<People />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Занятия по типам
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sessionsByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#1976d2" name="Количество" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Занятия по статусам
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sessionsByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#2e7d32" name="Количество" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;