const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  guestName: {
    type: String
  },
  guestGroup: {
    type: String
  },
  registrationType: {
    type: String,
    enum: ['user', 'guest', 'auto'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['registered', 'attended', 'absent', 'cancelled'],
    default: 'registered'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate registrations
registrationSchema.index({ session: 1, user: 1 }, { unique: true, sparse: true });
registrationSchema.index({ session: 1, guestName: 1, guestGroup: 1 });
registrationSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
