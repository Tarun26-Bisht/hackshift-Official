const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Job = require('../models/Job');
const CompanyProfile = require('../models/CompanyProfile');
const StudentProfile = require('../models/StudentProfile');
const { authenticate, requireRole } = require('../middleware/auth');
const { sendAccountStatusUpdate } = require('../services/email');

const adminGuard = [authenticate, requireRole('admin')];

// ─── Platform Stats ───────────────────────────────────────────────────────────
router.get('/stats', adminGuard, async (req, res) => {
  try {
    const [totalUsers, totalRecruiters, totalStudents, totalJobs, approvedJobs, blockedJobs] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'recruiter' }),
      User.countDocuments({ role: 'student' }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'approved' }),
      Job.countDocuments({ status: 'blocked' }),
    ]);

    // Top skills from last 14 days
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recentJobs = await Job.find({ status: 'approved', createdAt: { $gte: since } });
    const skillMap = {};
    recentJobs.forEach(j => (j.skills || []).forEach(s => { skillMap[s] = (skillMap[s] || 0) + 1; }));
    const topSkills = Object.entries(skillMap).sort(([, a], [, b]) => b - a).slice(0, 5).map(([skill, count]) => ({ skill, count }));

    res.json({
      totalUsers, totalRecruiters, totalStudents,
      totalJobs, approvedJobs, blockedJobs,
      approvalRate: totalJobs ? Math.round((approvedJobs / totalJobs) * 100) : 0,
      topSkills,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── All Recruiters ───────────────────────────────────────────────────────────
router.get('/recruiters', adminGuard, async (req, res) => {
  try {
    const recruiters = await User.find({ role: 'recruiter' }).sort({ createdAt: -1 }).select('-password');
    const profiles = await CompanyProfile.find({ recruiterId: { $in: recruiters.map(r => r._id) } });
    const profileMap = Object.fromEntries(profiles.map(p => [p.recruiterId.toString(), p]));
    const jobCounts = await Job.aggregate([
      { $match: { recruiterId: { $in: recruiters.map(r => r._id) } } },
      { $group: { _id: '$recruiterId', total: { $sum: 1 }, approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } } } },
    ]);
    const jobMap = Object.fromEntries(jobCounts.map(j => [j._id.toString(), j]));

    res.json(recruiters.map(r => ({
      ...r.toObject(),
      profile: profileMap[r._id.toString()] || null,
      jobStats: jobMap[r._id.toString()] || { total: 0, approved: 0 },
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── All Students ─────────────────────────────────────────────────────────────
router.get('/students', adminGuard, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).sort({ createdAt: -1 }).select('-password');
    const profiles = await StudentProfile.find({ studentId: { $in: students.map(s => s._id) } });
    const profileMap = Object.fromEntries(profiles.map(p => [p.studentId.toString(), p]));
    res.json(students.map(s => ({ ...s.toObject(), profile: profileMap[s._id.toString()] || null })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── All Jobs ─────────────────────────────────────────────────────────────────
router.get('/jobs', adminGuard, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Job.countDocuments(filter);
    res.json({ jobs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Toggle user active & verification status ────────────────────────────────
router.patch('/users/:id/status', adminGuard, async (req, res) => {
  try {
    const { isActive, isVerified, reason } = req.body;
    const update = {};
    if (typeof isActive === 'boolean') update.isActive = isActive;
    if (typeof isVerified === 'boolean') update.isVerified = isVerified;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Also sync StudentProfile verification if applicable
    if (user.role === 'student' && typeof isVerified === 'boolean') {
      await StudentProfile.findOneAndUpdate({ studentId: user._id }, { livenessVerified: isVerified });
    }

    const statusText = user.isActive ? (user.isVerified ? 'verified & active' : 'active') : 'suspended';
    sendAccountStatusUpdate(user.email, user.name, statusText, reason || '').catch(() => {});
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Toggle job status (Block / Unblock / Approve) ───────────────────────────
router.patch('/jobs/:id/status', adminGuard, async (req, res) => {
  try {
    const { status, blockReason } = req.body;
    if (!['approved', 'blocked'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be approved or blocked' });
    }

    const update = { status };
    if (status === 'blocked') {
      update.blockReason = blockReason || 'Manually blocked by platform administrator';
    } else if (status === 'approved') {
      update.blockReason = null;
    }

    const job = await Job.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
