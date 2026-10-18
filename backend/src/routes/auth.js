const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { sendWelcomeRecruiter, sendWelcomeStudent } = require('../services/email');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ─── Email/Password Signup ───────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { name, email, password, role, companyName, companyWebsite, companyType, collegeName, course, yearOfStudy } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password and role are required' });
  }
  if (!['student', 'recruiter'].includes(role)) {
    return res.status(400).json({ error: 'role must be student or recruiter' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name, email, password: hashed, role,
      ...(role === 'recruiter' && { companyName, companyWebsite, companyType }),
      ...(role === 'student' && { collegeName, course, yearOfStudy }),
    });

    const token = signToken(user);
    // Send welcome email (silent)
    if (role === 'recruiter') sendWelcomeRecruiter(email, name, companyName).catch(() => {});
    else sendWelcomeStudent(email, name).catch(() => {});
    res.status(201).json({ token, user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed', details: err.message });
  }
});

// ─── Email/Password Login ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  try {
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── Google OAuth ────────────────────────────────────────────────────────────
// role is passed as `state` query param: /api/auth/google?role=recruiter
router.get('/google', (req, res, next) => {
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!secret || secret === 'YOUR_GOOGLE_CLIENT_SECRET_HERE' || secret.includes('.apps.googleusercontent.com')) {
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=google_secret_missing`);
  }
  const role = req.query.role || 'student';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: role,
    session: false,
  })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=google_failed`,
  }),
  (req, res) => {
    const token = signToken(req.user);
    const role = req.user.role || 'student';
    const safeUser = sanitize(req.user);
    const userEncoded = encodeURIComponent(JSON.stringify(safeUser));
    // Redirect to frontend with token, role, and serialized user in query
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}&role=${role}&user=${userEncoded}`);
  }
);

// ─── Get Current User ────────────────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  res.json({ user: sanitize(req.user) });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sanitize(user) {
  const { password, __v, ...safe } = user.toObject ? user.toObject() : user;
  return safe;
}

module.exports = router;
