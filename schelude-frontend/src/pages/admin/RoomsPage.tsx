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
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { roomService } from '../../services/roomService';

const roomSchema = yup.object({
  number: yup.string().required('Номер обязателен'),
  building: yup.string().required('Корпус обязателен'),
  capacity: yup.number().min(1).required('Вместимость обязательна'),
  floor: yup.number(),
  type: yup.string().required('Тип обязателен'),
});

const RoomsPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: roomService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      handleClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Ошибка создания аудитории');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => roomService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      handleClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Ошибка обновления аудитории');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: roomService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const handleClose = () => {
    setOpen(false);
    setEditingRoom(null);
    setError('');
    formik.resetForm();
  };

  const handleEdit = (room: any) => {
    setEditingRoom(room);
    formik.setValues({
      number: room.number,
      building: room.building,
      capacity: room.capacity,
      floor: room.floor || 1,
      type: room.type,
      notes: room.notes || '',
    });
    setOpen(true);
  };

  const formik = useFormik({
    initialValues: {
      number: '',
      building: '',
      capacity: 30,
      floor: 1,
      type: 'lecture',
      notes: '',
    },
    validationSchema: roomSchema,
    onSubmit: (values) => {
      if (editingRoom) {
        updateMutation.mutate({ id: editingRoom._id, data: values });
      } else {
        createMutation.mutate(values);
      }
    },
  });

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Управление аудиториями
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
        >
          Добавить аудиторию
        </Button>
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {rooms?.rooms?.map((room: any) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={room._id}>
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom fontWeight="bold">
                    {room.building} {room.number}
                  </Typography>
                  <Stack spacing={1}>
                    <Chip
                      label={room.type}
                      size="small"
                      color="primary"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Вместимость: {room.capacity} мест
                    </Typography>
                    {room.floor && (
                      <Typography variant="body2" color="text.secondary">
                        Этаж: {room.floor}
                      </Typography>
                    )}
                    {room.equipment && room.equipment.length > 0 && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Оборудование:
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {room.equipment.map((eq: string, i: number) => (
                            <Chip key={i} label={eq} size="small" variant="outlined" />
                          ))}
                        </Stack>
                      </Box>
                    )}
                    {room.notes && (
                      <Typography variant="body2" color="text.secondary">
                        {room.notes}
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<Edit />}
                    onClick={() => handleEdit(room)}
                  >
                    Редактировать
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => deleteMutation.mutate(room._id)}
                  >
                    Удалить
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRoom ? 'Редактировать аудиторию' : 'Добавить новую аудиторию'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Корпус"
                  name="building"
                  value={formik.values.building}
                  onChange={formik.handleChange}
                  error={formik.touched.building && Boolean(formik.errors.building)}
                  helperText={formik.touched.building && formik.errors.building}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Номер"
                  name="number"
                  value={formik.values.number}
                  onChange={formik.handleChange}
                  error={formik.touched.number && Boolean(formik.errors.number)}
                  helperText={formik.touched.number && formik.errors.number}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Вместимость"
                  name="capacity"
                  value={formik.values.capacity}
                  onChange={formik.handleChange}
                  error={formik.touched.capacity && Boolean(formik.errors.capacity)}
                  helperText={formik.touched.capacity && formik.errors.capacity}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Этаж"
                  name="floor"
                  value={formik.values.floor}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Тип аудитории"
                  name="type"
                  value={formik.values.type}
                  onChange={formik.handleChange}
                  error={formik.touched.type && Boolean(formik.errors.type)}
                  helperText={formik.touched.type && formik.errors.type}
                >
                  <MenuItem value="lecture">Лекционная</MenuItem>
                  <MenuItem value="lab">Лаборатория</MenuItem>
                  <MenuItem value="seminar">Семинарская</MenuItem>
                  <MenuItem value="computer_lab">Компьютерный класс</MenuItem>
                  <MenuItem value="auditorium">Аудитория</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Примечания"
                  name="notes"
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Отмена</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingRoom
                ? (updateMutation.isPending ? 'Сохранение...' : 'Сохранить')
                : (createMutation.isPending ? 'Создание...' : 'Создать')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default RoomsPage;