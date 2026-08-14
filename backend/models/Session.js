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
  
  // Match type tracking
  matchType: { type: String, enum: ['interviewer', 'peer'], default: 'interviewer' }, // interviewer = candidate+interviewer, peer = candidate+candidate
  
  // Interview details
  interviewType: String, // e.g., 'DSA', 'HR', etc.
  difficulty: String, // e.g., 'Beginner', 'Intermediate', 'Advanced'
  
  // For scheduled interviews
  isScheduled: { type: Boolean, default: false },
  scheduledStartTime: Date,
  scheduledEndTime: Date,
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', sessionSchema);