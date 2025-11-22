const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['session_created', 'session_updated', 'session_moved', 'session_cancelled', 'session_restored', 'room_changed', 'teacher_changed', 'time_changed', 'status_changed'],
    required: true,
    index: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    index: true
  },
  recipients: {
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    groups: [String],
    telegramIds: [String]
  },
  channel: {
    type: String,
    enum: ['telegram', 'email', 'push', 'sms'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'delivered'],
    default: 'pending',
    index: true
  },
  payload: {
    message: String,
    title: String,
    data: mongoose.Schema.Types.Mixed
  },
  sentAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  error: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ type: 1, status: 1, createdAt: -1 });
notificationSchema.index({ session: 1, createdAt: -1 });
notificationSchema.index({ 'recipients.users': 1 });

module.exports = mongoose.model('Notification', notificationSchema);
