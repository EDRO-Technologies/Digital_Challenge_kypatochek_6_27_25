import api from '../config/api';
import { User } from '../types';

export const teacherService = {
  create: async (data: Partial<User>): Promise<{ success: boolean; teacher: User }> => {
    const response = await api.post('/teachers', data);
    return response.data;
  },

  update: async (id: string, data: Partial<User>): Promise<{ success: boolean; teacher: User }> => {
    const response = await api.put(`/teachers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/teachers/${id}`);
    return response.data;
  },

  activate: async (id: string): Promise<{ success: boolean; teacher: User }> => {
    const response = await api.patch(`/teachers/${id}/activate`);
    return response.data;
  },

  getSchedule: async (id: string, filters?: any) => {
    const response = await api.get(`/teachers/${id}/schedule`, { params: filters });
    return response.data;
  },

  bulkCreateSessions: async (teacherId: string, sessions: any[]) => {
    const response = await api.post(`/teachers/${teacherId}/schedule/bulk`, { sessions });
    return response.data;
  },
};
