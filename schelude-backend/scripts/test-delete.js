#!/usr/bin/env node
const mongoose = require('mongoose');
require('dotenv').config();
const Session = require('../src/models/Session');
const Course = require('../src/models/Course');
const Room = require('../src/models/Room');
const User = require('../src/models/User');
const conflictService = require('../src/services/conflictService');

async function testDelete() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get last session
    const sessions = await Session.find()
      .sort({ createdAt: -1 })
      .limit(1);

    if (sessions.length === 0) {
      console.log('❌ No sessions found to test');
      await mongoose.connection.close();
      return;
    }

    const session = sessions[0];
    console.log('Testing deletion of session:', session._id);

    // Populate it
    await session.populate('course teacher room');
    console.log('✅ Populated session');

    // Test canEditSession
    const editCheck = conflictService.canEditSession(session, 'admin');
    console.log('Edit check result:', editCheck);

    if (!editCheck.canEdit) {
      console.log('⚠️ Cannot edit this session:', editCheck.reason);
    } else {
      console.log('✅ Session can be edited/deleted');
    }

    await mongoose.connection.close();
    console.log('\n✅ Test complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testDelete();
