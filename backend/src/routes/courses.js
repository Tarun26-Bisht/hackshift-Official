const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getFreeCourses, FREE_COURSES } = require('../services/freeCourses');
const { recommendCoursesForStudent } = require('../services/courseRecommender');
const StudentProfile = require('../models/StudentProfile');

// Strict Guard: ONLY students can access free courses
const studentGuard = [authenticate, requireRole('student')];

// ─── GET /api/student/courses ────────────────────────────────────────────────
router.get('/', studentGuard, (req, res) => {
  try {
    const { search, category, platform, skill, discipline } = req.query;
    const courses = getFreeCourses({ search, category, platform, skill, discipline });

    res.json({
      success: true,
      total: courses.length,
      accessRole: req.user.role,
      studentName: req.user.name,
      courses,
      disciplines: [
        'All',
        'Technical / Engineering',
        'MBA / Business & Management',
      ],
      categories: [
        'All',
        'Artificial Intelligence',
        'Web Development',
        'Data Structures & Algorithms',
        'Management & MBA',
        'Cloud Computing',
        'Cybersecurity',
        'Computer Science',
      ],
      platforms: [
        'All',
        'IBM SkillsBuild',
        'Infosys Springboard',
        'Swayam / NPTEL',
        'freeCodeCamp',
        'Google Cloud Skills Boost',
        'Kaggle Learn',
        'Harvard University / CS50',
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/student/courses/ai-recommendations ──────────────────────────────
router.get('/ai-recommendations', studentGuard, async (req, res) => {
  try {
    let studentField = req.query.field;

    // If no explicit field query, try student's profile or user object
    if (!studentField || studentField.trim() === '') {
      const profile = await StudentProfile.findOne({ studentId: req.user.userId });
      studentField = profile?.course || req.user.course || 'MERN Stack Developer';
    }

    const skills = req.query.skills ? req.query.skills.split(',').map(s => s.trim()) : [];
    const careerGoal = req.query.careerGoal || '';

    const recommendations = await recommendCoursesForStudent({
      field: studentField,
      skills,
      careerGoal,
    });

    res.json({
      success: true,
      studentName: req.user.name,
      requestedField: studentField,
      recommendations,
    });
  } catch (err) {
    console.error('AI Recommendation route error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
