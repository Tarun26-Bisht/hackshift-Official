const express = require('express');
const router = express.Router();
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../config/upload');
const { calculateStudentCompleteness, getStudentMissingFields } = require('../services/completeness');
const { verifyFacePhoto } = require('../services/rekognition');

const guard = [authenticate, requireRole('student')];

// Multer error handling wrapper
function handleUpload(fieldName) {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'File upload failed' });
      }
      next();
    });
  };
}

// ─── Get my profile ───────────────────────────────────────────────────────────
router.get('/me', guard, async (req, res) => {
  try {
    let profile = await StudentProfile.findOne({ studentId: req.user._id });
    if (!profile) profile = await StudentProfile.create({ studentId: req.user._id });

    const isFullyVerified = Boolean(profile.idCardUrl && profile.facePhotoUrl);
    res.json({
      profile,
      isVerified: isFullyVerified,
      missingFields: getStudentMissingFields(profile),
    });
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

    const isFullyVerified = Boolean(profile.idCardUrl && profile.facePhotoUrl);
    if (isFullyVerified) {
      profile.onboardingCompleted = true;
      await User.findByIdAndUpdate(req.user._id, { isVerified: true });
    }

    await profile.save();
    res.json({ profile, completenessScore: profile.completenessScore, isVerified: isFullyVerified });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Upload ID card ───────────────────────────────────────────────────────────
router.post('/upload/id-card', guard, handleUpload('idCard'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded. Please choose an image or PDF.' });
    const url = `/uploads/student-ids/${req.file.filename}`;
    let profile = await StudentProfile.findOne({ studentId: req.user._id });
    if (!profile) profile = new StudentProfile({ studentId: req.user._id });
    profile.idCardUrl = url;
    if (req.body.idCardType) profile.idCardType = req.body.idCardType;
    profile.completenessScore = calculateStudentCompleteness(profile);

    // Auto-verify if face photo is already uploaded
    let isFullyVerified = false;
    if (profile.facePhotoUrl) {
      profile.onboardingCompleted = true;
      profile.livenessVerified = true;
      isFullyVerified = true;
      await User.findByIdAndUpdate(req.user._id, { isVerified: true });
    }

    await profile.save();
    res.json({
      success: true,
      url,
      completenessScore: profile.completenessScore,
      isVerified: isFullyVerified,
    });
  } catch (err) {
    console.error('ID Card upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to save ID card.' });
  }
});

// ─── Upload face photo + mark liveness ───────────────────────────────────────
router.post('/upload/face', guard, handleUpload('face'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No photo captured or uploaded. Please capture or select a selfie.' });
    const url = `/uploads/student-faces/${req.file.filename}`;

    // Run Rekognition on face photo (silent fallback if not configured)
    const rekognitionResult = await verifyFacePhoto(url);

    let profile = await StudentProfile.findOne({ studentId: req.user._id });
    if (!profile) profile = new StudentProfile({ studentId: req.user._id });
    profile.facePhotoUrl = url;
    profile.livenessVerified = true;
    profile.livenessChallenge = req.body.challenge || 'photo_verified';

    if (rekognitionResult.rekognitionUsed) {
      profile.rekognitionFaceCheck = {
        faceDetected: rekognitionResult.faceDetected,
        hasInappropriateContent: rekognitionResult.hasInappropriateContent,
        verifiedAt: new Date(),
      };
    }
    profile.completenessScore = calculateStudentCompleteness(profile);

    // Auto-verify if ID card is already uploaded
    let isFullyVerified = false;
    if (profile.idCardUrl) {
      profile.onboardingCompleted = true;
      isFullyVerified = true;
      await User.findByIdAndUpdate(req.user._id, { isVerified: true });
    }

    await profile.save();
    res.json({
      success: true,
      url,
      completenessScore: profile.completenessScore,
      isVerified: isFullyVerified,
      rekognitionResult,
    });
  } catch (err) {
    console.error('Face upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to save face verification.' });
  }
});

module.exports = router;
