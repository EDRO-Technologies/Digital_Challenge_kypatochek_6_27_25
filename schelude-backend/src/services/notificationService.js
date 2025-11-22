const Notification = require('../models/Notification');
const User = require('../models/User');
const axios = require('axios');

class NotificationService {
  /**
   * Send notifications for session changes
   */
  async notifySessionChange(session, changeType, changes, comment = '') {
    try {
      // Get all affected users
      const affectedUsers = await this.getAffectedUsers(session);

      if (affectedUsers.length === 0) {
        console.log('No users to notify');
        return;
      }

      // Filter users who want this type of notification
      const usersToNotify = affectedUsers.filter(user => {
        const settings = user.notificationSettings;
        
        switch (changeType) {
          case 'session_cancelled':
            return settings.sessionCancellations && settings.telegram;
          case 'session_moved':
          case 'time_changed':
          case 'room_changed':
          case 'teacher_changed':
            return settings.sessionChanges && settings.telegram;
          case 'session_created':
            return settings.newSessions && settings.telegram;
          default:
            return settings.telegram;
        }
      });

      if (usersToNotify.length === 0) {
        console.log('No users opted in for this notification type');
        return;
      }

      // Generate message
      const message = this.generateNotificationMessage(session, changeType, changes, comment);

      // Get telegram IDs
      const telegramIds = usersToNotify
        .filter(user => user.telegramId)
        .map(user => user.telegramId);

      if (telegramIds.length === 0) {
        console.log('No telegram IDs found');
        return;
      }

      // Create notification record
      const notification = await Notification.create({
        type: changeType,
        session: session._id,
        recipients: {
          users: usersToNotify.map(u => u._id),
          groups: session.groups,
          telegramIds
        },
        channel: 'telegram',
        payload: {
          message,
          data: { sessionId: session._id, changeType, changes }
        },
        status: 'pending'
      });

      // Send to Telegram bot webhook
      await this.sendTelegramWebhook(telegramIds, message, notification._id);

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Get all users affected by a session
   */
  async getAffectedUsers(session) {
    // Find all users in the affected groups
    const users = await User.find({
      groupNumber: { $in: session.groups },
      isActive: true,
      role: { $in: ['student', 'guest'] }
    });

    return users;
  }

  /**
   * Generate notification message
   */
  generateNotificationMessage(session, changeType, changes, comment) {
    const courseName = session.course?.name || 'Unknown Course';
    const courseCode = session.course?.code || '';
    const groups = session.groups.join(', ');
    
    const formatDate = (date) => {
      return new Date(date).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    let message = '';

    switch (changeType) {
      case 'session_cancelled':
        message = `❌ ОТМЕНЕНО\n\n`;
        message += `📚 ${courseName} (${courseCode})\n`;
        message += `👥 Группы: ${groups}\n`;
        message += `📅 ${formatDate(session.startAt)}\n`;
        if (comment) {
          message += `\n💬 Причина: ${comment}`;
        }
        break;

      case 'session_moved':
      case 'time_changed':
        message = `⚠️ ПЕРЕНОС ПАРЫ\n\n`;
        message += `📚 ${courseName} (${courseCode})\n`;
        message += `👥 Группы: ${groups}\n\n`;
        if (changes.oldStartAt && changes.newStartAt) {
          message += `Было: ${formatDate(changes.oldStartAt)}\n`;
          message += `Стало: ${formatDate(changes.newStartAt)}\n`;
        }
        if (changes.oldRoom && changes.newRoom) {
          message += `\n🏛 Аудитория изменена\n`;
          message += `Было: ${changes.oldRoom}\n`;
          message += `Стало: ${changes.newRoom}`;
        }
        if (comment) {
          message += `\n\n💬 ${comment}`;
        }
        break;

      case 'room_changed':
        message = `🏛 СМЕНА АУДИТОРИИ\n\n`;
        message += `📚 ${courseName} (${courseCode})\n`;
        message += `👥 Группы: ${groups}\n`;
        message += `📅 ${formatDate(session.startAt)}\n\n`;
        message += `Было: ${changes.oldRoom}\n`;
        message += `Стало: ${changes.newRoom}`;
        if (comment) {
          message += `\n💬 ${comment}`;
        }
        break;

      case 'teacher_changed':
        message = `👨‍🏫 СМЕНА ПРЕПОДАВАТЕЛЯ\n\n`;
        message += `📚 ${courseName} (${courseCode})\n`;
        message += `👥 Группы: ${groups}\n`;
        message += `📅 ${formatDate(session.startAt)}\n\n`;
        message += `Было: ${changes.oldTeacher}\n`;
        message += `Стало: ${changes.newTeacher}`;
        if (comment) {
          message += `\n💬 ${comment}`;
        }
        break;

      case 'session_created':
        message = `✅ НОВАЯ ПАРА\n\n`;
        message += `📚 ${courseName} (${courseCode})\n`;
        message += `👥 Группы: ${groups}\n`;
        message += `📅 ${formatDate(session.startAt)} - ${formatDate(session.endAt)}\n`;
        message += `🏛 Аудитория: ${session.room?.number || 'TBD'}`;
        if (comment) {
          message += `\n\n💬 ${comment}`;
        }
        break;

      default:
        message = `ℹ️ Изменение в расписании\n\n`;
        message += `📚 ${courseName} (${courseCode})\n`;
        message += `👥 Группы: ${groups}\n`;
        message += `📅 ${formatDate(session.startAt)}`;
    }

    return message;
  }

  /**
   * Send webhook to Telegram bot
   */
  async sendTelegramWebhook(telegramIds, message, notificationId) {
    try {
      const webhookUrl = `${process.env.TELEGRAM_WEBHOOK_URL || 'http://localhost:3000/api/webhooks/telegram'}/send-alert`;
      
      const response = await axios.post(webhookUrl, {
        telegramIds,
        message,
        notificationId
      }, {
        timeout: 10000
      });

      // Update notification status
      await Notification.findByIdAndUpdate(notificationId, {
        status: 'sent',
        sentAt: new Date()
      });

      return response.data;
    } catch (error) {
      console.error('Error sending telegram webhook:', error.message);
      
      // Update notification status
      await Notification.findByIdAndUpdate(notificationId, {
        status: 'failed',
        error: error.message
      });
      
      throw error;
    }
  }
}

module.exports = new NotificationService();
