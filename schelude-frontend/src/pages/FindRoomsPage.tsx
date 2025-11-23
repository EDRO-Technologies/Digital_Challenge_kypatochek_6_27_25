import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import { Search, MeetingRoom, People, Build } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { roomService } from '../services/roomService';
import { Room, EquipmentType } from '../types';

const FindRoomsPage: React.FC = () => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:30');
  const [capacity, setCapacity] = useState<string>('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [searchTriggered, setSearchTriggered] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['available-rooms', date, startTime, endTime, capacity, equipment],
    queryFn: () => roomService.findAvailableRooms(
      date,
      startTime,
      endTime,
      capacity ? parseInt(capacity) : undefined,
      equipment.length > 0 ? equipment : undefined
    ),
    enabled: searchTriggered,
  });

  const handleSearch = () => {
    setSearchTriggered(true);
    refetch();
  };

  const handleEquipmentChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setEquipment(typeof value === 'string' ? value.split(',') : value);
  };

  const equipmentOptions: EquipmentType[] = [
    'projector',
    'computer',
    'whiteboard',
    'smartboard',
    'video_conference',
    'lab_equipment',
  ];

  const equipmentLabels: Record<EquipmentType, string> = {
    projector: 'Проектор',
    computer: 'Компьютер',
    whiteboard: 'Доска',
    smartboard: 'Интерактивная доска',
    video_conference: 'Видеоконференция',
    lab_equipment: 'Лабораторное оборудование',
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MeetingRoom /> Поиск свободных аудиторий
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Найдите доступные аудитории на нужное время
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Дата"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="time"
                label="Начало"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="time"
                label="Конец"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Минимальная вместимость (необязательно)"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                InputProps={{
                  startAdornment: <People sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Оборудование (необязательно)</InputLabel>
                <Select
                  multiple
                  value={equipment}
                  onChange={handleEquipmentChange}
                  input={<OutlinedInput label="Оборудование (необязательно)" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={equipmentLabels[value as EquipmentType]} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {equipmentOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {equipmentLabels[option]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={handleSearch}
                fullWidth
                size="large"
              >
                Найти свободные аудитории
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {isLoading && (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error">
          Ошибка поиска: {(error as Error).message}
        </Alert>
      )}

      {searchTriggered && !isLoading && data && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Найдено аудиторий: {data.total}
          </Typography>
          <Grid container spacing={2}>
            {data.rooms.map((room: Room) => (
              <Grid item xs={12} sm={6} md={4} key={room._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {room.building} {room.number}
                    </Typography>
                    <Stack spacing={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <People fontSize="small" color="action" />
                        <Typography variant="body2">
                          Вместимость: {room.capacity}
                        </Typography>
                      </Box>
                      {room.floor && (
                        <Typography variant="body2" color="text.secondary">
                          Этаж: {room.floor}
                        </Typography>
                      )}
                      <Chip label={room.type} size="small" />
                      {room.equipment && room.equipment.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Оборудование:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {room.equipment.map((eq) => (
                              <Chip
                                key={eq}
                                label={equipmentLabels[eq]}
                                size="small"
                                variant="outlined"
                                icon={<Build />}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          {data.rooms.length === 0 && (
            <Alert severity="info">
              Свободных аудиторий на выбранное время не найдено
            </Alert>
          )}
        </Box>
      )}
    </Container>
  );
};

export default FindRoomsPage;
