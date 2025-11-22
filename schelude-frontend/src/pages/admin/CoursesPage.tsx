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
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { courseService } from '../../services/courseService';

const courseSchema = yup.object({
  name: yup.string().required('Название обязательно'),
  code: yup.string().required('Код обязателен'),
  department: yup.string().required('Кафедра обязательна'),
  direction: yup.string().required('Направление обязательно'),
  credits: yup.number().min(1).required('Кредиты обязательны'),
  semester: yup.number().min(1).max(12).required('Семестр обязателен'),
});

const CoursesPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: courseService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setOpen(false);
      formik.resetForm();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Ошибка создания курса');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: courseService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      code: '',
      department: '',
      direction: '',
      credits: 3,
      semester: 1,
      description: '',
    },
    validationSchema: courseSchema,
    onSubmit: (values) => {
      createMutation.mutate(values);
    },
  });

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Управление курсами
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
        >
          Добавить курс
        </Button>
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {courses?.courses?.map((course: any) => (
            <Grid item xs={12} md={6} lg={4} key={course._id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6" gutterBottom>
                      {course.name}
                    </Typography>
                    <Chip
                      label={course.isActive ? 'Активен' : 'Неактивен'}
                      color={course.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Код: {course.code}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Кафедра: {course.department}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Направление: {course.direction}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Кредитов: {course.credits} | Семестр: {course.semester}
                  </Typography>
                  {course.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {course.description}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<Edit />}>
                    Редактировать
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => deleteMutation.mutate(course._id)}
                  >
                    Удалить
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Добавить новый курс</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Название курса"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Код"
                  name="code"
                  value={formik.values.code}
                  onChange={formik.handleChange}
                  error={formik.touched.code && Boolean(formik.errors.code)}
                  helperText={formik.touched.code && formik.errors.code}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Кафедра"
                  name="department"
                  value={formik.values.department}
                  onChange={formik.handleChange}
                  error={formik.touched.department && Boolean(formik.errors.department)}
                  helperText={formik.touched.department && formik.errors.department}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Направление"
                  name="direction"
                  value={formik.values.direction}
                  onChange={formik.handleChange}
                  error={formik.touched.direction && Boolean(formik.errors.direction)}
                  helperText={formik.touched.direction && formik.errors.direction}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Кредиты"
                  name="credits"
                  value={formik.values.credits}
                  onChange={formik.handleChange}
                  error={formik.touched.credits && Boolean(formik.errors.credits)}
                  helperText={formik.touched.credits && formik.errors.credits}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Семестр"
                  name="semester"
                  value={formik.values.semester}
                  onChange={formik.handleChange}
                  error={formik.touched.semester && Boolean(formik.errors.semester)}
                  helperText={formik.touched.semester && formik.errors.semester}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Описание"
                  name="description"
                  value={formik.values.description}
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

export default CoursesPage;