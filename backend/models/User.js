const mongoose = require('mongoose');

const preferencesSchema = new mongoose.Schema({
  interviewType: {
    type: String,
    enum: ['DSA', 'HR', 'CS Fundamentals', 'System Design', 'Resume Discussion'],
    default: 'DSA'
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  targetCompany: String,
  preferredLanguage: {
    type: String,
    enum: ['Java', 'C++', 'Python'],
    default: 'Python'
  },
  identityPreference: {
    type: String,
    enum: ['Anonymous', 'Named'],
    default: 'Named'
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  preferences: {
    type: preferencesSchema,
    default: () => ({})
  }
});

module.exports = mongoose.model('User', userSchema);