const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String }, // null for Google OAuth users
  role: { type: String, enum: ['student', 'recruiter', 'admin'], required: true },
  avatar: { type: String },

  // Google OAuth
  googleId: { type: String },

  // Recruiter-specific
  companyName: { type: String },
  companyWebsite: { type: String },
  companyType: { type: String, enum: ['startup', 'mnc', 'agency', 'other'] },

  // Student-specific
  collegeName: { type: String },
  course: { type: String },
  yearOfStudy: { type: String },

  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
