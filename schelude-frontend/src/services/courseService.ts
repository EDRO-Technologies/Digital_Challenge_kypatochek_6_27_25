import api from '../config/api';
import { Course } from '../types';

export const courseService = {
  getAll: async (params?: { department?: string; semester?: number; isActive?: boolean }): Promise<{ success: boolean; courses: Course[] }> => {
    const response = await api.get('/courses', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; course: Course }> => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  create: async (data: Partial<Course>): Promise<{ success: boolean; course: Course }> => {
    const response = await api.post('/courses', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Course>): Promise<{ success: boolean; course: Course }> => {
    const response = await api.put(`/courses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },
};