const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  interviewType: {
    type: String,
    enum: ['DSA', 'HR', 'CS Fundamentals', 'System Design', 'Resume Discussion'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  outcome: {
    type: String,
    enum: ['Selected', 'Rejected', 'No Decision', ''],
    default: ''
  },
  mode: {
    type: String,
    enum: ['On Campus', 'Off Campus', 'Referral', ''],
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: true,
    maxlength: 20000
  },
  upvotes: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],
  reads: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Experience', experienceSchema);