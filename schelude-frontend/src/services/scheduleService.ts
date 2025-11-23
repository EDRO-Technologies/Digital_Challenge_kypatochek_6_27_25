import api from '../config/api';
import { Session, ScheduleResponse } from '../types';

export const scheduleService = {
  getTodaySchedule: async (groupNumber: string, subgroup?: string): Promise<ScheduleResponse> => {
    const params = subgroup ? { subgroup } : {};
    const response = await api.get<ScheduleResponse>(`/schedule/group/${groupNumber}/today`, { params });
    return response.data;
  },

  getTomorrowSchedule: async (groupNumber: string, subgroup?: string): Promise<ScheduleResponse> => {
    const params = subgroup ? { subgroup } : {};
    const response = await api.get<ScheduleResponse>(`/schedule/group/${groupNumber}/tomorrow`, { params });
    return response.data;
  },

  getWeekSchedule: async (groupNumber: string, subgroup?: string): Promise<ScheduleResponse> => {
    const params = subgroup ? { subgroup } : {};
    const response = await api.get<ScheduleResponse>(`/schedule/group/${groupNumber}/week`, { params });
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

  getTeacherTodaySchedule: async (teacherId: string): Promise<ScheduleResponse> => {
    const response = await api.get<ScheduleResponse>(`/schedule/teacher/${teacherId}/today`);
    return response.data;
  },

  getTeacherTomorrowSchedule: async (teacherId: string): Promise<ScheduleResponse> => {
    const response = await api.get<ScheduleResponse>(`/schedule/teacher/${teacherId}/tomorrow`);
    return response.data;
  },

  getTeacherWeekSchedule: async (teacherId: string): Promise<ScheduleResponse> => {
    const response = await api.get<ScheduleResponse>(`/schedule/teacher/${teacherId}/week`);
    return response.data;
  },

  getGroups: async (): Promise<{ success: boolean; groups: string[] }> => {
    const response = await api.get('/schedule/groups');
    return response.data;
  },

  getTeachers: async (): Promise<{ success: boolean; teachers: { _id: string; name: string }[] }> => {
    const response = await api.get('/schedule/teachers');
    return response.data;
  },

  getGroupCyclicSchedule: async (groupNumber: string) => {
    const response = await api.get(`/schedule/group/${groupNumber}/cyclic`);
    return response.data;
  },

  getTeacherCyclicSchedule: async (teacherId: string) => {
    const response = await api.get(`/schedule/teacher/${teacherId}/cyclic`);
    return response.data;
  },
};