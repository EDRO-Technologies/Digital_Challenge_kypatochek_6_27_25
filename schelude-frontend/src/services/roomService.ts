import api from '../config/api';
import { Room } from '../types';

export const roomService = {
  getAll: async (params?: { building?: string; type?: string; isActive?: boolean }): Promise<{ success: boolean; rooms: Room[] }> => {
    const response = await api.get('/rooms', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; room: Room }> => {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },

  create: async (data: Partial<Room>): Promise<{ success: boolean; room: Room }> => {
    const response = await api.post('/rooms', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Room>): Promise<{ success: boolean; room: Room }> => {
    const response = await api.put(`/rooms/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/rooms/${id}`);
    return response.data;
  },
};