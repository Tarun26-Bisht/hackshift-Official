const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  // Step 1 — Personal Details
  fullName: { type: String },
  collegeName: { type: String },
  course: { type: String },
  yearOfStudy: { type: String },
  rollNumber: { type: String },
  city: { type: String },
  state: { type: String },
  phone: { type: String },
  linkedIn: { type: String },
  github: { type: String },
  bio: { type: String },

  // Step 2 — ID Card
  idCardUrl: { type: String },
  idCardType: { type: String, enum: ['college_id', 'aadhar', 'passport', 'other'] },

  // Step 3 — Face Verification
  facePhotoUrl: { type: String },
  livenessVerified: { type: Boolean, default: false },
  livenessChallenge: { type: String },
  rekognitionFaceCheck: {
    faceDetected: Boolean,
    hasInappropriateContent: Boolean,
    verifiedAt: Date,
  },

  completenessScore: { type: Number, default: 0 },
  onboardingCompleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
