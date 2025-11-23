import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Notifications,
  NotificationsNone,
  Info,
  Cancel,
  Room,
  Person,
  Add,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { notificationService } from '../services/notificationService';

interface Notification {
  _id: string;
  type: string;
  message: string;
  session: any;
  createdAt: string;
  read: boolean;
}

const NotificationBell: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch notifications every 30 seconds
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getMyNotifications({ limit: 50 }),
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsReadMutation.mutate(notification._id);
    }
    handleClose();
    // Navigate to schedule page instead
    navigate('/schedule');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'session_cancelled': return <Cancel color="error" />;
      case 'room_changed': return <Room color="warning" />;
      case 'teacher_changed': return <Person color="warning" />;
      case 'session_created': return <Add color="success" />;
      default: return <Info color="info" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    const course = notification.session?.course?.name || 'Занятие';
    switch (notification.type) {
      case 'session_cancelled':
        return `${course} отменено`;
      case 'room_changed':
        return `${course} - изменена аудитория`;
      case 'teacher_changed':
        return `${course} - изменен преподаватель`;
      case 'session_created':
        return `Новое занятие: ${course}`;
      case 'time_changed':
        return `${course} - изменено время`;
      default:
        return `Изменение: ${course}`;
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? <Notifications /> : <NotificationsNone />}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
          },
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="h6">Уведомления</Typography>
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">Нет уведомлений</Typography>
          </Box>
        ) : (
          notifications.slice(0, 10).map((notification: Notification) => (
            <MenuItem
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                bgcolor: notification.read ? 'transparent' : 'action.hover',
                borderLeft: notification.read ? 'none' : '4px solid',
                borderColor: 'primary.main',
              }}
            >
              <ListItemIcon>
                {getNotificationIcon(notification.type)}
              </ListItemIcon>
              <ListItemText
                primary={getNotificationText(notification)}
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </Typography>
                }
              />
            </MenuItem>
          ))
        )}

        {notifications.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 1 }}>
              <Button
                fullWidth
                size="small"
                onClick={() => {
                  handleClose();
                  navigate('/notifications');
                }}
              >
                Показать все
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
