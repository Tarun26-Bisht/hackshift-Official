const axios = require('axios');

async function validateLink(url) {
  if (!url) return { isValid: false, reason: 'No link provided' };
  try {
    const response = await axios.get(url, { timeout: 5000 });
    if (response.status >= 200 && response.status < 300) return { isValid: true };
    return { isValid: false, reason: `Status ${response.status}` };
  } catch {
    return { isValid: false, reason: 'Link unreachable or timed out' };
  }
}

/**
 * Calculates TrustScore combining:
 * - Gemini AI result
 * - Link validation
 * - AWS Comprehend signals
 * - Company profile completeness boost
 */
function calculateTrustScore(aiResult, linkResult, jobData, comprehendSignals = null, companyProfile = null) {
  let score = 100;

  // ── Gemini AI ─────────────────────────────────────────────────────────────
  // Professionalism score (0-10) → contributes up to 30pts
  score -= (10 - (aiResult.professionalismScore || 0)) * 3;

  // Missing fields
  if (aiResult.missingFields?.length > 0) {
    score -= aiResult.missingFields.length * 10;
  }

  // Scam markers
  score -= (aiResult.scamMarkers?.length || 0) * 5;
  if (aiResult.isLikelyScam) score -= 50;

  // ── Link Validation ───────────────────────────────────────────────────────
  if (jobData.link && !linkResult.isValid) score -= 40;

  // ── Email Check ───────────────────────────────────────────────────────────
  if (jobData.contactEmail) {
    const isGeneric = /@(gmail|yahoo|outlook|hotmail)\.com$/i.test(jobData.contactEmail);
    if (isGeneric) score -= 10;
  } else {
    score -= 15;
  }

  // ── AWS Comprehend Signals ────────────────────────────────────────────────
  if (comprehendSignals) {
    score -= comprehendSignals.penalty || 0;
  }

  // ── Company Profile Boost ─────────────────────────────────────────────────
  if (companyProfile) {
    if (companyProfile.completenessScore >= 80) score += 10;
    else if (companyProfile.completenessScore >= 60) score += 5;

    if (companyProfile.incorporationCertUrl) score += 10;
    if (companyProfile.linkedIn) score += 5;
    if (companyProfile.registrationNumber) score += 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

module.exports = { validateLink, calculateTrustScore };
