import api from '../config/api';
import { AuthResponse } from '../types';

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    groupNumber?: string;
  }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  createGuest: async (groupNumber: string, name?: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/guest', {
      groupNumber,
      name: name || `Guest ${Date.now()}`,
    });
    return response.data;
  },

  telegramInit: async (telegramId: string, groupNumber: string, name?: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/telegram-init', {
      telegramId,
      groupNumber,
      name,
    });
    return response.data;
  },
};