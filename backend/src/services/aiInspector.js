const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyzes a job listing for skills, missing fields, and scam markers.
 */
async function analyzeJobListing(jobData) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze the following job listing for a student education platform.
    Job Title: ${jobData.title}
    Job Description: ${jobData.description}
    Company: ${jobData.company}

    Provide a JSON response with the following fields:
    - "skills": Array of technical and soft skills extracted.
    - "missingFields": Array of missing essential details (choose from: salary, duration, job_type, location, contact_email).
    - "scamMarkers": Array of reasons why this might be a scam (e.g., "predatory language", "unrealistic promises", "missing description").
    - "isLikelyScam": Boolean value.
    - "professionalismScore": Number from 0 to 10 (based on description quality).

    Return ONLY the JSON object.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Clean JSON if needed (Gemini sometimes adds markdown blocks)
    const cleanedJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      skills: [],
      missingFields: ["analysis_failed"],
      scamMarkers: ["AI analysis error"],
      isLikelyScam: false,
      professionalismScore: 0
    };
  }
}

module.exports = { analyzeJobListing };
