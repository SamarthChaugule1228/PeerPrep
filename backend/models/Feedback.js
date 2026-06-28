const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  communication: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  technical: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  overall: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  note: {
    type: String,
    maxlength: 300,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure one feedback per user per session
feedbackSchema.index({ session: 1, fromUser: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);