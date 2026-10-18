const { GoogleGenerativeAI } = require("@google/generative-ai");
const { FREE_COURSES } = require("./freeCourses");

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Fallback recommendations when Gemini API is unavailable or quota is exceeded.
 */
function getRuleBasedRecommendations(studentField = "General", currentSkills = []) {
  const normalizedField = (studentField || "").toLowerCase();
  const isMBA = /mba|business|management|marketing|finance|commerce|bba|hr/i.test(normalizedField);
  const isDataOrAI = /data|ai|machine learning|ml|deep learning|analytics|python/i.test(normalizedField);
  const isCybersecurity = /cyber|security|soc|network|ethical/i.test(normalizedField);

  if (isMBA) {
    return {
      field: studentField,
      discipline: "MBA / Business & Management",
      trendingSkills: [
        "Digital Business Transformation",
        "Financial Modeling & Power BI",
        "Strategic Brand Analytics",
        "Agile Team Leadership & Scrum",
        "Enterprise Design Thinking",
      ],
      recommendedCourseIds: [
        "ibm_agile_management",
        "swayam_mba_strategy",
        "infosys_strategic_marketing",
        "swayam_corporate_finance",
      ],
      learningRoadmap: [
        {
          phase: "Phase 1: Management Foundations",
          goal: "Master Agile framework, Scrum rituals, and Enterprise Design Thinking with IBM SkillsBuild.",
          duration: "Weeks 1-3",
        },
        {
          phase: "Phase 2: Strategic Vision & Market Positioning",
          goal: "Learn Porter's 5 forces, BCG Matrix, and M&A strategies via IIT Roorkee's Swayam course.",
          duration: "Weeks 4-7",
        },
        {
          phase: "Phase 3: Financial Analytics & ROI Mastery",
          goal: "Build real-world DCF valuation models and corporate balance sheet simulations with IIT Kharagpur.",
          duration: "Weeks 8-10",
        },
      ],
      aiRationale:
        "For MBA & business students, corporate recruiters prioritize candidates who blend strategic management frameworks with Agile delivery and data-driven marketing analytics.",
    };
  }

  if (isDataOrAI) {
    return {
      field: studentField,
      discipline: "Artificial Intelligence & Data Science",
      trendingSkills: [
        "Generative AI & LLMs",
        "Prompt Engineering",
        "PyTorch / TensorFlow",
        "Transformer Architectures",
        "Vector Databases & RAG",
      ],
      recommendedCourseIds: [
        "ibm_gen_ai",
        "google_generative_ai",
        "kaggle_intro_dl",
        "swayam_dsa_python",
      ],
      learningRoadmap: [
        {
          phase: "Phase 1: Algorithmic Foundations in Python",
          goal: "Master Python data structures and algorithm analysis with IIT Madras on Swayam.",
          duration: "Weeks 1-4",
        },
        {
          phase: "Phase 2: Deep Learning & Neural Architectures",
          goal: "Build convolutional and dense neural nets with TensorFlow via Kaggle Learn.",
          duration: "Weeks 5-8",
        },
        {
          phase: "Phase 3: Enterprise GenAI & Prompt Engineering",
          goal: "Earn official IBM and Google Cloud credentials in Large Language Models & Prompt Design.",
          duration: "Weeks 9-12",
        },
      ],
      aiRationale:
        "Modern AI engineering requires a strong foundation in Python algorithms combined with hands-on credentialed proof of working with LLMs and Deep Learning networks.",
    };
  }

  if (isCybersecurity) {
    return {
      field: studentField,
      discipline: "Cybersecurity & Infrastructure",
      trendingSkills: [
        "Security Operations Center (SOC)",
        "Threat Intelligence & Hunting",
        "SIEM / IBM QRadar",
        "Incident Response",
        "Network Defense Protocols",
      ],
      recommendedCourseIds: [
        "ibm_cybersecurity",
        "fcc_info_security",
        "gcp_cloud_engineer",
      ],
      learningRoadmap: [
        {
          phase: "Phase 1: Network & Information Security",
          goal: "Complete freeCodeCamp Information Security with helmet.js & vulnerability assessment.",
          duration: "Weeks 1-4",
        },
        {
          phase: "Phase 2: Enterprise SOC Analyst Operations",
          goal: "Earn the IBM Professional Certificate with hands-on SIEM and QRadar lab simulations.",
          duration: "Weeks 5-9",
        },
        {
          phase: "Phase 3: Cloud Infrastructure Security",
          goal: "Implement IAM and VPC zero-trust architectures on Google Cloud Skills Boost.",
          duration: "Weeks 10-12",
        },
      ],
      aiRationale:
        "Cybersecurity roles demand verified vendor certificates (like IBM) demonstrating threat response capabilities alongside secure coding practices.",
    };
  }

  // Default: Technical / MERN / Web / Computer Science
  return {
    field: studentField || "MERN Stack / Full Stack Web Development",
    discipline: "Technical / Engineering",
    trendingSkills: [
      "Next.js 14 App Router & SSR",
      "MongoDB Atlas & Aggregation Pipelines",
      "Node.js Microservices & Express REST APIs",
      "Generative AI & LLM API Integration",
      "Tailwind CSS & Component Architecture",
    ],
    recommendedCourseIds: [
      "infosys_mern_stack",
      "ibm_gen_ai",
      "swayam_dsa_python",
      "fcc_responsive_web",
      "harvard_cs50_web",
    ],
    learningRoadmap: [
      {
        phase: "Phase 1: Full-Stack MERN Architecture",
        goal: "Master end-to-end React, Node, Express, and MongoDB under Infosys Springboard curriculum.",
        duration: "Weeks 1-5",
      },
      {
        phase: "Phase 2: DSA & Scalable System Design",
        goal: "Crack tech interviews with IIT Madras algorithmic rigor on Swayam and CS50 Web.",
        duration: "Weeks 6-9",
      },
      {
        phase: "Phase 3: AI Augmentation & Cloud Deployment",
        goal: "Integrate LLM APIs and prompt engineering into MERN apps with IBM SkillsBuild credential.",
        duration: "Weeks 10-12",
      },
    ],
    aiRationale:
      "Full stack recruiters in 2026 seek MERN developers who combine production-grade React/Node skills with AI API integration and certified corporate training credentials like Infosys & IBM.",
  };
}

/**
 * AI Course Recommender powered by Google Gemini (with graceful rule-based fallback).
 */
async function recommendCoursesForStudent({ field = "MERN Stack Developer", skills = [], careerGoal = "" }) {
  // If no Gemini API key, return rule-based
  if (!genAI || !apiKey) {
    const fallback = getRuleBasedRecommendations(field, skills);
    return enrichRecommendedCourses(fallback);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Provide the catalog of courses so Gemini selects from REAL courses in our platform
    const catalogSummary = FREE_COURSES.map(c => ({
      id: c.id,
      title: c.title,
      platform: c.platform,
      provider: c.provider,
      discipline: c.discipline,
      skills: c.skills,
    }));

    const prompt = `
You are an expert career counselor and curriculum advisor for college students in India.
A student is asking for personalized course recommendations.

Student Profile:
- Degree / Academic Field: "${field}"
- Existing Skills: "${Array.isArray(skills) ? skills.join(", ") : skills}"
- Career Target / Goal: "${careerGoal || "High-paying internship or entry-level placement"}"

Here is the exact catalog of verified free courses available on our platform:
${JSON.stringify(catalogSummary, null, 2)}

Instructions:
1. Select 3 to 5 courses from the catalog whose "id" matches the student's field best.
   - If the student is in MERN / Computer Science / Engineering, select technical courses (e.g. Infosys MERN, IBM GenAI, Swayam DSA, Harvard CS50).
   - If the student is in MBA / Business / Management, select business courses (e.g. IBM Agile Management, Swayam MBA Strategic Management, Infosys Digital Marketing, Swayam Corporate Finance).
   - If in Data / AI, select AI & Deep learning courses.
2. Provide 4 to 5 current trending industry skills for 2026 tailored specifically to this field.
3. Provide a 3-phase structured learning roadmap (Phase 1, Phase 2, Phase 3).
4. Provide a 2-3 sentence personalized AI rationale explaining why this selection guarantees competitive advantage in placement interviews.

Return ONLY a valid JSON object matching this schema (no markdown wrap, no text before or after):
{
  "field": "${field}",
  "discipline": "Technical / Engineering or MBA / Business & Management",
  "trendingSkills": ["skill 1", "skill 2", "skill 3", "skill 4", "skill 5"],
  "recommendedCourseIds": ["exact_id_1", "exact_id_2", "exact_id_3"],
  "learningRoadmap": [
    { "phase": "Phase 1: Foundation", "goal": "what to master", "duration": "Weeks 1-4" },
    { "phase": "Phase 2: Project & Scalability", "goal": "what to build", "duration": "Weeks 5-8" },
    { "phase": "Phase 3: Industry Certification", "goal": "what credential to earn", "duration": "Weeks 9-12" }
  ],
  "aiRationale": "rationale string"
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // Validate that recommendedCourseIds contains valid IDs
    const validIds = parsed.recommendedCourseIds && Array.isArray(parsed.recommendedCourseIds)
      ? parsed.recommendedCourseIds.filter(id => FREE_COURSES.some(c => c.id === id))
      : [];

    if (validIds.length === 0) {
      // If Gemini returned non-matching IDs, use rule-based IDs
      const fallback = getRuleBasedRecommendations(field, skills);
      parsed.recommendedCourseIds = fallback.recommendedCourseIds;
    }

    return enrichRecommendedCourses(parsed);
  } catch (error) {
    console.error("Gemini AI Course Recommendation error, using fallback:", error.message);
    const fallback = getRuleBasedRecommendations(field, skills);
    return enrichRecommendedCourses(fallback);
  }
}

/**
 * Attaches the full course objects to the recommendation response.
 */
function enrichRecommendedCourses(recommendation) {
  const courseMap = new Map(FREE_COURSES.map(c => [c.id, c]));
  const courses = (recommendation.recommendedCourseIds || [])
    .map(id => courseMap.get(id))
    .filter(Boolean);

  return {
    ...recommendation,
    courses,
  };
}

module.exports = {
  recommendCoursesForStudent,
  getRuleBasedRecommendations,
};
