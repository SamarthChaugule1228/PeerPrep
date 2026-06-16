const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  participants: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      socketId: String
    }
  ],
  status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Session', sessionSchema);