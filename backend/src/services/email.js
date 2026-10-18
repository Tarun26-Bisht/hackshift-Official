const nodemailer = require('nodemailer');

const isConfigured = () => process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_gmail@gmail.com';

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

async function sendEmail(to, subject, html) {
  if (!isConfigured()) {
    console.log(`📧 Email skipped (not configured): ${subject} → ${to}`);
    return;
  }
  try {
    await getTransporter().sendMail({
      from: `"TrustBridge" <${process.env.EMAIL_USER}>`,
      to, subject, html,
    });
  } catch (err) {
    console.warn('⚠️ Email send failed:', err.message);
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

const base = (content) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
    <h2 style="color:#2563eb;margin-bottom:4px">TrustBridge</h2>
    <p style="color:#6b7280;font-size:13px;margin-top:0">Scam-Free Jobs for Students</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
    ${content}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
    <p style="color:#9ca3af;font-size:12px">© TrustBridge. This is an automated message.</p>
  </div>`;

async function sendJobApproved(to, jobTitle, trustScore) {
  await sendEmail(to, `✅ Your listing "${jobTitle}" is approved!`, base(`
    <h3 style="color:#16a34a">Your listing is live!</h3>
    <p>Great news — <strong>${jobTitle}</strong> passed our AI audit with a trust score of <strong>${trustScore}/100</strong>.</p>
    <p>Students can now discover and apply to your listing on TrustBridge.</p>
    <a href="${process.env.CLIENT_URL}/recruiter/dashboard" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:12px">View Dashboard</a>
  `));
}

async function sendJobBlocked(to, jobTitle, trustScore, blockReason) {
  await sendEmail(to, `🚫 Your listing "${jobTitle}" was blocked`, base(`
    <h3 style="color:#dc2626">Listing did not pass audit</h3>
    <p><strong>${jobTitle}</strong> received a trust score of <strong>${trustScore}/100</strong> and was blocked.</p>
    <p><strong>Reason:</strong> ${blockReason}</p>
    <p>You can fix the issues and resubmit from your dashboard.</p>
    <a href="${process.env.CLIENT_URL}/post-job" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:12px">Fix & Resubmit</a>
  `));
}

async function sendWelcomeRecruiter(to, name, companyName) {
  await sendEmail(to, `Welcome to TrustBridge, ${name}!`, base(`
    <h3>Welcome aboard, ${name}! 👋</h3>
    <p>Your recruiter account for <strong>${companyName || 'your company'}</strong> has been created.</p>
    <p>Complete your company profile to increase your trust score and start posting verified listings.</p>
    <a href="${process.env.CLIENT_URL}/recruiter/onboarding" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:12px">Complete Profile</a>
  `));
}

async function sendWelcomeStudent(to, name) {
  await sendEmail(to, `Welcome to TrustBridge, ${name}!`, base(`
    <h3>Welcome, ${name}! 🎓</h3>
    <p>Your student account is ready. Browse verified, scam-free job and internship listings.</p>
    <p>Complete your profile and verify your identity to stand out to recruiters.</p>
    <a href="${process.env.CLIENT_URL}/student/onboarding" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:12px">Complete Profile</a>
  `));
}

async function sendAccountStatusUpdate(to, name, status, reason = '') {
  const approved = status === 'approved';
  await sendEmail(to, `Your TrustBridge account has been ${approved ? 'approved' : 'suspended'}`, base(`
    <h3 style="color:${approved ? '#16a34a' : '#dc2626'}">${approved ? '✅ Account Approved' : '🚫 Account Suspended'}</h3>
    <p>Hi ${name}, your TrustBridge account has been <strong>${status}</strong> by our admin team.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
    ${approved ? `<a href="${process.env.CLIENT_URL}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:12px">Go to Platform</a>` : ''}
  `));
}

module.exports = { sendJobApproved, sendJobBlocked, sendWelcomeRecruiter, sendWelcomeStudent, sendAccountStatusUpdate };
