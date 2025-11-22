import { Session, SessionStatus, SessionType } from '../types';

export const getStatusColor = (status: SessionStatus): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
  switch (status) {
    case 'planned':
      return 'default';
    case 'confirmed':
      return 'success';
    case 'moved':
      return 'warning';
    case 'cancelled':
      return 'error';
    case 'online':
      return 'info';
    default:
      return 'default';
  }
};

export const getStatusLabel = (status: SessionStatus): string => {
  switch (status) {
    case 'planned':
      return 'Запланировано';
    case 'confirmed':
      return 'Подтверждено';
    case 'moved':
      return 'Перенесено';
    case 'cancelled':
      return 'Отменено';
    case 'online':
      return 'Онлайн';
    default:
      return status;
  }
};

export const getTypeLabel = (type: SessionType): string => {
  switch (type) {
    case 'lecture':
      return 'Лекция';
    case 'practice':
      return 'Практика';
    case 'lab':
      return 'Лабораторная';
    case 'seminar':
      return 'Семинар';
    case 'exam':
      return 'Экзамен';
    case 'consultation':
      return 'Консультация';
    default:
      return type;
  }
};

export const getTypeColor = (type: SessionType): string => {
  switch (type) {
    case 'lecture':
      return '#1976d2';
    case 'practice':
      return '#2e7d32';
    case 'lab':
      return '#ed6c02';
    case 'seminar':
      return '#9c27b0';
    case 'exam':
      return '#d32f2f';
    case 'consultation':
      return '#0288d1';
    default:
      return '#757575';
  }
};

export const canEditSession = (session: Session, userRole: string): boolean => {
  if (userRole === 'superadmin') return true;
  if (userRole !== 'admin') return false;
  
  const now = new Date();
  const startAt = new Date(session.startAt);
  const hoursUntilStart = (startAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return hoursUntilStart > 5;
};

export const getEditWarning = (session: Session, userRole: string): string | null => {
  if (userRole === 'superadmin') return null;
  if (userRole !== 'admin') return 'У вас нет прав на редактирование';
  
  const now = new Date();
  const startAt = new Date(session.startAt);
  const hoursUntilStart = (startAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilStart <= 5) {
    return `Нельзя редактировать занятие за ${hoursUntilStart.toFixed(1)} часов до начала`;
  }
  
  return null;
};