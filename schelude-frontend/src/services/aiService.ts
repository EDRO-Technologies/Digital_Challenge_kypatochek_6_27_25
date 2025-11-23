import api from '../config/api';

export interface AIChatRequest {
  message: string;
}

export interface AIChatResponse {
  success: boolean;
  response: string;
}

export const aiService = {
  chat: async (message: string): Promise<string> => {
    const response = await api.post<AIChatResponse>('/ai/chat', { message });
    return response.data.response;
  },

  getContext: async (params?: {
    date?: string;
    groupNumber?: string;
    teacherId?: string;
    roomId?: string;
  }) => {
    const response = await api.get('/ai/context', { params });
    return response.data;
  },

  getAvailableRooms: async (date: string, pairNumber: number) => {
    const response = await api.get('/ai/available-rooms', {
      params: { date, pairNumber }
    });
    return response.data.rooms;
  },
};
