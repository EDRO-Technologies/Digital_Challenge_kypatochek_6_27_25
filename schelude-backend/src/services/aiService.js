const axios = require('axios');
const Session = require('../models/Session');
const Course = require('../models/Course');
const Room = require('../models/Room');
const User = require('../models/User');

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://localhost:1234/v1/chat/completions';
const MODEL_NAME = process.env.AI_MODEL || 'qwen/qwen3-vl-4b';

class AIService {
  /**
   * Получить контекст расписания для AI
   */
  async getScheduleContext(options = {}) {
    const { date, groupNumber, teacherId, roomId } = options;

    const query = {};
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.startAt = { $gte: startOfDay, $lte: endOfDay };
    }
    if (groupNumber) query.groups = groupNumber;
    if (teacherId) query.teacher = teacherId;
    if (roomId) query.room = roomId;

    const sessions = await Session.find(query)
      .populate('course', 'name code')
      .populate('teacher', 'name')
      .populate('room', 'number building capacity')
      .sort({ startAt: 1 })
      .lean();

    return sessions;
  }

  /**
   * Получить свободные аудитории на определенное время
   */
  async getAvailableRooms(date, pairNumber) {
    const pairSchedule = require('../utils/pairSchedule');
    const times = pairSchedule.getPairTimes(pairNumber);
    
    const startAt = new Date(date);
    startAt.setHours(times.start.hours, times.start.minutes, 0, 0);
    const endAt = new Date(date);
    endAt.setHours(times.end.hours, times.end.minutes, 0, 0);

    // Найти занятые аудитории
    const busySessions = await Session.find({
      startAt: { $lt: endAt },
      endAt: { $gt: startAt },
      status: { $nin: ['cancelled'] }
    }).select('room');

    const busyRoomIds = busySessions.map(s => s.room.toString());

    // Найти свободные аудитории
    const availableRooms = await Room.find({
      _id: { $nin: busyRoomIds },
      isActive: true
    }).lean();

    return availableRooms;
  }

  /**
   * Получить свободные слоты для преподавателя
   */
  async getTeacherAvailableSlots(teacherId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const busySessions = await Session.find({
      teacher: teacherId,
      startAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled'] }
    }).select('pairNumber').lean();

    const busyPairs = busySessions.map(s => s.pairNumber);
    const allPairs = [1, 2, 3, 4, 5, 6, 7, 8];
    const availablePairs = allPairs.filter(p => !busyPairs.includes(p));

    return availablePairs;
  }

  /**
   * Форматировать контекст для AI
   */
  formatScheduleForAI(sessions) {
    if (!sessions || sessions.length === 0) {
      return 'Нет занятий в указанном диапазоне.';
    }

    return sessions.map(s => {
      const date = new Date(s.startAt).toLocaleDateString('ru-RU');
      return `Дата: ${date}, Пара: ${s.pairNumber}, Курс: ${s.course?.name || 'Н/Д'}, Преподаватель: ${s.teacher?.name || 'Н/Д'}, Аудитория: ${s.room?.number || 'Н/Д'} (${s.room?.building || ''}), Группы: ${s.groups.join(', ')}, Статус: ${s.status}`;
    }).join('\n');
  }

  /**
   * Отправить запрос к LM Studio
   */
  async chat(userMessage, context = null) {
    const systemPrompt = `Ты - AI-ассистент по управлению расписанием занятий в университете.

Твоя роль:
- Анализировать расписание и предлагать оптимальные решения
- Учитывать загруженность аудиторий, преподавателей и групп
- Если информации недостаточно - переспрашивать (какая группа, какой день, какая пара и т.д.)
- ВАЖНО: ты только предлагаешь решения, НЕ вносишь изменения в расписание

Расписание звонков:
1 пара: 08:30-09:50
2 пара: 10:00-11:20
3 пара: 11:30-12:50
4 пара: 13:20-14:40
5 пара: 14:50-16:10
6 пара: 16:20-17:40
7 пара: 18:00-19:20
8 пара: 19:30-20:50

Отвечай кратко и по делу на русском языке.`;

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    if (context) {
      messages.push({
        role: 'system',
        content: `Контекст расписания:\n${context}`
      });
    }

    messages.push({ role: 'user', content: userMessage });

    try {
      const response = await axios.post(LM_STUDIO_URL, {
        model: MODEL_NAME,
        messages,
        temperature: 0.7,
        max_tokens: -1,
        stream: false
      }, {
        timeout: 60000 // 60 секунд
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('LM Studio API error:', error.message);
      if (error.code === 'ECONNREFUSED') {
        throw new Error('LM Studio не запущен. Пожалуйста, запустите LM Studio и загрузите модель.');
      }
      throw new Error(`Ошибка AI: ${error.message}`);
    }
  }

  /**
   * Обработать запрос админа с автоматическим сбором контекста
   */
  async processAdminQuery(query) {
    // Получить общий контекст расписания (последние 7 дней)
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 3);
    const weekAhead = new Date();
    weekAhead.setDate(today.getDate() + 7);

    const recentSessions = await Session.find({
      startAt: { $gte: weekAgo, $lte: weekAhead },
      status: { $nin: ['cancelled'] }
    })
      .populate('course', 'name code')
      .populate('teacher', 'name')
      .populate('room', 'number building capacity')
      .sort({ startAt: 1 })
      .limit(200)
      .lean();

    const scheduleContext = this.formatScheduleForAI(recentSessions);

    // Получить статистику
    const totalRooms = await Room.countDocuments({ isActive: true });
    const totalTeachers = await User.countDocuments({ role: 'teacher', isActive: true });
    const totalCourses = await Course.countDocuments({ isActive: true });

    const statsContext = `\n\nСтатистика:\nВсего аудиторий: ${totalRooms}\nВсего преподавателей: ${totalTeachers}\nВсего курсов: ${totalCourses}`;

    const fullContext = scheduleContext + statsContext;

    return await this.chat(query, fullContext);
  }
}

module.exports = new AIService();
