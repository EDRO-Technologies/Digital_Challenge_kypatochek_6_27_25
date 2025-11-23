import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Stack,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Autocomplete,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Search } from '@mui/icons-material';
import { scheduleService } from '../services/scheduleService';
import { useAuthStore } from '../stores/authStore';
import SessionCard from '../components/SessionCard';
import { formatRelativeDate } from '../utils/dateUtils';

const SchedulePage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [groupNumber, setGroupNumber] = useState('');
  const [searchGroup, setSearchGroup] = useState('');
  const { user } = useAuthStore();

  const effectiveGroup = searchGroup || user?.groupNumber || '';

  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => scheduleService.getGroups(),
  });

  const { data: todayData, isLoading: todayLoading, error: todayError } = useQuery({
    queryKey: ['schedule', 'today', effectiveGroup],
    queryFn: () => scheduleService.getTodaySchedule(effectiveGroup),
    enabled: !!effectiveGroup && tab === 0,
  });

  const { data: tomorrowData, isLoading: tomorrowLoading, error: tomorrowError } = useQuery({
    queryKey: ['schedule', 'tomorrow', effectiveGroup],
    queryFn: () => scheduleService.getTomorrowSchedule(effectiveGroup),
    enabled: !!effectiveGroup && tab === 1,
  });

  const { data: weekData, isLoading: weekLoading, error: weekError } = useQuery({
    queryKey: ['schedule', 'week', effectiveGroup],
    queryFn: () => scheduleService.getWeekSchedule(effectiveGroup),
    enabled: !!effectiveGroup && tab === 2,
  });

  const handleSearch = () => {
    setSearchGroup(groupNumber);
  };

  const renderSessions = (sessions: any[] | undefined, loading: boolean, error: any) => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error">
          Ошибка загрузки расписания: {error.message}
        </Alert>
      );
    }

    if (!sessions || sessions.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Занятий не найдено
          </Typography>
        </Paper>
      );
    }

    return (
      <Stack spacing={2}>
        {sessions.map((session) => (
          <SessionCard key={session._id} session={session} />
        ))}
      </Stack>
    );
  };

  const renderWeekSchedule = () => {
    if (weekLoading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (weekError) {
      return (
        <Alert severity="error">
          Ошибка загрузки расписания: {weekError.message}
        </Alert>
      );
    }

    if (!weekData?.schedule || Object.keys(weekData.schedule).length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Занятий не найдено
          </Typography>
        </Paper>
      );
    }

    return (
      <Stack spacing={4}>
        {Object.entries(weekData.schedule).map(([date, sessions]) => (
          <Box key={date}>
            <Typography variant="h6" gutterBottom>
              {formatRelativeDate(date)}
            </Typography>
            <Stack spacing={2}>
              {(sessions as any[]).map((session) => (
                <SessionCard key={session._id} session={session} />
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    );
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Расписание занятий
      </Typography>

      {!user?.groupNumber && (
        <Box sx={{ mb: 3 }}>
          <Autocomplete
            options={groupsData?.groups || []}
            value={groupNumber || null}
            onChange={(_, newValue) => {
              setGroupNumber(newValue || '');
              if (newValue) {
                setSearchGroup(newValue);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Выберите группу"
                placeholder="Начните вводить номер группы..."
              />
            )}
            freeSolo
            onInputChange={(_, newValue) => setGroupNumber(newValue)}
            noOptionsText="Группы не найдены"
          />
        </Box>
      )}

      {effectiveGroup && (
        <Paper sx={{ mb: 2, p: 2 }}>
          <Typography variant="body1">
            Расписание для группы: <strong>{effectiveGroup}</strong>
          </Typography>
        </Paper>
      )}

      {effectiveGroup ? (
        <>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
            <Tab label="Сегодня" />
            <Tab label="Завтра" />
            <Tab label="Неделя" />
          </Tabs>

          <Box>
            {tab === 0 && renderSessions(todayData?.sessions, todayLoading, todayError)}
            {tab === 1 && renderSessions(tomorrowData?.sessions, tomorrowLoading, tomorrowError)}
            {tab === 2 && renderWeekSchedule()}
          </Box>
        </>
      ) : (
        <Alert severity="info">
          Введите номер группы для просмотра расписания
        </Alert>
      )}
    </Container>
  );
};

export default SchedulePage;