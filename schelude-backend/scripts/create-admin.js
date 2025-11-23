const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../src/models/User');

const createAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/schedule');
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user with email "admin" already exists!');
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Role: ${existingAdmin.role}`);
      
      // Update password if needed
      const updatePassword = process.argv.includes('--force');
      if (updatePassword) {
        existingAdmin.password = 'P@ssw0rd';
        await existingAdmin.save();
        console.log('✅ Password updated to: P@ssw0rd');
      } else {
        console.log('\n💡 Use --force flag to update password');
      }
      
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create new admin user
    const adminUser = new User({
      name: 'Administrator',
      email: 'admin',
      password: 'P@ssw0rd',
      role: 'admin',
      isActive: true,
      notificationSettings: {
        telegram: true,
        email: false,
        sessionChanges: true,
        sessionCancellations: true,
        sessionMoves: true,
        newSessions: true
      }
    });

    await adminUser.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Email:    admin');
    console.log('   Password: P@ssw0rd');
    console.log('   Role:     admin');
    console.log('\n🔐 Please change the password after first login!');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

createAdmin();
