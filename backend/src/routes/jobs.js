const express = require('express');
const router = express.Router();
const { analyzeJobListing } = require('../services/aiInspector');
const { validateLink, calculateTrustScore } = require('../services/trustScore');
const { getRecommendationsForSkill } = require('../services/education');
const { authenticate, requireRole } = require('../middleware/auth');
const { calculateJobCompleteness } = require('../services/completeness');
const { checkBlocklist } = require('../services/blocklist');
const { analyzeWithComprehend, interpretComprehend } = require('../services/comprehend');
const CompanyProfile = require('../models/CompanyProfile');
const Job = require('../models/Job');
const { sendJobApproved, sendJobBlocked } = require('../services/email');
const { getAllGovernmentInternships } = require('../services/governmentInternships');

const recruiterGuard = [authenticate, requireRole('recruiter')];

// ─── POST /audit ──────────────────────────────────────────────────────────────
router.post('/audit', recruiterGuard, async (req, res) => {
  const jobData = req.body;

  try {
    // ── Step 0: Job Completeness Gate ────────────────────────────────────────
    const jobCompleteness = calculateJobCompleteness(jobData);
    if (jobCompleteness < 90) {
      return res.status(400).json({
        success: false,
        error: 'Job listing is incomplete',
        jobCompleteness,
        message: `Your listing is ${jobCompleteness}% complete. Need 90% to submit.`,
        missingHint: ['title', 'description', 'salary', 'duration', 'jobType', 'location', 'contactEmail', 'link', 'deadline']
          .filter(f => !jobData[f] || !String(jobData[f]).trim()),
      });
    }

    const deadline = jobData.deadline
      ? new Date(jobData.deadline)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const fullText = `${jobData.title} ${jobData.description}`;

    // ── Step 1: Blocklist Pre-check ──────────────────────────────────────────
    const blocklistMatches = checkBlocklist(fullText);
    if (blocklistMatches.length > 0) {
      const job = await Job.create({
        recruiterId: req.user._id,
        recruiterName: req.user.name,
        companyName: req.user.companyName || jobData.company,
        ...jobData,
        deadline,
        trustScore: 0,
        status: 'blocked',
        jobCompleteness,
        blocklistMatches,
        blockReason: `Blocked by keyword filter: ${blocklistMatches.join(', ')}`,
        aiResult: { skills: [], missingFields: [], scamMarkers: blocklistMatches, isLikelyScam: true, professionalismScore: 0 },
        linkResult: { isValid: false, reason: 'Blocked before link check' },
        comprehendResult: { sentiment: 'N/A', signals: [], penalty: 0, comprehendUsed: false },
      });
      return res.json({ success: true, job });
    }

    // ── Step 2: AWS Comprehend ───────────────────────────────────────────────
    const comprehendRaw = await analyzeWithComprehend(jobData.description);
    const comprehendSignals = interpretComprehend(comprehendRaw);

    // ── Step 3: Gemini AI Analysis ───────────────────────────────────────────
    const aiResult = await analyzeJobListing(jobData);

    // ── Step 4: Link Validation ──────────────────────────────────────────────
    const linkResult = jobData.link
      ? await validateLink(jobData.link)
      : { isValid: false, reason: 'No link provided' };

    // ── Step 5: Fetch Company Profile for boost ──────────────────────────────
    const companyProfile = await CompanyProfile.findOne({ recruiterId: req.user._id });

    // ── Step 6: TrustScore ───────────────────────────────────────────────────
    const trustScore = calculateTrustScore(aiResult, linkResult, jobData, comprehendSignals, companyProfile);

    // ── Step 7: Decision ─────────────────────────────────────────────────────
    let status = 'approved';
    let blockReason = null;
    if (trustScore < 40 || aiResult.isLikelyScam) {
      status = 'blocked';
      blockReason = aiResult.isLikelyScam
        ? 'AI detected likely scam content'
        : `Trust score too low (${trustScore}/100)`;
    }

    // ── Step 8: Parse skills ─────────────────────────────────────────────────
    const skills = Array.isArray(aiResult.skills)
      ? aiResult.skills
      : typeof jobData.skills === 'string'
        ? jobData.skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];

    // ── Step 9: Save to MongoDB ──────────────────────────────────────────────
    const job = await Job.create({
      recruiterId: req.user._id,
      recruiterName: req.user.name,
      companyName: companyProfile?.legalName || req.user.companyName || jobData.company,
      ...jobData,
      deadline,
      skills,
      trustScore,
      status,
      jobCompleteness,
      blocklistMatches,
      blockReason,
      aiResult,
      linkResult,
      comprehendResult: {
        sentiment: comprehendRaw.sentiment,
        signals: comprehendSignals.signals,
        penalty: comprehendSignals.penalty,
        comprehendUsed: comprehendRaw.comprehendUsed,
      },
    });

    // Send email notification (silent)
    if (status === 'approved') sendJobApproved(req.user.email, job.title, trustScore).catch(() => {});
    else sendJobBlocked(req.user.email, job.title, trustScore, blockReason).catch(() => {});

    res.json({ success: true, job });
  } catch (error) {
    console.error('Audit Route Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error during audit' });
  }
});

// ─── POST /reaudit/:id ────────────────────────────────────────────────────────
router.post('/reaudit/:id', recruiterGuard, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, recruiterId: req.user._id });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status === 'approved') return res.status(400).json({ error: 'Job is already approved' });

    // Merge updates from body
    const updated = { ...job.toObject(), ...req.body };

    const jobCompleteness = calculateJobCompleteness(updated);
    if (jobCompleteness < 90) {
      return res.status(400).json({ success: false, error: 'Still incomplete', jobCompleteness });
    }

    const blocklistMatches = checkBlocklist(`${updated.title} ${updated.description}`);
    if (blocklistMatches.length > 0) {
      job.blocklistMatches = blocklistMatches;
      job.status = 'blocked';
      job.blockReason = `Blocked by keyword filter: ${blocklistMatches.join(', ')}`;
      job.auditCount += 1;
      job.lastAuditAt = new Date();
      await job.save();
      return res.json({ success: true, job });
    }

    const [comprehendRaw, aiResult, linkResult, companyProfile] = await Promise.all([
      analyzeWithComprehend(updated.description),
      analyzeJobListing(updated),
      updated.link ? validateLink(updated.link) : Promise.resolve({ isValid: false, reason: 'No link' }),
      CompanyProfile.findOne({ recruiterId: req.user._id }),
    ]);

    const comprehendSignals = interpretComprehend(comprehendRaw);
    const trustScore = calculateTrustScore(aiResult, linkResult, updated, comprehendSignals, companyProfile);
    const status = trustScore < 40 || aiResult.isLikelyScam ? 'blocked' : 'approved';

    Object.assign(job, {
      ...req.body,
      trustScore, status, aiResult, linkResult, blocklistMatches,
      blockReason: status === 'blocked' ? (aiResult.isLikelyScam ? 'AI detected scam' : `Score too low (${trustScore})`) : null,
      comprehendResult: { sentiment: comprehendRaw.sentiment, signals: comprehendSignals.signals, penalty: comprehendSignals.penalty, comprehendUsed: comprehendRaw.comprehendUsed },
      auditCount: job.auditCount + 1,
      lastAuditAt: new Date(),
    });
    await job.save();

    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /government-internships ─────────────────────────────────────────────
router.get('/government-internships', (req, res) => {
  try {
    const internships = getAllGovernmentInternships(req.query);
    res.json({
      success: true,
      total: internships.length,
      internships,
      portalGuarantees: {
        zeroFee: true,
        directGovernmentPortal: true,
        verifiedStipend: true,
        trustScore: 100,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function isRollingOrTextDeadline(str) {
  if (!str) return true;
  const s = String(str).toLowerCase().trim();
  return (
    s.includes('rolling') ||
    s.includes('cycle') ||
    s.includes('cohort') ||
    s.includes('ongoing') ||
    s.includes('open all year') ||
    s.includes('active') ||
    s.includes('calendar month')
  );
}

function computeDeadlineMeta(deadline) {
  if (!deadline || isRollingOrTextDeadline(deadline)) {
    return { daysLeft: null, isClosingSoon: false, isExpired: false, urgencyTier: 4 };
  }
  const d = new Date(deadline);
  if (isNaN(d.getTime())) {
    return { daysLeft: null, isClosingSoon: false, isExpired: false, urgencyTier: 4 };
  }
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return { daysLeft, isClosingSoon: false, isExpired: true, urgencyTier: 5 };
  }
  if (daysLeft <= 1) {
    return { daysLeft, isClosingSoon: true, isExpired: false, urgencyTier: 1 };
  }
  if (daysLeft <= 5) {
    return { daysLeft, isClosingSoon: true, isExpired: false, urgencyTier: 2 };
  }
  return { daysLeft, isClosingSoon: false, isExpired: false, urgencyTier: 3 };
}

function matchesCourse(job, course) {
  if (!course) return false;
  const c = String(course).toLowerCase();
  const isTechCourse = c.includes('mca') || c.includes('btech') || c.includes('b.tech') || c.includes('cse') || c.includes('computer') || c.includes('information') || c.includes('it') || c.includes('bca') || c.includes('software');
  const isBusinessCourse = c.includes('mba') || c.includes('bba') || c.includes('business') || c.includes('management') || c.includes('marketing') || c.includes('finance');

  const text = `${job.title || ''} ${job.description || ''} ${(job.skills || []).join(' ')}`.toLowerCase();

  if (isTechCourse) {
    const techKeywords = ['developer', 'software', 'engineer', 'frontend', 'backend', 'fullstack', 'react', 'python', 'node', 'java', 'web', 'data', 'cloud', 'ai', 'ml', 'programming', 'technical'];
    return techKeywords.some(k => text.includes(k));
  }
  if (isBusinessCourse) {
    const bizKeywords = ['management', 'business', 'marketing', 'analyst', 'strategy', 'finance', 'consulting', 'operations', 'sales', 'hr'];
    return bizKeywords.some(k => text.includes(k));
  }
  return false;
}

// ─── GET /listings (Search, Filter, Pagination + Govt Internships) ─────────────
router.get('/listings', async (req, res) => {
  try {
    const { search, skill, location, jobType, minScore, isGovernment, page, limit, sortBy, urgentOnly, course } = req.query;

    // Direct government internships request
    if (isGovernment === 'true' || jobType === 'government' || jobType === 'Government Internship') {
      const govListings = getAllGovernmentInternships({ search, skill }).map(item => {
        const meta = computeDeadlineMeta(item.deadline);
        return { ...item, ...meta };
      });
      return res.json(govListings);
    }

    const filter = { status: 'approved' };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (skill) {
      filter.skills = { $regex: new RegExp(`^${skill}$`, 'i') };
    }
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    if (jobType) {
      filter.jobType = { $regex: jobType, $options: 'i' };
    }
    if (minScore) {
      filter.trustScore = { $gte: Number(minScore) };
    }

    const dbJobs = await Job.find(filter).lean();
    const govRaw = getAllGovernmentInternships({ search, skill });

    // Decorate DB jobs with computed deadline metadata
    const decoratedDbJobs = dbJobs.map(job => {
      const meta = computeDeadlineMeta(job.deadline);
      return { ...job, ...meta };
    });

    // Decorate Govt internships
    const decoratedGov = govRaw.map(item => {
      const meta = computeDeadlineMeta(item.deadline);
      return { ...item, ...meta };
    });

    let allListings = !jobType ? [...decoratedGov, ...decoratedDbJobs] : decoratedDbJobs;

    // Filter by urgentOnly (0 to 5 days left)
    if (urgentOnly === 'true') {
      allListings = allListings.filter(j => j.daysLeft !== null && j.daysLeft >= 0 && j.daysLeft <= 5);
    }

    // Sort listings
    if (sortBy === 'closing_soon') {
      allListings.sort((a, b) => {
        // 1. Urgency tier: Tier 1 (0-1 day) -> Tier 2 (2-5 days) -> Tier 3 (>5 days) -> Tier 4 (rolling) -> Tier 5 (expired)
        if (a.urgencyTier !== b.urgencyTier) {
          return a.urgencyTier - b.urgencyTier;
        }

        // For Tier 1 and Tier 2 (Urgent countdowns: 1-day left top, 2-5 days next):
        if (a.urgencyTier === 1 || a.urgencyTier === 2) {
          // Degree matching boost for MCA / B.Tech / MBA
          if (course) {
            const matchA = matchesCourse(a, course);
            const matchB = matchesCourse(b, course);
            if (matchA && !matchB) return -1;
            if (!matchA && matchB) return 1;
          }
          // Sort soonest closing first (1 day before 2 days, 2 days before 3 days, etc.)
          return (a.daysLeft ?? 999) - (b.daysLeft ?? 999);
        }

        // Tier 3 (> 5 days left): soonest deadline first
        if (a.urgencyTier === 3) {
          return (a.daysLeft ?? 999) - (b.daysLeft ?? 999);
        }

        // Tier 4 (Govt / rolling): by trust score
        if (a.urgencyTier === 4) {
          return (b.trustScore || 0) - (a.trustScore || 0);
        }

        return 0;
      });
    } else if (sortBy === 'trustScore') {
      allListings.sort((a, b) => (b.trustScore || 0) - (a.trustScore || 0));
    } else if (sortBy === 'recent') {
      allListings.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else {
      // Default: Put urgent jobs (tier 1 & tier 2) at the top, then recent
      allListings.sort((a, b) => {
        const isAUrgent = a.urgencyTier <= 2;
        const isBUrgent = b.urgencyTier <= 2;
        if (isAUrgent && !isBUrgent) return -1;
        if (!isAUrgent && isBUrgent) return 1;
        if (isAUrgent && isBUrgent) {
          if (a.urgencyTier !== b.urgencyTier) return a.urgencyTier - b.urgencyTier;
          return (a.daysLeft ?? 999) - (b.daysLeft ?? 999);
        }
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
    }

    if (page || limit) {
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.max(1, Number(limit) || 9);
      const total = allListings.length;
      const paginated = allListings.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      return res.json({
        jobs: paginated,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      });
    }

    res.json(allListings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /my-listings ─────────────────────────────────────────────────────────
router.get('/my-listings', recruiterGuard, async (req, res) => {
  try {
    const jobs = await Job.find({ recruiterId: req.user._id }).sort({ createdAt: -1 }).lean();
    const decorated = jobs.map(j => ({ ...j, ...computeDeadlineMeta(j.deadline) }));
    res.json(decorated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /trends (14-day window) ─────────────────────────────────────────────
router.get('/trends', async (req, res) => {
  try {
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const jobs = await Job.find({ status: 'approved', createdAt: { $gte: since } });

    const skillMap = {};
    jobs.forEach(job => {
      (job.skills || []).forEach(skill => {
        const s = skill.toLowerCase().trim();
        if (s) skillMap[s] = (skillMap[s] || 0) + 1;
      });
    });

    const topSkills = Object.entries(skillMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    res.json({ period: 'Last 14 days', topSkills });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /recommendations ─────────────────────────────────────────────────────
router.get('/recommendations', async (req, res) => {
  try {
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const jobs = await Job.find({ status: 'approved', createdAt: { $gte: since } });

    const skillMap = {};
    jobs.forEach(job => {
      (job.skills || []).forEach(skill => {
        const s = skill.toLowerCase().trim();
        if (s) skillMap[s] = (skillMap[s] || 0) + 1;
      });
    });

    const topSkills = Object.entries(skillMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([skill]) => skill);

    if (topSkills.length === 0) {
      return res.json({ recommendations: [{ skill: 'general', courses: getRecommendationsForSkill('default') }] });
    }

    const recommendations = topSkills.map(skill => ({
      skill,
      courses: getRecommendationsForSkill(skill),
    }));

    res.json({ recommendations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
