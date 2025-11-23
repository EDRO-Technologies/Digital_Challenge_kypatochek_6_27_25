const Notification = require('../models/Notification');
const User = require('../models/User');

// Format schedule change message
const formatScheduleChangeMessage = (type, session, changes = {}) => {
  const courseInfo = session.course?.name || session.course?.code || 'Неизвестный курс';
  const teacherInfo = session.teacher?.name || 'Неизвестный преподаватель';
  const roomInfo = session.room ? `${session.room.building}-${session.room.number}` : 'Неизвестная аудитория';
  
  // Format date for Russian locale
  const timeInfo = new Date(session.startAt).toLocaleString('ru-RU', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short'
  });

  let message = '';
  let icon = '';

  switch (type) {
    case 'session_created':
      icon = '📅';
      message = `${icon} <b>Добавлено новое занятие</b>\n\n`;
      message += `<b>Предмет:</b> ${courseInfo}\n`;
      message += `<b>Преподаватель:</b> ${teacherInfo}\n`;
      message += `<b>Время:</b> ${timeInfo}\n`;
      message += `<b>Аудитория:</b> ${roomInfo}\n`;
      if (session.groups && session.groups.length > 0) {
        message += `<b>Группы:</b> ${session.groups.join(', ')}\n`;
      }
      break;

    case 'session_cancelled':
      icon = '❌';
      message = `${icon} <b>Занятие отменено</b>\n\n`;
      message += `<b>Предмет:</b> ${courseInfo}\n`;
      message += `<b>Время:</b> ${timeInfo}\n`;
      if (session.cancellationReason) {
        message += `<b>Причина:</b> ${session.cancellationReason}\n`;
      }
      break;

    case 'room_changed':
      icon = '🚪';
      message = `${icon} <b>Изменена аудитория</b>\n\n`;
      message += `<b>Предмет:</b> ${courseInfo}\n`;
      message += `<b>Время:</b> ${timeInfo}\n`;
      if (changes.oldRoom && changes.newRoom) {
        message += `<b>Было:</b> ${changes.oldRoom}\n`;
        message += `<b>Стало:</b> ${changes.newRoom}\n`;
      } else {
        message += `<b>Новая аудитория:</b> ${roomInfo}\n`;
      }
      break;

    case 'teacher_changed':
      icon = '👨‍🏫';
      message = `${icon} <b>Замена преподавателя</b>\n\n`;
      message += `<b>Предмет:</b> ${courseInfo}\n`;
      message += `<b>Время:</b> ${timeInfo}\n`;
      if (changes.oldTeacher && changes.newTeacher) {
        message += `<b>Был:</b> ${changes.oldTeacher}\n`;
        message += `<b>Назначен:</b> ${changes.newTeacher}\n`;
      } else {
        message += `<b>Новый преподаватель:</b> ${teacherInfo}\n`;
      }
      break;

    case 'time_changed':
    case 'session_moved':
      icon = '🕐';
      message = `${icon} <b>Время занятия изменено</b>\n\n`;
      message += `<b>Предмет:</b> ${courseInfo}\n`;
      
      // Check for both oldStartAt/newStartAt (from sessions.js) and oldTime/newTime
      const oldTimeValue = changes.oldStartAt || changes.oldTime;
      const newTimeValue = changes.newStartAt || changes.newTime;
      
      if (oldTimeValue && newTimeValue) {
          // Format old and new times
          const oldTimeFormatted = new Date(oldTimeValue).toLocaleString('ru-RU', {
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            weekday: 'short'
          });
          const newTimeFormatted = new Date(newTimeValue).toLocaleString('ru-RU', {
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            weekday: 'short'
          });
          message += `<b>Было:</b> ${oldTimeFormatted}\n`;
          message += `<b>Стало:</b> ${newTimeFormatted}\n`;
      } else {
         message += `<b>Новое время:</b> ${timeInfo}\n`;
      }
      
      message += `<b>Аудитория:</b> ${roomInfo}\n`;
      break;

    case 'status_changed':
      icon = 'ℹ️';
      message = `${icon} <b>Изменен статус занятия</b>\n\n`;
      message += `<b>Предмет:</b> ${courseInfo}\n`;
      message += `<b>Время:</b> ${timeInfo}\n`;
      if (changes.oldStatus && changes.newStatus) {
        const statusMap = {
          'planned': 'Запланировано',
          'confirmed': 'Подтверждено',
          'moved': 'Перенесено',
          'cancelled': 'Отменено',
          'online': 'Онлайн'
        };
        message += `<b>Старый статус:</b> ${statusMap[changes.oldStatus] || changes.oldStatus}\n`;
        message += `<b>Новый статус:</b> ${statusMap[changes.newStatus] || changes.newStatus}\n`;
      }
      break;

    default:
      icon = '📢';
      message = `${icon} <b>Изменение в расписании</b>\n\n`;
      message += `<b>Предмет:</b> ${courseInfo}\n`;
      message += `<b>Время:</b> ${timeInfo}\n`;
      message += `<b>Аудитория:</b> ${roomInfo}\n`;
  }

  return message;
};

// Send notification to affected users for schedule changes
const notifyScheduleChange = async (type, session, changes = {}) => {
  try {
    // Populate session details if needed
    if (!session.course || !session.teacher || !session.room) {
      await session.populate(['course', 'teacher', 'room']);
    }

    // Find affected users based on groups
    const affectedUsers = await User.find({
      groupNumber: { $in: session.groups },
      telegramChatId: { $exists: true, $ne: null },
      isActive: true
    }).select('telegramChatId telegramId name notificationSettings');

    // Filter users based on notification preferences
    const usersToNotify = affectedUsers.filter(user => {
      const settings = user.notificationSettings || {};
      
      // Check if telegram notifications are enabled
      if (!settings.telegram) return false;
      
      // Check type-specific preferences
      switch (type) {
        case 'session_cancelled':
          return settings.sessionCancellations !== false;
        case 'session_moved':
        case 'time_changed':
        case 'room_changed':
        case 'teacher_changed':
        case 'status_changed':
          return settings.sessionChanges !== false;
        case 'session_created':
          return settings.newSessions !== false;
        default:
          return true;
      }
    });

    if (usersToNotify.length === 0) {
      console.log('No users with Telegram configured and notification preferences enabled');
      return;
    }

    const message = formatScheduleChangeMessage(type, session, changes);

    // Create notification records for the external Telegram bot to process
    const notifications = await Promise.all(
      usersToNotify.map(user => 
        Notification.create({
          type,
          session: session._id,
          recipients: {
            users: [user._id],
            groups: session.groups,
            telegramIds: user.telegramId ? [user.telegramId] : []
          },
          channel: 'telegram',
          status: 'pending',
          payload: {
            message,
            title: 'Изменение расписания',
            data: { 
              sessionId: session._id,
              chatId: user.telegramChatId
            }
          }
        })
      )
    );

    console.log(`Created ${notifications.length} notification records for ${type}`);
    console.log('External Telegram bot will process these notifications');
  } catch (error) {
    console.error('Error creating notifications for schedule change:', error);
    throw error;
  }
};

// Create custom notification record (to be sent by external Telegram bot)
const createNotification = async (chatId, message, telegramId = null) => {
  try {
    const notification = await Notification.create({
      type: 'session_updated',
      recipients: {
        telegramIds: telegramId ? [telegramId] : []
      },
      channel: 'telegram',
      status: 'pending',
      payload: {
        message,
        title: 'Уведомление',
        data: { chatId }
      }
    });

    console.log('Created notification record - external bot will process');
    return { success: true, notificationId: notification._id };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  notifyScheduleChange
};
