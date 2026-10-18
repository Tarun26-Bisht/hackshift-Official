const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/models/User');

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trustbridge';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.warn('⚠️ Atlas connection failed (check IP whitelist). Falling back to local MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/trustbridge');
    console.log('✅ Connected to Local MongoDB');
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@trustbridge.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    console.log('✅ Admin already exists:', adminEmail);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(adminPassword, 12);
  await User.create({
    name: 'TrustBridge Admin',
    email: adminEmail,
    password: hashed,
    role: 'admin',
    isVerified: true,
    isActive: true,
  });

  console.log('✅ Admin created successfully:', adminEmail);
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
