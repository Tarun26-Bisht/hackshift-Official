const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Intelligent Fallback Heuristic Inspector when Gemini API is unavailable.
 */
function analyzeHeuristically(jobData) {
  const text = `${jobData.title || ''} ${jobData.description || ''}`.toLowerCase();
  const desc = jobData.description || '';

  // 1. Skill extraction dictionary
  const skillDict = [
    'react', 'node.js', 'nodejs', 'javascript', 'typescript', 'python', 'java', 'c++',
    'mongodb', 'sql', 'express', 'next.js', 'html', 'css', 'tailwind', 'aws', 'docker',
    'git', 'rest api', 'graphql', 'machine learning', 'deep learning', 'data science',
    'agile', 'scrum', 'ui/ux', 'figma', 'excel', 'power bi', 'finance', 'marketing',
    'communication', 'problem solving', 'leadership'
  ];

  const extractedSkills = skillDict
    .filter(s => text.includes(s))
    .map(s => s.charAt(0).toUpperCase() + s.slice(1));

  // 2. Missing fields check
  const missingFields = [];
  if (!jobData.salary || !String(jobData.salary).trim()) missingFields.push('salary');
  if (!jobData.duration || !String(jobData.duration).trim()) missingFields.push('duration');
  if (!jobData.jobType || !String(jobData.jobType).trim()) missingFields.push('job_type');
  if (!jobData.location || !String(jobData.location).trim()) missingFields.push('location');
  if (!jobData.contactEmail || !String(jobData.contactEmail).trim()) missingFields.push('contact_email');

  // 3. Scam markers
  const scamMarkers = [];
  const scamKeywords = [
    'registration fee', 'pay upfront', 'telegram task', 'work 5 minutes', 'daily payout 50000',
    'no interview', 'guaranteed selection', 'send money', 'deposit required',
  ];
  scamKeywords.forEach(kw => {
    if (text.includes(kw)) scamMarkers.push(`Suspicious phrase: "${kw}"`);
  });

  const isLikelyScam = scamMarkers.length > 0;

  // 4. Professionalism score (0-10)
  let professionalismScore = 5;
  if (desc.length > 300) professionalismScore += 2;
  if (desc.length > 600) professionalismScore += 1;
  if (/[A-Z]/.test(desc) && /[.!?]/.test(desc)) professionalismScore += 1;
  if (jobData.title && jobData.title.length > 10) professionalismScore += 1;
  if (isLikelyScam) professionalismScore = Math.max(1, professionalismScore - 5);

  return {
    skills: extractedSkills.length > 0 ? extractedSkills : ['General Professional Skills'],
    missingFields,
    scamMarkers,
    isLikelyScam,
    professionalismScore: Math.min(10, Math.max(1, professionalismScore)),
  };
}

/**
 * Analyzes a job listing for skills, missing fields, scam markers, and professionalism.
 */
async function analyzeJobListing(jobData) {
  if (!genAI || !apiKey) {
    return analyzeHeuristically(jobData);
  }

  const prompt = `
    Analyze the following job listing for a student education and internship platform.
    Job Title: ${jobData.title || ''}
    Job Description: ${jobData.description || ''}
    Company: ${jobData.company || jobData.companyName || ''}

    Provide a JSON response with the following fields:
    - "skills": Array of technical and professional skills extracted.
    - "missingFields": Array of essential details that are clearly missing from the job text (choose from: salary, duration, job_type, location, contact_email).
    - "scamMarkers": Array of reasons why this might be a scam (e.g., "predatory language", "unrealistic promises", "asking for money"). If legitimate, return empty array [].
    - "isLikelyScam": Boolean value.
    - "professionalismScore": Number from 1 to 10 based on description quality, clarity, and tone.

    Return ONLY a valid JSON object (no markdown, no other text).
  `;

  const modelsToTry = ["gemini-3.5-flash-lite", "gemini-3.1-pro-preview", "gemini-2.5-flash"];

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const cleanedJson = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanedJson);

      return {
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        missingFields: Array.isArray(parsed.missingFields) ? parsed.missingFields : [],
        scamMarkers: Array.isArray(parsed.scamMarkers) ? parsed.scamMarkers : [],
        isLikelyScam: Boolean(parsed.isLikelyScam),
        professionalismScore: typeof parsed.professionalismScore === 'number' ? parsed.professionalismScore : 8,
      };
    } catch (err) {
      console.warn(`Model ${modelName} attempt error:`, err.message);
    }
  }

  // If all Gemini models encountered temporary limits, use intelligent heuristic analysis
  console.log("Using heuristic fallback for job listing analysis.");
  return analyzeHeuristically(jobData);
}

module.exports = { analyzeJobListing };
