import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
} from '@mui/material';
import { Add, Edit, Delete, CalendarMonth, Person, CheckCircle } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { scheduleService } from '../../services/scheduleService';
import { teacherService } from '../../services/teacherService';
import { userService } from '../../services/userService';
import { User } from '../../types';

const TeachersManagementPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    telegram: '',
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: teachersData, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => userService.getAll({ role: 'teacher' }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<User>) => teacherService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => 
      teacherService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teacherService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => teacherService.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  const handleOpenDialog = (teacher?: User) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        name: teacher.name,
        email: teacher.email || '',
        phone: teacher.contacts?.phone || '',
        telegram: teacher.contacts?.telegram || '',
      });
    } else {
      setEditingTeacher(null);
      setFormData({ name: '', email: '', phone: '', telegram: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTeacher(null);
    setFormData({ name: '', email: '', phone: '', telegram: '' });
  };

  const handleSubmit = () => {
    const submitData: any = {
      name: formData.name,
      email: formData.email || undefined,
      contacts: {
        phone: formData.phone || undefined,
        telegram: formData.telegram || undefined,
      }
    };

    if (editingTeacher) {
      updateMutation.mutate({ id: editingTeacher._id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Вы уверены что хотите деактивировать этого преподавателя?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleActivate = (id: string) => {
    if (window.confirm('Вы уверены что хотите активировать этого преподавателя?')) {
      activateMutation.mutate(id);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          Управление преподавателями
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Добавить преподавателя
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ФИО</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Телефон</TableCell>
              <TableCell>Telegram</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Загрузка...
                </TableCell>
              </TableRow>
            ) : (
              teachersData?.users.map((teacher: any) => (
                <TableRow key={teacher._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person color="action" />
                      {teacher.name}
                    </Box>
                  </TableCell>
                  <TableCell>{teacher.email || '—'}</TableCell>
                  <TableCell>{teacher.contacts?.phone || '—'}</TableCell>
                  <TableCell>{teacher.contacts?.telegram || '—'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={teacher.isActive ? 'Активен' : 'Неактивен'} 
                      color={teacher.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/admin/teachers/${teacher._id}/schedule`)}
                      title="Расписание"
                    >
                      <CalendarMonth />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(teacher)}
                      title="Редактировать"
                    >
                      <Edit />
                    </IconButton>
                    {teacher.isActive ? (
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(teacher._id)}
                        color="error"
                        title="Деактивировать"
                      >
                        <Delete />
                      </IconButton>
                    ) : (
                      <Button
                        size="small"
                        startIcon={<CheckCircle />}
                        onClick={() => handleActivate(teacher._id)}
                        color="success"
                        variant="outlined"
                      >
                        Активировать
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTeacher ? 'Редактировать преподавателя' : 'Добавить преподавателя'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ФИО *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Телефон"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telegram"
                value={formData.telegram}
                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
              />
            </Grid>
          </Grid>
          {(createMutation.error || updateMutation.error) && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(createMutation.error || updateMutation.error)?.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name || createMutation.isPending || updateMutation.isPending}
          >
            {editingTeacher ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeachersManagementPage;
