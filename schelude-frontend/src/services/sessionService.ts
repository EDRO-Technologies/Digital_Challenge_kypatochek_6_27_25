import api from '../config/api';
import { Session, PaginatedResponse, ConflictDetails } from '../types';

export const sessionService = {
  getAll: async (params?: {
    course?: string;
    teacher?: string;
    room?: string;
    group?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Session>> => {
    const response = await api.get<PaginatedResponse<Session>>('/sessions', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; session: Session }> => {
    const response = await api.get(`/sessions/${id}`);
    return response.data;
  },

  create: async (data: {
    course: string;
    startAt: string;
    endAt: string;
    room: string;
    teacher: string;
    groups: string[];
    type?: string;
    notes?: string;
  }): Promise<{ success: boolean; session: Session }> => {
    const response = await api.post('/sessions', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Session>): Promise<{ success: boolean; session: Session }> => {
    const response = await api.put(`/sessions/${id}`, data);
    return response.data;
  },

  updateStatus: async (
    id: string,
    status: string,
    comment?: string,
    onlineLink?: string
  ): Promise<{ success: boolean; session: Session }> => {
    const response = await api.patch(`/sessions/${id}/status`, {
      status,
      comment,
      onlineLink,
    });
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/sessions/${id}`);
    return response.data;
  },
};