export interface PairTime {
  number: number;
  startTime: string;
  endTime: string;
}

// СурГУ расписание пар
export const PAIR_SCHEDULE: Record<number, { start: string; end: string }> = {
  1: { start: '09:00', end: '10:30' },
  2: { start: '10:50', end: '12:20' },
  3: { start: '12:40', end: '14:10' },
  4: { start: '14:30', end: '16:00' },
  5: { start: '16:20', end: '17:50' },
  6: { start: '18:00', end: '19:30' },
  7: { start: '19:40', end: '21:10' },
  8: { start: '21:20', end: '22:50' },
};

export const getPairTime = (pairNumber: number): { start: string; end: string } | null => {
  return PAIR_SCHEDULE[pairNumber] || null;
};

export const getAllPairs = (): PairTime[] => {
  return Object.entries(PAIR_SCHEDULE).map(([num, times]) => ({
    number: parseInt(num),
    startTime: times.start,
    endTime: times.end,
  }));
};

export const formatPairTime = (pairNumber: number): string => {
  const time = getPairTime(pairNumber);
  if (!time) return '';
  return `${time.start} - ${time.end}`;
};
