const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  building: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  floor: {
    type: Number
  },
  equipment: [{
    type: String,
    enum: ['projector', 'computer', 'whiteboard', 'smartboard', 'video_conference', 'lab_equipment']
  }],
  type: {
    type: String,
    enum: ['lecture', 'lab', 'seminar', 'computer_lab', 'auditorium'],
    default: 'lecture'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
roomSchema.index({ number: 1, building: 1 });
roomSchema.index({ isActive: 1 });

module.exports = mongoose.model('Room', roomSchema);
