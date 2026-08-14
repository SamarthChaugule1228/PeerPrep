const mongoose = require('mongoose');

const matchingRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['instant', 'scheduled'], required: true },
  
  // Interview preferences
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
  targetCompany: String,
  preferredLanguage: {
    type: String,
    enum: ['Java', 'C++', 'Python'],
    required: true
  },
  identityPreference: {
    type: String,
    enum: ['Anonymous', 'Named'],
    default: 'Named'
  },
  rolePreference: {
    type: String,
    enum: ['candidate', 'interviewer'],
    default: 'candidate'
  },
  
  // For scheduled interviews
  scheduledDate: Date, // The interview date
  scheduledStartTime: Date, // When the interview should start
  scheduledEndTime: Date, // When the interview should end
  fallbackEligibleAt: Date, // When 120-minute fallback becomes eligible (startTime - 120 min)
  
  // Matching status
  status: {
    type: String,
    enum: ['waiting', 'matched', 'expired', 'cancelled'],
    default: 'waiting'
  },
  
  // Match information
  matchedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  matchType: { type: String, enum: ['interviewer', 'peer'], default: 'interviewer' },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  
  // Fallback tracking
  fallbackAppliedAt: Date, // When fallback was applied
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  expiredAt: Date,
});

// Index for efficient querying
matchingRequestSchema.index({ status: 1, type: 1 });
matchingRequestSchema.index({ userId: 1, status: 1 });
matchingRequestSchema.index({ scheduledStartTime: 1, fallbackEligibleAt: 1 });

module.exports = mongoose.model('MatchingRequest', matchingRequestSchema);
