import api from '../config/api';
import { Session, ScheduleResponse } from '../types';

export const scheduleService = {
  getTodaySchedule: async (groupNumber: string): Promise<ScheduleResponse> => {
    const response = await api.get<ScheduleResponse>(`/schedule/group/${groupNumber}/today`);
    return response.data;
  },

  getTomorrowSchedule: async (groupNumber: string): Promise<ScheduleResponse> => {
    const response = await api.get<ScheduleResponse>(`/schedule/group/${groupNumber}/tomorrow`);
    return response.data;
  },

  getWeekSchedule: async (groupNumber: string): Promise<ScheduleResponse> => {
    const response = await api.get<ScheduleResponse>(`/schedule/group/${groupNumber}/week`);
    return response.data;
  },

  getRangeSchedule: async (groupNumber: string, startDate: string, endDate: string): Promise<ScheduleResponse> => {
    const response = await api.get<ScheduleResponse>(`/schedule/group/${groupNumber}/range`, {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getMyUpcoming: async (limit: number = 10): Promise<{ success: boolean; sessions: Session[] }> => {
    const response = await api.get(`/schedule/my/upcoming`, {
      params: { limit },
    });
    return response.data;
  },
};