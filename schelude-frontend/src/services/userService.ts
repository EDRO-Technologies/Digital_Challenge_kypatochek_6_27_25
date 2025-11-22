import api from '../config/api';
import { User } from '../types';

export const userService = {
  getMe: async (): Promise<{ success: boolean; user: User }> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateMe: async (data: Partial<User>): Promise<{ success: boolean; user: User }> => {
    const response = await api.patch('/users/me', data);
    return response.data;
  },

  changeGroup: async (groupNumber: string): Promise<{ success: boolean; user: User }> => {
    const response = await api.patch('/users/group', { groupNumber });
    return response.data;
  },

  getAll: async (params?: { role?: string; groupNumber?: string; search?: string }): Promise<{ success: boolean; users: User[] }> => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; user: User }> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<User>): Promise<{ success: boolean; user: User }> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};