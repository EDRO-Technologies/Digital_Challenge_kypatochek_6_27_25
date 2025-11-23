const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    sparse: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    select: false
  },
  role: {
    type: String,
    enum: ['guest', 'student', 'teacher', 'admin', 'superadmin'],
    default: 'guest'
  },
  telegramId: {
    type: String,
    sparse: true,
    unique: true
  },
  telegramChatId: {
    type: String
  },
  groupNumber: {
    type: String
  },
  contacts: {
    phone: String,
    telegram: String,
    email: String
  },
  notificationSettings: {
    telegram: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    sessionChanges: {
      type: Boolean,
      default: true
    },
    sessionCancellations: {
      type: Boolean,
      default: true
    },
    sessionMoves: {
      type: Boolean,
      default: true
    },
    newSessions: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes (telegramId has unique index, groupNumber and role need explicit indexes)
userSchema.index({ groupNumber: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
