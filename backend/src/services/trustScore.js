const axios = require('axios');

async function validateLink(url) {
  if (!url) return { isValid: false, reason: 'No link provided' };
  try {
    const response = await axios.get(url, {
      timeout: 6000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (response.status >= 200 && response.status < 400) return { isValid: true };
    return { isValid: false, reason: `Status ${response.status}` };
  } catch (err) {
    // 403/401 indicates server is active but blocking automated scrapers (common for LinkedIn, Indeed, etc.)
    if (err.response && (err.response.status === 403 || err.response.status === 401 || err.response.status === 999)) {
      return { isValid: true, reason: 'Protected domain verified' };
    }
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
