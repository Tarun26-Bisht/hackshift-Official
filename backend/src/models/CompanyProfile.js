const mongoose = require('mongoose');

const companyProfileSchema = new mongoose.Schema({
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  // Step 1 — Identity
  legalName: { type: String },
  brandName: { type: String },
  companyType: { type: String, enum: ['startup', 'mnc', 'agency', 'ngo', 'other'] },
  industry: { type: String },
  foundedYear: { type: String },
  companySize: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+'] },
  description: { type: String },

  // Step 2 — Online Presence
  website: { type: String },
  linkedIn: { type: String },
  twitter: { type: String },
  github: { type: String },

  // Step 3 — Legal & Address
  country: { type: String },
  registrationNumber: { type: String },
  gstOrTaxId: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
  },

  // Step 4 — HR Contact & Docs
  hrName: { type: String },
  hrDesignation: { type: String },
  hrPhone: { type: String },
  hrEmail: { type: String },
  logoUrl: { type: String },
  incorporationCertUrl: { type: String },
  docVerification: {
    isDocument: Boolean,
    hasInappropriateContent: Boolean,
    detectedText: [String],
    verifiedAt: Date,
  },

  completenessScore: { type: Number, default: 0 },
  onboardingCompleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('CompanyProfile', companyProfileSchema);
