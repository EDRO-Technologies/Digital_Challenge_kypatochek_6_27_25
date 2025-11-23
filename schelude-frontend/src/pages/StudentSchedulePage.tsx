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
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { School, TableChart, ViewWeek } from '@mui/icons-material';
import CyclicScheduleView from '../components/CyclicScheduleView';
import WeeklyScheduleGrid from '../components/WeeklyScheduleGrid';
import { scheduleService } from '../services/scheduleService';
import SessionCard from '../components/SessionCard';
import { formatRelativeDate } from '../utils/dateUtils';
import { formatPairTime } from '../utils/pairUtils';
import { format, startOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getStatusColor, getStatusLabel, getTypeLabel, getTypeColor } from '../utils/sessionUtils';
import { getCurrentWeekInfo, getWeekParityLabel } from '../utils/weekUtils';

const StudentSchedulePage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [subgroup, setSubgroup] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'week'>(
    (localStorage.getItem('scheduleViewMode') as 'table' | 'week') || 'week'
  );

  const weekInfo = getCurrentWeekInfo();

  const handleViewModeChange = (mode: 'table' | 'week') => {
    setViewMode(mode);
    localStorage.setItem('scheduleViewMode', mode);
  };

  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => scheduleService.getGroups(),
  });

  const { data: todayData, isLoading: todayLoading, error: todayError } = useQuery({
    queryKey: ['schedule', 'student', 'today', selectedGroup, subgroup],
    queryFn: () => scheduleService.getTodaySchedule(selectedGroup!, subgroup),
    enabled: !!selectedGroup && viewMode === 'table' && tab === 0,
  });

  const { data: tomorrowData, isLoading: tomorrowLoading, error: tomorrowError } = useQuery({
    queryKey: ['schedule', 'student', 'tomorrow', selectedGroup, subgroup],
    queryFn: () => scheduleService.getTomorrowSchedule(selectedGroup!, subgroup),
    enabled: !!selectedGroup && viewMode === 'table' && tab === 1,
  });

  const { data: weekData, isLoading: weekLoading, error: weekError } = useQuery({
    queryKey: ['schedule', 'student', 'week', selectedGroup, subgroup],
    queryFn: () => scheduleService.getWeekSchedule(selectedGroup!, subgroup),
    enabled: !!selectedGroup && ((viewMode === 'table' && tab === 2) || (viewMode === 'week' && tab === 0)),
  });

  const { data: cyclicData, isLoading: cyclicLoading, error: cyclicError } = useQuery({
    queryKey: ['schedule', 'student', 'cyclic', selectedGroup],
    queryFn: () => scheduleService.getGroupCyclicSchedule(selectedGroup!),
    enabled: !!selectedGroup && ((viewMode === 'table' && tab === 3) || (viewMode === 'week' && tab === 1)),
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

    if (viewMode === 'table') {
      return renderTableView(sessions, false);
    }

    return (
      <Stack spacing={2}>
        {sessions.map((session) => (
          <SessionCard key={session._id} session={session} />
        ))}
      </Stack>
    );
  };

  const renderTableView = (sessions: any[], showDate: boolean = false) => {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              {showDate && <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Дата</TableCell>}
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Пара</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Время</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Предмет</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Тип</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Преподаватель</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Аудитория</TableCell>
              <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Статус</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((session) => {
              const course = typeof session.course === 'object' ? session.course : null;
              const teacher = typeof session.teacher === 'object' ? session.teacher : null;
              const room = typeof session.room === 'object' ? session.room : null;

              return (
                <TableRow 
                  key={session._id} 
                  hover
                  sx={{ 
                    '&:hover': { bgcolor: 'action.hover' },
                    borderLeft: `4px solid ${getTypeColor(session.type)}`,
                  }}
                >
                  {showDate && (
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {format(new Date(session.startAt), 'dd.MM.yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(session.startAt), 'EEEE', { locale: ru })}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {session.pairNumber}
                  </TableCell>
                  <TableCell>
                    {session.pairNumber ? (
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {formatPairTime(session.pairNumber)}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2">
                        {format(new Date(session.startAt), 'HH:mm')} - {format(new Date(session.endAt), 'HH:mm')}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {course?.name || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {course?.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getTypeLabel(session.type)}
                      size="small"
                      sx={{ 
                        bgcolor: getTypeColor(session.type), 
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                  <TableCell>{teacher?.name || 'Не назначен'}</TableCell>
                  <TableCell>
                    {room ? (
                      <Typography variant="body2" fontWeight="medium">
                        {room.building} {room.number}
                      </Typography>
                    ) : (
                      'Не назначена'
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(session.status)}
                      color={getStatusColor(session.status) as any}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
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

    if (viewMode === 'table') {
      const allSessions = Object.values(weekData.schedule).flat();
      return renderTableView(allSessions as any[], true);
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
          <School /> Расписание для студентов
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Выберите группу для просмотра расписания
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Autocomplete
              options={groupsData?.groups || []}
              value={selectedGroup}
              onChange={(_, newValue) => setSelectedGroup(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Выберите группу"
                  placeholder="Начните вводить номер группы..."
                />
              )}
              noOptionsText="Группы не найдены"
            />
            {selectedGroup && (
              <TextField
                select
                label="Подгруппа"
                value={subgroup}
                onChange={(e) => setSubgroup(e.target.value)}
                fullWidth
              >
                <MenuItem value="all">Вся группа</MenuItem>
                <MenuItem value="subgroup-1">Подгруппа 1</MenuItem>
                <MenuItem value="subgroup-2">Подгруппа 2</MenuItem>
              </TextField>
            )}
          </Stack>
        </CardContent>
      </Card>

      {selectedGroup && (
        <Paper sx={{ mb: 3, p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6">
              Группа: {selectedGroup}
            </Typography>
            <Box>
              <Chip
                label={`Неделя ${weekInfo.weekNumber}: ${weekInfo.parityLabel}`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit', fontWeight: 'bold' }}
              />
            </Box>
          </Box>
        </Paper>
      )}

      {selectedGroup ? (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            {viewMode === 'week' ? (
              <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                <Tab label="Неделя" />
                <Tab label="Циклы" />
              </Tabs>
            ) : (
              <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                <Tab label="Сегодня" />
                <Tab label="Завтра" />
                <Tab label="Неделя" />
                <Tab label="Циклы" />
              </Tabs>
            )}
            
            {(viewMode === 'table' && tab !== 3) || viewMode === 'week' ? (
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, value) => {
                  if (value) {
                    handleViewModeChange(value);
                    if (value === 'week') {
                      setTab(0);
                    }
                  }
                }}
                size="small"
              >
                <ToggleButton value="week">
                  <ViewWeek sx={{ mr: 0.5 }} /> Неделя
                </ToggleButton>
                <ToggleButton value="table">
                  <TableChart sx={{ mr: 0.5 }} /> Таблица
                </ToggleButton>
              </ToggleButtonGroup>
            ) : null}
          </Box>

          <Box>
            {viewMode === 'week' ? (
              tab === 0 ? (
                weekLoading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : weekError ? (
                  <Alert severity="error">
                    Ошибка загрузки расписания: {weekError.message}
                  </Alert>
                ) : weekData?.schedule ? (
                  (() => {
                    const scheduleDates = Object.keys(weekData.schedule);
                    const dataStartDate = scheduleDates.length > 0 
                      ? startOfWeek(new Date(scheduleDates[0]), { weekStartsOn: 1 }) 
                      : undefined;
                    return (
                      <WeeklyScheduleGrid
                        sessions={Object.values(weekData.schedule).flat()}
                        startDate={dataStartDate}
                      />
                    );
                  })()
                ) : (
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                      Занятий не найдено
                    </Typography>
                  </Paper>
                )
              ) : (
                cyclicLoading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : cyclicError ? (
                  <Alert severity="error">
                    Ошибка загрузки: {cyclicError.message}
                  </Alert>
                ) : (
                  <CyclicScheduleView cycles={cyclicData?.cycles || []} />
                )
              )
            ) : (
              <>
                {tab === 0 && renderSessions(todayData?.sessions, todayLoading, todayError)}
                {tab === 1 && renderSessions(tomorrowData?.sessions, tomorrowLoading, tomorrowError)}
                {tab === 2 && renderWeekSchedule()}
                {tab === 3 && (
                  cyclicLoading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                      <CircularProgress />
                    </Box>
                  ) : cyclicError ? (
                    <Alert severity="error">
                      Ошибка загрузки: {cyclicError.message}
                    </Alert>
                  ) : (
                    <CyclicScheduleView cycles={cyclicData?.cycles || []} />
                  )
                )}
              </>
            )}
          </Box>
        </>
      ) : (
        <Alert severity="info" icon={<School />}>
          Пожалуйста, выберите группу из списка выше для просмотра расписания
        </Alert>
      )}
    </Container>
  );
};

export default StudentSchedulePage;
