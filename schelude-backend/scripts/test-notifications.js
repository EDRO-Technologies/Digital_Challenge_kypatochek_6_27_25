#!/usr/bin/env node
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../src/models/User');
const Session = require('../src/models/Session');
const Course = require('../src/models/Course');
const Room = require('../src/models/Room');
const notificationService = require('../src/services/notificationService');

async function testNotifications() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check users with telegram
    const usersWithTelegram = await User.find({
      telegramId: { $exists: true, $ne: null }
    });
    console.log(`📊 Users with telegramId: ${usersWithTelegram.length}`);
    
    const usersWithChatId = await User.find({
      telegramChatId: { $exists: true, $ne: null }
    });
    console.log(`📊 Users with telegramChatId: ${usersWithChatId.length}\n`);

    if (usersWithTelegram.length === 0) {
      console.log('❌ No users registered with Telegram bot');
      console.log('   Please register in Telegram bot using /start\n');
    } else {
      console.log('👥 Telegram users:');
      usersWithTelegram.forEach(user => {
        console.log(`   - ${user.name} (Group: ${user.groupNumber || 'N/A'})`);
        console.log(`     telegramId: ${user.telegramId}`);
        console.log(`     telegramChatId: ${user.telegramChatId || 'NOT SET'}`);
        console.log(`     Notifications enabled: ${user.notificationSettings?.telegram}`);
        console.log(`     New sessions: ${user.notificationSettings?.newSessions}`);
        console.log('');
      });
    }

    // Check recent sessions
    const recentSessions = await Session.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('course teacher room');
    
    console.log(`📅 Recent sessions: ${recentSessions.length}\n`);
    
    if (recentSessions.length > 0) {
      console.log('Last session details:');
      const session = recentSessions[0];
      console.log(`   Course: ${session.course?.name}`);
      console.log(`   Groups: ${session.groups?.join(', ')}`);
      console.log(`   Created: ${session.createdAt}`);
      console.log('');
    }

    // Check webhook URL
    console.log('🔗 Configuration:');
    console.log(`   TELEGRAM_WEBHOOK_URL: ${process.env.TELEGRAM_WEBHOOK_URL}`);
    console.log(`   TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Not set'}`);
    console.log('');

    // Test notification for a session if exists
    if (recentSessions.length > 0 && usersWithTelegram.length > 0) {
      console.log('🧪 Testing notification sending...');
      const testSession = recentSessions[0];
      
      try {
        await notificationService.notifySessionChange(
          testSession,
          'session_created',
          {},
          'Test notification from diagnostic script'
        );
        console.log('✅ Notification sent successfully!');
      } catch (error) {
        console.error('❌ Notification failed:', error.message);
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testNotifications();
