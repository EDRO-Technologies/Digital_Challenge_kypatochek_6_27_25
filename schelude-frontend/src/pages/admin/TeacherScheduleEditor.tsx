import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Stack,
  Card,
  CardContent,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { Add, ArrowBack, Save } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherService } from '../../services/teacherService';
import { scheduleService } from '../../services/scheduleService';
import { courseService } from '../../services/courseService';
import { roomService } from '../../services/roomService';
import { sessionService } from '../../services/sessionService';
import CalendarView from '../../components/CalendarView';
import { Session, SessionType } from '../../types';
import { format } from 'date-fns';

const TeacherScheduleEditor: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [formData, setFormData] = useState({
    course: '',
    startAt: '',
    endAt: '',
    room: '',
    groups: '',
    type: 'lecture' as SessionType,
    notes: '',
  });

  const { data: teacherData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => scheduleService.getTeachers(),
  });

  const teacher = teacherData?.teachers.find((t: any) => t._id === teacherId);

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['teacher-schedule', teacherId, dateRange],
    queryFn: () => teacherService.getSchedule(teacherId!, {
      startDate: dateRange.start,
      endDate: dateRange.end,
    }),
    enabled: !!teacherId,
  });

  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseService.getAll(),
  });

  const { data: roomsData } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomService.getAll(),
  });

  const createSessionMutation = useMutation({
    mutationFn: sessionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-schedule'] });
      handleCloseDialog();
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Ошибка создания занятия');
    },
  });

  const handleEventClick = (session: Session) => {
    navigate(`/admin/sessions`);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      course: '',
      startAt: '',
      endAt: '',
      room: '',
      groups: '',
      type: 'lecture',
      notes: '',
    });
    setError('');
  };

  const handleOpenDialog = () => {
    const now = new Date();
    const startAt = new Date(now);
    startAt.setHours(9, 0, 0, 0);
    const endAt = new Date(startAt);
    endAt.setHours(10, 30, 0, 0);

    setFormData({
      course: '',
      startAt: format(startAt, "yyyy-MM-dd'T'HH:mm"),
      endAt: format(endAt, "yyyy-MM-dd'T'HH:mm"),
      room: '',
      groups: '',
      type: 'lecture',
      notes: '',
    });
    setOpenDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.course || !formData.startAt || !formData.endAt || !formData.room || !formData.groups) {
      setError('Заполните все обязательные поля');
      return;
    }

    // Validate time ordering
    const startTime = new Date(formData.startAt);
    const endTime = new Date(formData.endAt);
    if (endTime <= startTime) {
      setError('Время окончания должно быть позже времени начала');
      return;
    }

    // Validate duration
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours < 0.25) {
      setError('Занятие должно длиться минимум 15 минут');
      return;
    }
    if (durationHours > 8) {
      setError('Занятие не может длиться более 8 часов');
      return;
    }

    const groups = formData.groups.split(',').map(g => g.trim()).filter(g => g);
    if (groups.length === 0) {
      setError('Укажите хотя бы одну группу');
      return;
    }

    createSessionMutation.mutate({
      course: formData.course,
      startAt: formData.startAt,
      endAt: formData.endAt,
      room: formData.room,
      teacher: teacherId!,
      groups,
      type: formData.type,
      notes: formData.notes,
    });
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/admin/teachers')}
          sx={{ mb: 2 }}
        >
          Назад к списку
        </Button>
        <Typography variant="h4" fontWeight="bold">
          Редактор расписания: {teacher?.name}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Информация
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    Преподаватель: {teacher?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Занятий: {sessionsData?.sessions?.length || 0}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Период
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    type="date"
                    label="С"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    fullWidth
                    type="date"
                    label="По"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              </CardContent>
            </Card>

            <Button
              variant="contained"
              startIcon={<Add />}
              fullWidth
              onClick={handleOpenDialog}
            >
              Добавить занятие
            </Button>
          </Stack>
        </Grid>

        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2 }}>
            {isLoading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                Загрузка расписания...
              </Box>
            ) : (
              <CalendarView
                sessions={sessionsData?.sessions || []}
                onEventClick={handleEventClick}
                editable={true}
              />
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Создать занятие</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mt: 2, mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Курс *</InputLabel>
                <Select
                  value={formData.course}
                  label="Курс *"
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                >
                  {coursesData?.courses?.map((course: any) => (
                    <MenuItem key={course._id} value={course._id}>
                      {course.name} ({course.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Время начала *"
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Время окончания *"
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Аудитория *</InputLabel>
                <Select
                  value={formData.room}
                  label="Аудитория *"
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                >
                  {roomsData?.rooms?.map((room: any) => (
                    <MenuItem key={room._id} value={room._id}>
                      {room.building} {room.number} (вмест: {room.capacity})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Тип занятия</InputLabel>
                <Select
                  value={formData.type}
                  label="Тип занятия"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as SessionType })}
                >
                  <MenuItem value="lecture">Лекция</MenuItem>
                  <MenuItem value="practice">Практика</MenuItem>
                  <MenuItem value="lab">Лабораторная</MenuItem>
                  <MenuItem value="seminar">Семинар</MenuItem>
                  <MenuItem value="exam">Экзамен</MenuItem>
                  <MenuItem value="consultation">Консультация</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Группы (через запятую) *"
                placeholder="Например: ИВТ-101, ИВТ-102"
                value={formData.groups}
                onChange={(e) => setFormData({ ...formData, groups: e.target.value })}
                helperText="Укажите названия групп через запятую"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Примечания"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            startIcon={<Save />}
            disabled={createSessionMutation.isPending}
          >
            {createSessionMutation.isPending ? 'Создание...' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeacherScheduleEditor;
