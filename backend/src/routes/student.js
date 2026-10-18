const express = require('express');
const router = express.Router();
const StudentProfile = require('../models/StudentProfile');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../config/upload');
const { calculateStudentCompleteness, getStudentMissingFields } = require('../services/completeness');
const { verifyFacePhoto } = require('../services/rekognition');

const guard = [authenticate, requireRole('student')];

// ─── Get my profile ───────────────────────────────────────────────────────────
router.get('/me', guard, async (req, res) => {
  try {
    let profile = await StudentProfile.findOne({ studentId: req.user._id });
    if (!profile) profile = await StudentProfile.create({ studentId: req.user._id });
    res.json({ profile, missingFields: getStudentMissingFields(profile) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Save step (partial update) ──────────────────────────────────────────────
router.patch('/step', guard, async (req, res) => {
  try {
    let profile = await StudentProfile.findOne({ studentId: req.user._id });
    if (!profile) profile = new StudentProfile({ studentId: req.user._id });

    Object.assign(profile, req.body);
    profile.completenessScore = calculateStudentCompleteness(profile);

    if (profile.fullName && profile.collegeName && profile.course) {
      profile.onboardingCompleted = true;
    }

    await profile.save();
    res.json({ profile, completenessScore: profile.completenessScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Upload ID card ───────────────────────────────────────────────────────────
router.post('/upload/id-card', guard, upload.single('idCard'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/student-ids/${req.file.filename}`;
    let profile = await StudentProfile.findOne({ studentId: req.user._id });
    if (!profile) profile = new StudentProfile({ studentId: req.user._id });
    profile.idCardUrl = url;
    if (req.body.idCardType) profile.idCardType = req.body.idCardType;
    profile.completenessScore = calculateStudentCompleteness(profile);
    await profile.save();
    res.json({ url, completenessScore: profile.completenessScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Upload face photo + mark liveness ───────────────────────────────────────
router.post('/upload/face', guard, upload.single('face'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/student-faces/${req.file.filename}`;

    // Run Rekognition on face photo (silent fallback)
    const rekognitionResult = await verifyFacePhoto(url);

    let profile = await StudentProfile.findOne({ studentId: req.user._id });
    if (!profile) profile = new StudentProfile({ studentId: req.user._id });
    profile.facePhotoUrl = url;
    profile.livenessVerified = req.body.livenessVerified === 'true';
    profile.livenessChallenge = req.body.challenge || '';
    if (rekognitionResult.rekognitionUsed) {
      profile.rekognitionFaceCheck = {
        faceDetected: rekognitionResult.faceDetected,
        hasInappropriateContent: rekognitionResult.hasInappropriateContent,
        verifiedAt: new Date(),
      };
    }
    profile.completenessScore = calculateStudentCompleteness(profile);
    await profile.save();
    res.json({ url, completenessScore: profile.completenessScore, rekognitionResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
