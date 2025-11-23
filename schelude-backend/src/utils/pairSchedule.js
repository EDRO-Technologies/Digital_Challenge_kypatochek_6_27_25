/**
 * Расписание звонков для корпусов А, Г, К и У
 * Каждая пара имеет фиксированное время начала и окончания
 */

const PAIR_SCHEDULE = {
  1: { start: '08:30', end: '09:50' },
  2: { start: '10:00', end: '11:20' },
  3: { start: '11:30', end: '12:50' },
  4: { start: '13:20', end: '14:40' },
  5: { start: '14:50', end: '16:10' },
  6: { start: '16:20', end: '17:40' },
  7: { start: '18:00', end: '19:20' },
  8: { start: '19:30', end: '20:50' }
};

/**
 * Получить время начала и окончания пары
 * @param {number} pairNumber - Номер пары (1-8)
 * @returns {object} { start: 'HH:MM', end: 'HH:MM' }
 */
function getPairTime(pairNumber) {
  if (!PAIR_SCHEDULE[pairNumber]) {
    throw new Error(`Invalid pair number: ${pairNumber}. Must be between 1 and 8.`);
  }
  return PAIR_SCHEDULE[pairNumber];
}

/**
 * Преобразовать номер пары и дату в полные Date объекты
 * @param {Date} date - Дата занятия
 * @param {number} pairNumber - Номер пары (1-8)
 * @returns {object} { startAt: Date, endAt: Date }
 */
function pairToDateTime(date, pairNumber) {
  const pairTime = getPairTime(pairNumber);
  
  const startAt = new Date(date);
  const [startHour, startMinute] = pairTime.start.split(':').map(Number);
  startAt.setHours(startHour, startMinute, 0, 0);
  
  const endAt = new Date(date);
  const [endHour, endMinute] = pairTime.end.split(':').map(Number);
  endAt.setHours(endHour, endMinute, 0, 0);
  
  return { startAt, endAt };
}

/**
 * Определить номер пары по времени
 * @param {Date} time - Время для проверки
 * @returns {number|null} Номер пары или null если время не соответствует паре
 */
function getTimePairNumber(time) {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  for (const [pairNum, times] of Object.entries(PAIR_SCHEDULE)) {
    if (timeStr >= times.start && timeStr <= times.end) {
      return parseInt(pairNum);
    }
  }
  
  return null;
}

/**
 * Получить список всех пар
 * @returns {array} Массив объектов с информацией о парах
 */
function getAllPairs() {
  return Object.entries(PAIR_SCHEDULE).map(([num, times]) => ({
    number: parseInt(num),
    startTime: times.start,
    endTime: times.end
  }));
}

module.exports = {
  PAIR_SCHEDULE,
  getPairTime,
  pairToDateTime,
  getTimePairNumber,
  getAllPairs
};
