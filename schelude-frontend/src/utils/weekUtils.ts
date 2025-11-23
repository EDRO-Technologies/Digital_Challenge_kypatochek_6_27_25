import { WeekParity } from '../types';
import { differenceInWeeks, startOfWeek } from 'date-fns';

// СурГУ время пар
export const SURGU_PAIR_TIMES = [
  { number: 1, startTime: '09:00', endTime: '10:30' },
  { number: 2, startTime: '10:50', endTime: '12:20' },
  { number: 3, startTime: '12:40', endTime: '14:10' },
  { number: 4, startTime: '14:30', endTime: '16:00' },
  { number: 5, startTime: '16:20', endTime: '17:50' },
  { number: 6, startTime: '18:00', endTime: '19:30' },
  { number: 7, startTime: '19:40', endTime: '21:10' },
  { number: 8, startTime: '21:20', endTime: '22:50' },
];

/**
 * Получить начало текущего семестра (динамически)
 * Осенний семестр: первый понедельник сентября
 * Весенний семестр: первый понедельник середины февраля
 */
export const getCurrentSemesterStart = (): Date => {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  if (month >= 1 && month < 7) {
    // Февраль-июнь = весенний семестр
    // Находим первый понедельник около 10 февраля
    const feb10 = new Date(year, 1, 10);
    return startOfWeek(feb10, { weekStartsOn: 1 });
  } else {
    // Июль-январь = осенний семестр
    const septYear = month >= 7 ? year : year - 1;
    const sept1 = new Date(septYear, 8, 1);
    return startOfWeek(sept1, { weekStartsOn: 1 });
  }
};

/**
 * Получить номер недели с начала семестра (1-based)
 */
export const getWeekNumberFromSemesterStart = (date: Date = new Date()): number => {
  const semesterStart = getCurrentSemesterStart();
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Понедельник
  const semesterWeekStart = startOfWeek(semesterStart, { weekStartsOn: 1 });
  
  const weeksDiff = differenceInWeeks(weekStart, semesterWeekStart);
  return weeksDiff + 1; // 1-based
};

/**
 * Определить четность текущей недели
 */
export const getCurrentWeekParity = (): 'odd' | 'even' => {
  const weekNumber = getWeekNumberFromSemesterStart();
  return weekNumber % 2 === 1 ? 'odd' : 'even';
};

/**
 * Проверить, подходит ли пара для данной недели
 */
export const isSessionValidForWeek = (
  sessionWeekParity: WeekParity | undefined,
  date: Date = new Date()
): boolean => {
  if (!sessionWeekParity || sessionWeekParity === 'both') {
    return true;
  }

  const weekNumber = getWeekNumberFromSemesterStart(date);
  const weekParity = weekNumber % 2 === 1 ? 'odd' : 'even';

  return sessionWeekParity === weekParity;
};

/**
 * Получить метку для отображения четности недели
 */
export const getWeekParityLabel = (parity: WeekParity): string => {
  switch (parity) {
    case 'odd':
      return 'Числитель';
    case 'even':
      return 'Знаменатель';
    case 'both':
      return 'Каждую неделю';
    default:
      return '';
  }
};

/**
 * Получить короткую метку для отображения
 */
export const getWeekParityShortLabel = (parity: WeekParity): string => {
  switch (parity) {
    case 'odd':
      return 'Числ.';
    case 'even':
      return 'Знам.';
    case 'both':
      return '';
    default:
      return '';
  }
};

/**
 * Получить информацию о текущей неделе
 */
export const getCurrentWeekInfo = () => {
  const weekNumber = getWeekNumberFromSemesterStart();
  const parity = getCurrentWeekParity();
  
  return {
    weekNumber,
    parity,
    parityLabel: getWeekParityLabel(parity),
    semesterStart: getCurrentSemesterStart(),
  };
};
