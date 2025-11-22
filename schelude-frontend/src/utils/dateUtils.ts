import { format, parseISO, isToday, isTomorrow, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';

export const formatDate = (date: string | Date, formatStr: string = 'dd.MM.yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: ru });
};

export const formatTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'HH:mm');
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd.MM.yyyy HH:mm', { locale: ru });
};

export const formatRelativeDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(dateObj)) return 'Сегодня';
  if (isTomorrow(dateObj)) return 'Завтра';
  return formatDate(dateObj, 'EEEE, dd MMMM');
};

export const getDayOfWeek = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'EEEE', { locale: ru });
};

export const getWeekRange = (date: Date = new Date()): { start: Date; end: Date } => {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
};

export const getSessionDuration = (startAt: string, endAt: string): number => {
  const start = parseISO(startAt);
  const end = parseISO(endAt);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
};