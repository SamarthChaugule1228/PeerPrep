const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  participants: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      socketId: String,
      role: { type: String, enum: ['interviewer', 'candidate'], required: true }
    }
  ],
  question: { type: String, default: '' },
  code: { type: String, default: '' },
  language: { type: String, default: 'python' },
  notes: { type: String, default: '' },
  timerDuration: { type: Number, default: 2700 }, // 45 minutes in seconds
  timerEnd: { type: Date, default: null },
  status: { type: String, enum: ['active', 'ended'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', sessionSchema);