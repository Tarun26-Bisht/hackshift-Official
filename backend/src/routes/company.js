const express = require('express');
const router = express.Router();
const CompanyProfile = require('../models/CompanyProfile');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../config/upload');
const { calculateProfileCompleteness, getProfileMissingFields } = require('../services/completeness');
const { verifyCompanyDocument } = require('../services/rekognition');

const guard = [authenticate, requireRole('recruiter')];

// ─── Get my profile ───────────────────────────────────────────────────────────
router.get('/me', guard, async (req, res) => {
  try {
    let profile = await CompanyProfile.findOne({ recruiterId: req.user._id });
    if (!profile) {
      profile = await CompanyProfile.create({ recruiterId: req.user._id });
    }
    res.json({ profile, missingFields: getProfileMissingFields(profile) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Save step (partial update) ──────────────────────────────────────────────
router.patch('/step', guard, async (req, res) => {
  try {
    let profile = await CompanyProfile.findOne({ recruiterId: req.user._id });
    if (!profile) profile = new CompanyProfile({ recruiterId: req.user._id });

    // Merge nested address fields
    if (req.body.address) {
      profile.address = { ...profile.address?.toObject?.() ?? {}, ...req.body.address };
      delete req.body.address;
    }

    Object.assign(profile, req.body);
    profile.completenessScore = calculateProfileCompleteness(profile);

    // Mark onboarding complete if step 1 done (legalName + companyType + description)
    if (profile.legalName && profile.companyType && profile.description) {
      profile.onboardingCompleted = true;
    }

    await profile.save();
    res.json({ profile, completenessScore: profile.completenessScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Upload logo ──────────────────────────────────────────────────────────────
router.post('/upload/logo', guard, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/logos/${req.file.filename}`;
    const profile = await CompanyProfile.findOneAndUpdate(
      { recruiterId: req.user._id },
      { logoUrl: url },
      { new: true, upsert: true }
    );
    profile.completenessScore = calculateProfileCompleteness(profile);
    await profile.save();
    res.json({ url, completenessScore: profile.completenessScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Upload incorporation certificate ────────────────────────────────────────
router.post('/upload/document', guard, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/documents/${req.file.filename}`;

    // Run Rekognition on the document (silent fallback)
    const rekognitionResult = await verifyCompanyDocument(url);

    const profile = await CompanyProfile.findOneAndUpdate(
      { recruiterId: req.user._id },
      {
        incorporationCertUrl: url,
        ...(rekognitionResult.rekognitionUsed && {
          docVerification: {
            isDocument: rekognitionResult.isDocument,
            hasInappropriateContent: rekognitionResult.hasInappropriateContent,
            detectedText: rekognitionResult.detectedText?.slice(0, 5),
            verifiedAt: new Date(),
          }
        })
      },
      { new: true, upsert: true }
    );
    profile.completenessScore = calculateProfileCompleteness(profile);
    await profile.save();
    res.json({ url, completenessScore: profile.completenessScore, rekognitionResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
