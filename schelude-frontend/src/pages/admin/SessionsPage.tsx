import React, { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Chip,
  IconButton,
  Collapse,
} from '@mui/material';
import { Add, FilterList, ExpandMore, ExpandLess, Cancel } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { sessionService } from '../../services/sessionService';
import { courseService } from '../../services/courseService';
import { roomService } from '../../services/roomService';
import { userService } from '../../services/userService';
import { scheduleService } from '../../services/scheduleService';
import { format } from 'date-fns';
import { getAllPairs, formatPairTime } from '../../utils/pairUtils';
import { ru } from 'date-fns/locale';

const sessionSchema = yup.object({
  course: yup.string().required('Курс обязателен'),
  date: yup.string().required('Дата обязательна'),
  pairNumber: yup.number().required('Номер пары обязателен').min(1).max(8),
  room: yup.string().required('Аудитория обязательна'),
  teacher: yup.string().required('Преподаватель обязателен'),
  groups: yup.string().required('Группы обязательны'),
  type: yup.string().required('Тип обязателен'),
});

const SessionsPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    teacher: '',
    group: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['sessions', page, filters],
    queryFn: () => sessionService.getAll({
      page,
      limit: 20,
      startDate: filters.startDate,
      endDate: filters.endDate,
      teacher: filters.teacher || undefined,
      group: filters.group || undefined,
    }),
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseService.getAll(),
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomService.getAll(),
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => userService.getAll({ role: 'teacher' }),
  });

  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => scheduleService.getGroups(),
  });

  const createMutation = useMutation({
    mutationFn: sessionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setOpen(false);
      formik.resetForm();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Ошибка создания занятия');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sessionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setCancelDialogOpen(false);
      setSelectedSessionId(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Ошибка удаления занятия');
    },
  });

  const handleCancelClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setError(''); // Clear previous errors
    setCancelDialogOpen(true);
  };

  const handleCancelDialogClose = () => {
    setCancelDialogOpen(false);
    setSelectedSessionId(null);
    setError('');
  };

  const handleCancelConfirm = () => {
    if (selectedSessionId) {
      deleteMutation.mutate(selectedSessionId);
    }
  };

  const formik = useFormik({
    initialValues: {
      course: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      pairNumber: 1,
      room: '',
      teacher: '',
      groups: '',
      type: 'lecture',
      weekParity: 'both' as WeekParity,
      notes: '',
    },
    validationSchema: sessionSchema,
    onSubmit: (values) => {
      const groups = values.groups.split(',').map(g => g.trim());
      setError('');
      createMutation.mutate({ ...values, groups });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'cancelled': return 'error';
      case 'online': return 'info';
      case 'moved': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planned: 'Запланировано',
      confirmed: 'Подтверждено',
      cancelled: 'Отменено',
      online: 'Онлайн',
      moved: 'Перенесено',
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      lecture: 'Лекция',
      practice: 'Практика',
      lab: 'Лабораторная',
      seminar: 'Семинар',
      exam: 'Экзамен',
      consultation: 'Консультация',
    };
    return labels[type] || type;
  };

  return (
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Управление занятиями
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            endIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Фильтры
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
          >
            Создать занятие
          </Button>
        </Stack>
      </Box>

      <Collapse in={showFilters}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="От даты"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="До даты"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Преподаватель"
                value={filters.teacher}
                onChange={(e) => setFilters({ ...filters, teacher: e.target.value })}
              >
                <MenuItem value="">Все</MenuItem>
                {teachers?.users?.map((teacher: any) => (
                  <MenuItem key={teacher._id} value={teacher._id}>
                    {teacher.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Группа"
                value={filters.group}
                onChange={(e) => setFilters({ ...filters, group: e.target.value })}
              >
                <MenuItem value="">Все</MenuItem>
                {groupsData?.groups?.map((group: string) => (
                  <MenuItem key={group} value={group}>
                    {group}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {isLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Дата</strong></TableCell>
                  <TableCell><strong>Пара</strong></TableCell>
                  <TableCell><strong>Курс</strong></TableCell>
                  <TableCell><strong>Преподаватель</strong></TableCell>
                  <TableCell><strong>Аудитория</strong></TableCell>
                  <TableCell><strong>Группы</strong></TableCell>
                  <TableCell><strong>Тип</strong></TableCell>
                  <TableCell><strong>Статус</strong></TableCell>
                  <TableCell><strong>Действия</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessionsData?.sessions?.map((session: any) => {
                  const course = typeof session.course === 'object' ? session.course : null;
                  const teacher = typeof session.teacher === 'object' ? session.teacher : null;
                  const room = typeof session.room === 'object' ? session.room : null;
                  
                  return (
                    <TableRow key={session._id} hover>
                      <TableCell>
                        {format(new Date(session.startAt), 'dd MMM yyyy', { locale: ru })}
                      </TableCell>
                      <TableCell>
                        {session.pairNumber ? (
                          <>
                            <strong>{session.pairNumber} пара</strong>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              {formatPairTime(session.pairNumber)}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="caption">
                            {format(new Date(session.startAt), 'HH:mm')} - {format(new Date(session.endAt), 'HH:mm')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {course?.name || 'N/A'}
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {course?.code}
                        </Typography>
                      </TableCell>
                      <TableCell>{teacher?.name || 'Не назначен'}</TableCell>
                      <TableCell>
                        {room ? `${room.building} ${room.number}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {session.groups?.join(', ')}
                      </TableCell>
                      <TableCell>
                        {getTypeLabel(session.type)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(session.status)}
                          color={getStatusColor(session.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {session.status !== 'cancelled' && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleCancelClick(session._id)}
                            title="Отменить пару"
                          >
                            <Cancel />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {sessionsData && sessionsData.totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={sessionsData.totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Создать новое занятие
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Основная информация
              </Typography>
              <Paper sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Курс"
                      name="course"
                      value={formik.values.course}
                      onChange={formik.handleChange}
                      error={formik.touched.course && Boolean(formik.errors.course)}
                      helperText={formik.touched.course && formik.errors.course}
                      required
                    >
                      {courses?.courses?.map((course: any) => (
                        <MenuItem key={course._id} value={course._id}>
                          <Box>
                            <Typography variant="body1">{course.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {course.code}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Тип занятия"
                      name="type"
                      value={formik.values.type}
                      onChange={formik.handleChange}
                      required
                    >
                      <MenuItem value="lecture">📚 Лекция</MenuItem>
                      <MenuItem value="practice">🔧 Практика</MenuItem>
                      <MenuItem value="lab">🧪 Лабораторная</MenuItem>
                      <MenuItem value="seminar">👥 Семинар</MenuItem>
                      <MenuItem value="exam">📝 Экзамен</MenuItem>
                      <MenuItem value="consultation">❓ Консультация</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Неделя"
                      name="weekParity"
                      value={formik.values.weekParity}
                      onChange={formik.handleChange}
                      helperText="Числитель/Знаменатель"
                    >
                      <MenuItem value="both">Каждую неделю</MenuItem>
                      <MenuItem value="odd">Числитель (нечетные)</MenuItem>
                      <MenuItem value="even">Знаменатель (четные)</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Группы (через запятую)"
                      name="groups"
                      placeholder="ИВТ-101, ИВТ-102"
                      value={formik.values.groups}
                      onChange={formik.handleChange}
                      error={formik.touched.groups && Boolean(formik.errors.groups)}
                      helperText={formik.touched.groups && formik.errors.groups}
                      required
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Время и место
              </Typography>
              <Paper sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Дата занятия"
                      name="date"
                      type="date"
                      value={formik.values.date}
                      onChange={formik.handleChange}
                      error={formik.touched.date && Boolean(formik.errors.date)}
                      helperText={formik.touched.date && formik.errors.date}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Номер пары"
                      name="pairNumber"
                      value={formik.values.pairNumber}
                      onChange={formik.handleChange}
                      error={formik.touched.pairNumber && Boolean(formik.errors.pairNumber)}
                      helperText={formik.touched.pairNumber && formik.errors.pairNumber}
                      required
                    >
                      {getAllPairs().map((pair) => (
                        <MenuItem key={pair.number} value={pair.number}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <Typography variant="body2" fontWeight="bold">
                              {pair.number} пара
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {pair.startTime} - {pair.endTime}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Аудитория"
                      name="room"
                      value={formik.values.room}
                      onChange={formik.handleChange}
                      error={formik.touched.room && Boolean(formik.errors.room)}
                      helperText={formik.touched.room && formik.errors.room}
                      required
                    >
                      {rooms?.rooms?.map((room: any) => (
                        <MenuItem key={room._id} value={room._id}>
                          <Box>
                            <Typography variant="body2">
                              {room.building} {room.number}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Вместимость: {room.capacity} чел.
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Преподаватель"
                      name="teacher"
                      value={formik.values.teacher}
                      onChange={formik.handleChange}
                      error={formik.touched.teacher && Boolean(formik.errors.teacher)}
                      helperText={formik.touched.teacher && formik.errors.teacher}
                      required
                    >
                      {teachers?.users?.map((teacher: any) => (
                        <MenuItem key={teacher._id} value={teacher._id}>
                          {teacher.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Paper>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Дополнительно
              </Typography>
              <Paper sx={{ p: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Примечания"
                  name="notes"
                  placeholder="Дополнительная информация о занятии..."
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                />
              </Paper>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpen(false)} size="large">
              Отмена
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={createMutation.isPending}
              size="large"
              sx={{ minWidth: 120 }}
            >
              {createMutation.isPending ? 'Создание...' : 'Создать занятие'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={cancelDialogOpen} onClose={handleCancelDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Удалить занятие</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography sx={{ mt: 2 }}>
            Вы уверены, что хотите удалить это занятие? Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialogClose}>Отмена</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SessionsPage;