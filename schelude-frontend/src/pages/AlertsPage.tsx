import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Info,
  Cancel,
  Room,
  Person,
  Add,
  CheckCircle,
  AccessTime,
  Refresh,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { notificationService } from '../services/notificationService';

interface Notification {
  _id: string;
  type: string;
  session: any;
  createdAt: string;
  payload: {
    message: string;
  };
}

const AlertsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'today'>('all');
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading, error } = useQuery({
    queryKey: ['public-notifications', filter],
    queryFn: () => notificationService.getMyNotifications({ limit: 100 }),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['public-notifications'] });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'session_cancelled': return <Cancel color="error" />;
      case 'room_changed': return <Room color="warning" />;
      case 'teacher_changed': return <Person color="warning" />;
      case 'session_created': return <Add color="success" />;
      case 'time_changed': return <AccessTime color="warning" />;
      default: return <Info color="info" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      session_cancelled: 'Отменено',
      room_changed: 'Смена аудитории',
      teacher_changed: 'Смена преподавателя',
      session_created: 'Новое занятие',
      time_changed: 'Перенос',
      session_moved: 'Перенос',
    };
    return labels[type] || 'Изменение';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'session_cancelled': return 'error';
      case 'session_created': return 'success';
      case 'room_changed':
      case 'teacher_changed':
      case 'time_changed':
      case 'session_moved':
        return 'warning';
      default: return 'info';
    }
  };

  const notifications = notificationsData?.notifications || [];

  // Filter today's notifications
  const filteredNotifications = filter === 'today'
    ? notifications.filter((n: Notification) => {
        const notifDate = new Date(n.createdAt);
        const today = new Date();
        return notifDate.toDateString() === today.toDateString();
      })
    : notifications;

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          🔔 Алерты и уведомления
        </Typography>
        <Tooltip title="Обновить">
          <IconButton onClick={handleRefresh}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={filter}
          onChange={(_, newValue) => setFilter(newValue)}
          variant="fullWidth"
        >
          <Tab label="Все уведомления" value="all" />
          <Tab label="Сегодня" value="today" />
        </Tabs>
      </Paper>

      {isLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">Ошибка загрузки уведомлений</Alert>
      ) : filteredNotifications.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Нет уведомлений
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Все изменения в расписании будут отображаться здесь
          </Typography>
        </Paper>
      ) : (
        <Paper>
          <List>
            {filteredNotifications.map((notification: Notification, index: number) => (
              <React.Fragment key={notification._id}>
                <ListItem
                  sx={{
                    borderLeft: '4px solid',
                    borderColor: `${getTypeColor(notification.type)}.main`,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1">
                          {notification.session?.course?.name || 'Занятие'}
                        </Typography>
                        <Chip
                          label={getNotificationTypeLabel(notification.type)}
                          color={getTypeColor(notification.type) as any}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {notification.payload?.message || 'Изменение в расписании'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: ru,
                          })}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < filteredNotifications.length - 1 && <Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
};

export default AlertsPage;
