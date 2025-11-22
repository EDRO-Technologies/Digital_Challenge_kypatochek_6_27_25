import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../config/api';
import { formatDateTime } from '../../utils/dateUtils';

const NotificationsPage: React.FC = () => {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data;
    },
  });

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      session_created: 'Создано занятие',
      session_cancelled: 'Отменено занятие',
      session_moved: 'Перенесено занятие',
      time_changed: 'Изменено время',
      room_changed: 'Изменена аудитория',
      teacher_changed: 'Изменен преподаватель',
      status_changed: 'Изменен статус',
    };
    return labels[type] || type;
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
        Центр уведомлений
      </Typography>

      {isLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          <List>
            {notifications?.notifications?.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="Уведомлений нет"
                  secondary="Здесь будут отображаться все отправленные уведомления"
                />
              </ListItem>
            ) : (
              notifications?.notifications?.map((notification: any, index: number) => (
                <React.Fragment key={notification._id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={getTypeLabel(notification.type)}
                            size="small"
                            color="primary"
                          />
                          <Typography variant="body2" color="text.secondary">
                            {formatDateTime(notification.sentAt)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body1" sx={{ mt: 1 }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Группы: {notification.affectedGroups?.join(', ')}
                          </Typography>
                          {notification.comment && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              Комментарий: {notification.comment}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                  {index < notifications.notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))
            )}
          </List>
        </Paper>
      )}
    </Container>
  );
};

export default NotificationsPage;