// ONE-TIME MIGRATION SCRIPT: Enable newSessions notifications for all users
// This script can be removed after running once on production/staging
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');

const DRY_RUN = process.argv.includes('--dry-run');

async function enableNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/schedule');
    
    console.log('Connected to MongoDB');
    console.log(DRY_RUN ? '🔍 DRY RUN MODE - No changes will be made\n' : '⚠️  LIVE MODE - Changes will be applied\n');
    
    // Count affected users
    const totalUsers = await User.countDocuments({});
    const usersWithTelegram = await User.countDocuments({ telegramId: { $exists: true, $ne: null } });
    const usersWithChatId = await User.countDocuments({ telegramChatId: { $exists: true, $ne: null } });
    
    console.log(`Total users: ${totalUsers}`);
    console.log(`Users with telegramId: ${usersWithTelegram}`);
    console.log(`Users with telegramChatId: ${usersWithChatId}\n`);
    
    if (!DRY_RUN) {
      // Update all users to enable newSessions notifications
      const result = await User.updateMany(
        {},
        {
          $set: {
            'notificationSettings.newSessions': true,
            'notificationSettings.sessionChanges': true,
            'notificationSettings.sessionCancellations': true,
            'notificationSettings.telegram': true
          }
        }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} users`);
      console.log('All users now have notifications enabled for new sessions');
    } else {
      console.log('✅ Dry run complete - no changes made');
      console.log('Run without --dry-run to apply changes');
    }
    
    // Show some user examples
    const users = await User.find({}).select('name role telegramId notificationSettings').limit(5);
    console.log('\nSample users:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.role}): telegramId=${user.telegramId}, newSessions=${user.notificationSettings.newSessions}`);
    });
    
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    try {
      await mongoose.connection.close();
    } catch (closeError) {
      console.error('Error closing connection:', closeError);
    }
    process.exit(1);
  }
}

enableNotifications();
