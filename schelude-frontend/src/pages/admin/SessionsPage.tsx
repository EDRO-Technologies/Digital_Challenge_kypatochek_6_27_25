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
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { sessionService } from '../../services/sessionService';
import { courseService } from '../../services/courseService';
import { roomService } from '../../services/roomService';
import { userService } from '../../services/userService';
import SessionCard from '../../components/SessionCard';
import { format } from 'date-fns';

const sessionSchema = yup.object({
  course: yup.string().required('Курс обязателен'),
  startAt: yup.string().required('Время начала обязательно'),
  endAt: yup.string().required('Время окончания обязательно'),
  room: yup.string().required('Аудитория обязательна'),
  teacher: yup.string().required('Преподаватель обязателен'),
  groups: yup.string().required('Группы обязательны'),
  type: yup.string().required('Тип обязателен'),
});

const SessionsPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionService.getAll({ limit: 100 }),
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

  const formik = useFormik({
    initialValues: {
      course: '',
      startAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      room: '',
      teacher: '',
      groups: '',
      type: 'lecture',
      notes: '',
    },
    validationSchema: sessionSchema,
    onSubmit: (values) => {
      const groups = values.groups.split(',').map(g => g.trim());
      createMutation.mutate({ ...values, groups });
    },
  });

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Управление занятиями
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
        >
          Создать занятие
        </Button>
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          {sessions?.sessions?.map((session: any) => (
            <SessionCard key={session._id} session={session} />
          ))}
        </Stack>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Создать новое занятие</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
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
                >
                  {courses?.courses?.map((course: any) => (
                    <MenuItem key={course._id} value={course._id}>
                      {course.name} ({course.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Время начала"
                  name="startAt"
                  type="datetime-local"
                  value={formik.values.startAt}
                  onChange={formik.handleChange}
                  error={formik.touched.startAt && Boolean(formik.errors.startAt)}
                  helperText={formik.touched.startAt && formik.errors.startAt}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Время окончания"
                  name="endAt"
                  type="datetime-local"
                  value={formik.values.endAt}
                  onChange={formik.handleChange}
                  error={formik.touched.endAt && Boolean(formik.errors.endAt)}
                  helperText={formik.touched.endAt && formik.errors.endAt}
                  InputLabelProps={{ shrink: true }}
                />
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
                >
                  {rooms?.rooms?.map((room: any) => (
                    <MenuItem key={room._id} value={room._id}>
                      {room.building} {room.number}
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
                >
                  {teachers?.users?.map((teacher: any) => (
                    <MenuItem key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </MenuItem>
                  ))}
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
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Тип занятия"
                  name="type"
                  value={formik.values.type}
                  onChange={formik.handleChange}
                >
                  <MenuItem value="lecture">Лекция</MenuItem>
                  <MenuItem value="practice">Практика</MenuItem>
                  <MenuItem value="lab">Лабораторная</MenuItem>
                  <MenuItem value="seminar">Семинар</MenuItem>
                  <MenuItem value="exam">Экзамен</MenuItem>
                  <MenuItem value="consultation">Консультация</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Примечания"
                  name="notes"
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Отмена</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default SessionsPage;