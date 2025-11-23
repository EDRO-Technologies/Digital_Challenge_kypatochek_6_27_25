import api from '../config/api';

export const notificationService = {
  getMyNotifications: async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }) => {
    const response = await api.get('/notifications/my', { params });
    return response.data;
  },

  markAsRead: async (notificationId: string) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
};
