const mongoose = require('mongoose');

const sessionHistorySchema = new mongoose.Schema({
  changedAt: {
    type: Date,
    default: Date.now
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  changeType: {
    type: String,
    enum: ['created', 'updated', 'moved', 'cancelled', 'restored', 'confirmed', 'session_cancelled', 'status_changed', 'room_changed', 'teacher_changed', 'time_changed', 'session_moved']
  },
  changes: {
    type: mongoose.Schema.Types.Mixed
  },
  comment: {
    type: String
  }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  pairNumber: {
    type: Number,
    min: 1,
    max: 8,
    index: true
  },
  startAt: {
    type: Date,
    required: true,
    index: true
  },
  endAt: {
    type: Date,
    required: true,
    index: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groups: [{
    type: String,
    required: true,
    index: true
  }],
  subgroup: {
    type: String,
    enum: ['all', 'subgroup-1', 'subgroup-2'],
    default: 'all',
    index: true
  },
  cycleType: {
    type: String,
    enum: ['regular', 'cyclic'],
    default: 'regular',
    index: true
  },
  cycleStartDate: {
    type: Date,
    index: true
  },
  cycleEndDate: {
    type: Date,
    index: true
  },
  cycleName: {
    type: String,
    index: true
  },
  type: {
    type: String,
    enum: ['lecture', 'practice', 'lab', 'seminar', 'exam', 'consultation'],
    default: 'lecture'
  },
  status: {
    type: String,
    enum: ['planned', 'confirmed', 'moved', 'cancelled', 'online'],
    default: 'planned',
    index: true
  },
  notes: {
    type: String
  },
  cancellationReason: {
    type: String
  },
  onlineLink: {
    type: String
  },
  history: [sessionHistorySchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound indexes for conflict detection
sessionSchema.index({ room: 1, startAt: 1, endAt: 1 });
sessionSchema.index({ teacher: 1, startAt: 1, endAt: 1 });
sessionSchema.index({ groups: 1, startAt: 1, endAt: 1 });
sessionSchema.index({ status: 1, startAt: 1 });

// Virtual for duration
sessionSchema.virtual('duration').get(function() {
  return Math.round((this.endAt - this.startAt) / (1000 * 60)); // minutes
});

// Method to check if session can be edited
sessionSchema.methods.canEdit = function() {
  const now = new Date();
  const hoursUntilStart = (this.startAt - now) / (1000 * 60 * 60);
  return hoursUntilStart > 5;
};

// Method to add history entry
sessionSchema.methods.addHistory = function(changeType, changedBy, changes, comment) {
  this.history.push({
    changedAt: new Date(),
    changedBy,
    changeType,
    changes,
    comment
  });
};

sessionSchema.set('toJSON', { virtuals: true });
sessionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Session', sessionSchema);
