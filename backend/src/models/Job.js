const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  // Posted by
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recruiterName: { type: String },
  companyName: { type: String },

  // Job details
  title: { type: String, required: true },
  description: { type: String, required: true },
  salary: { type: String },
  duration: { type: String },
  jobType: { type: String },
  location: { type: String },
  contactEmail: { type: String },
  link: { type: String },
  skills: { type: [String], default: [] },
  deadline: { type: Date },
  isExpired: { type: Boolean, default: false },

  // Audit results
  trustScore: { type: Number, default: 0 },
  status: { type: String, enum: ['approved', 'blocked', 'pending'], default: 'pending' },
  jobCompleteness: { type: Number, default: 0 },

  // AI results
  aiResult: {
    skills: [String],
    missingFields: [String],
    scamMarkers: [String],
    isLikelyScam: Boolean,
    professionalismScore: Number,
  },

  // Link validation
  linkResult: {
    isValid: Boolean,
    reason: String,
  },

  // Blocklist
  blocklistMatches: { type: [String], default: [] },

  // AWS Comprehend
  comprehendResult: {
    sentiment: String,
    signals: [String],
    penalty: Number,
    comprehendUsed: Boolean,
  },

  // Block reason (for recruiter feedback)
  blockReason: { type: String },

  // Re-audit tracking
  auditCount: { type: Number, default: 1 },
  lastAuditAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
