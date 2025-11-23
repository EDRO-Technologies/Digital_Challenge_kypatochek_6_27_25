import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Stack,
  Autocomplete,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  Card,
  CardContent,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Person, ViewList, CalendarMonth as CalendarIcon } from '@mui/icons-material';
import CalendarView from '../components/CalendarView';
import { scheduleService } from '../services/scheduleService';
import SessionCard from '../components/SessionCard';
import { formatRelativeDate } from '../utils/dateUtils';

interface Teacher {
  _id: string;
  name: string;
}

const TeacherSchedulePage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(
    (localStorage.getItem('teacherScheduleViewMode') as 'list' | 'calendar') || 'list'
  );

  const handleViewModeChange = (mode: 'list' | 'calendar') => {
    setViewMode(mode);
    localStorage.setItem('teacherScheduleViewMode', mode);
  };

  const { data: teachersData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => scheduleService.getTeachers(),
  });

  const { data: todayData, isLoading: todayLoading, error: todayError } = useQuery({
    queryKey: ['schedule', 'teacher', 'today', selectedTeacher?._id],
    queryFn: () => scheduleService.getTeacherTodaySchedule(selectedTeacher!._id),
    enabled: !!selectedTeacher && tab === 0,
  });

  const { data: tomorrowData, isLoading: tomorrowLoading, error: tomorrowError } = useQuery({
    queryKey: ['schedule', 'teacher', 'tomorrow', selectedTeacher?._id],
    queryFn: () => scheduleService.getTeacherTomorrowSchedule(selectedTeacher!._id),
    enabled: !!selectedTeacher && tab === 1,
  });

  const { data: weekData, isLoading: weekLoading, error: weekError } = useQuery({
    queryKey: ['schedule', 'teacher', 'week', selectedTeacher?._id],
    queryFn: () => scheduleService.getTeacherWeekSchedule(selectedTeacher!._id),
    enabled: !!selectedTeacher && tab === 2,
  });

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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person /> Расписание для преподавателей
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Выберите преподавателя для просмотра расписания
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Autocomplete
            options={teachersData?.teachers || []}
            getOptionLabel={(option) => option.name}
            value={selectedTeacher}
            onChange={(_, newValue) => setSelectedTeacher(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Выберите преподавателя"
                placeholder="Начните вводить ФИО..."
              />
            )}
            noOptionsText="Преподаватели не найдены"
            isOptionEqualToValue={(option, value) => option._id === value._id}
          />
        </CardContent>
      </Card>

      {selectedTeacher && (
        <Paper sx={{ mb: 3, p: 2, bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
          <Typography variant="h6">
            Преподаватель: {selectedTeacher.name}
          </Typography>
        </Paper>
      )}

      {selectedTeacher ? (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab label="Сегодня" />
              <Tab label="Завтра" />
              <Tab label="Неделя" />
            </Tabs>
            
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, value) => value && handleViewModeChange(value)}
              size="small"
            >
              <ToggleButton value="list">
                <ViewList sx={{ mr: 0.5 }} /> Список
              </ToggleButton>
              <ToggleButton value="calendar">
                <CalendarIcon sx={{ mr: 0.5 }} /> Календарь
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box>
            {tab === 0 && (
              viewMode === 'list'
                ? renderSessions(todayData?.sessions, todayLoading, todayError)
                : todayData?.sessions && <CalendarView sessions={todayData.sessions} />
            )}
            {tab === 1 && (
              viewMode === 'list'
                ? renderSessions(tomorrowData?.sessions, tomorrowLoading, tomorrowError)
                : tomorrowData?.sessions && <CalendarView sessions={tomorrowData.sessions} />
            )}
            {tab === 2 && (
              viewMode === 'list'
                ? renderWeekSchedule()
                : weekData?.schedule && (
                    <CalendarView 
                      sessions={Object.values(weekData.schedule).flat()} 
                    />
                  )
            )}
          </Box>
        </>
      ) : (
        <Alert severity="info" icon={<Person />}>
          Пожалуйста, выберите преподавателя из списка выше для просмотра расписания
        </Alert>
      )}
    </Container>
  );
};

export default TeacherSchedulePage;
