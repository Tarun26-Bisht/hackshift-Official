const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config({ override: true });

const passport = require('./config/passport');
const authRouter = require('./routes/auth');
const jobsRouter = require('./routes/jobs');
const companyRouter = require('./routes/company');
const studentRouter = require('./routes/student');
const adminRouter = require('./routes/admin');
const coursesRouter = require('./routes/courses');

const app = express();
const PORT = process.env.PORT || 5001;

// ─── Security Headers Middleware (Production-ready) ───────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// ─── CORS Configuration ───────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Allow matched client URL or any Vercel deployment preview domain
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(passport.initialize());
app.use('/uploads', express.static('uploads'));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/company', companyRouter);
app.use('/api/student', studentRouter);
app.use('/api/admin', adminRouter);
app.use('/api/student/courses', coursesRouter);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TrustBridge Backend is healthy and operational',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: process.env.NODE_ENV || 'development',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ─── MongoDB + Server Start ───────────────────────────────────────────────────
let server;

async function startServer() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trustbridge';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.warn('⚠️ Atlas connection failed (check Atlas IP whitelist). Falling back to local MongoDB...');
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/trustbridge');
      console.log('✅ Connected to Local MongoDB (127.0.0.1:27017)');
    } catch (localErr) {
      console.error('❌ MongoDB connection failed:', localErr.message);
      process.exit(1);
    }
  }

  server = app.listen(PORT, () => {
    console.log(`🚀 TrustBridge Server running on port ${PORT}`);
    console.log(`📡 CORS allowed for: ${allowedOrigins.join(', ')}`);
  });
}

startServer();

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('HTTP server closed.');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed.');
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
