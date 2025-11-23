import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Alert,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/userService';
import { User } from '../../types';

const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'guest',
    groupNumber: '',
    isActive: true,
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: userService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleOpenDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email || '',
      role: user.role,
      groupNumber: user.groupNumber || '',
      isActive: user.isActive ?? true,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleSubmit = () => {
    if (!editingUser) return;
    
    updateMutation.mutate({
      id: editingUser._id,
      data: formData,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Вы уверены что хотите удалить этого пользователя?')) {
      deleteMutation.mutate(id);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'error';
      case 'admin':
        return 'warning';
      case 'teacher':
        return 'info';
      case 'student':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
        Управление пользователями
      </Typography>

      {isLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Имя</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Роль</TableCell>
                <TableCell>Группа</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users?.users?.map((user: any) => (
                <TableRow key={user._id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      size="small"
                      color={getRoleColor(user.role) as any}
                    />
                  </TableCell>
                  <TableCell>{user.groupNumber || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Активен' : 'Неактивен'}
                      size="small"
                      color={user.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenDialog(user)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(user._id)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Редактировать пользователя</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Имя"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Роль"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <MenuItem value="guest">Гость</MenuItem>
                <MenuItem value="student">Студент</MenuItem>
                <MenuItem value="teacher">Преподаватель</MenuItem>
                <MenuItem value="admin">Админ</MenuItem>
                <MenuItem value="superadmin">Супер-админ</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Группа"
                value={formData.groupNumber}
                onChange={(e) => setFormData({ ...formData, groupNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Статус"
                value={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
              >
                <MenuItem value="true">Активен</MenuItem>
                <MenuItem value="false">Неактивен</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          {updateMutation.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {updateMutation.error?.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={updateMutation.isPending}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UsersPage;