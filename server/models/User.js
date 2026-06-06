const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  token: { type: String, required: true },
  userAgent: { type: String, default: 'Unknown Device' },
  ipAddress: { type: String, default: '127.0.0.1' },
  lastActive: { type: Date, default: Date.now }
}, { _id: true });

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 20,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  passwordHash: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: 30
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['online', 'idle', 'dnd', 'offline'],
    default: 'offline'
  },
  statusText: {
    type: String,
    trim: true,
    maxlength: 100,
    default: ''
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },

  // --- UI PREFERENCES ---
  theme: {
    type: String,
    enum: ['midnight', 'cyber-neon', 'royal-purple', 'emerald-dark', 'crimson-elite', 'light-professional'],
    default: 'midnight'
  },
  fontFamily: {
    type: String,
    default: 'Inter'
  },
  fontSizeUI: {
    type: Number,
    default: 14 // 14px
  },
  fontSizeChat: {
    type: Number,
    default: 14
  },
  lineHeight: {
    type: Number,
    default: 1.5
  },
  accentColor: {
    type: String,
    default: '#6366F1'
  },

  // --- SECURITY ACCOUNT LOCKING ---
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  lockHistoryCount: {
    type: Number,
    default: 0
  },

  // --- ACTIVE SESSIONS ---
  sessions: [SessionSchema]

}, {
  timestamps: true
});

// Remove passwordHash and session tokens from JSON output
UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    if (ret.sessions) {
      ret.sessions = ret.sessions.map(s => {
        delete s.token;
        return s;
      });
    }
    return ret;
  }
});

module.exports = mongoose.model('User', UserSchema);
