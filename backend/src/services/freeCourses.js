/**
 * Student-Only Free Courses Service
 * Verified free courses across Technical (MERN, Cloud, AI), Business/MBA (Strategy, Finance, Marketing),
 * and Core Disciplines from:
 * - Swayam & NPTEL (Govt. of India)
 * - IBM SkillsBuild
 * - Infosys Springboard
 * - freeCodeCamp
 * - Google Cloud & Kaggle
 * - Harvard University (CS50)
 */

const FREE_COURSES = [
  // ─── IBM SkillsBuild ───────────────────────────────────────────────────────
  {
    id: "ibm_gen_ai",
    title: "Generative AI Fundamentals & Prompt Engineering",
    platform: "IBM SkillsBuild",
    provider: "IBM Training & Credentials",
    category: "Artificial Intelligence",
    discipline: "Technical / Engineering",
    duration: "10 Hours (Self-Paced)",
    price: "100% Free",
    certificateAvailable: true,
    certificateType: "Official IBM Digital Credential / Badge",
    level: "Beginner",
    skills: ["Generative AI", "LLMs", "Prompt Engineering", "AI Ethics", "ChatGPT/Watson"],
    description: "Learn fundamental GenAI architectures, transformer models, and prompt engineering strategies directly from IBM AI scientists. Receive an official IBM digital credential upon project completion.",
    enrollUrl: "https://skillsbuild.org/students/course-catalog/artificial-intelligence",
    badge: "IBM Official Credential",
    rating: 4.9,
    learnersCount: "120,000+",
  },
  {
    id: "ibm_cybersecurity",
    title: "Enterprise Cybersecurity Analyst Professional Certificate",
    platform: "IBM SkillsBuild",
    provider: "IBM Security Group",
    category: "Cybersecurity",
    discipline: "Technical / Engineering",
    duration: "40 Hours (Self-Paced)",
    price: "100% Free",
    certificateAvailable: true,
    certificateType: "Official IBM Professional Certificate",
    level: "Beginner to Intermediate",
    skills: ["SOC Operations", "Threat Intelligence", "SIEM", "Incident Response", "Network Defense"],
    description: "Comprehensive hands-on training preparing students for Security Operations Center (SOC) entry-level roles. Includes virtual lab simulations with IBM QRadar and Wireshark.",
    enrollUrl: "https://skillsbuild.org/students/course-catalog/cybersecurity",
    badge: "IBM Professional Cert",
    rating: 4.8,
    learnersCount: "95,000+",
  },
  {
    id: "ibm_agile_management",
    title: "Agile Project Management & Enterprise Design Thinking",
    platform: "IBM SkillsBuild",
    provider: "IBM Agile Academy",
    category: "Management & MBA",
    discipline: "MBA / Business & Management",
    duration: "15 Hours (Self-Paced)",
    price: "100% Free",
    certificateAvailable: true,
    certificateType: "IBM Enterprise Design Thinking Badge",
    level: "Beginner to Intermediate",
    skills: ["Agile", "Scrum", "Sprint Planning", "Product Strategy", "User Journey Mapping"],
    description: "Essential framework for MBA, BBA, and management students. Master Agile team leadership, backlog prioritization, and IBM's world-famous Enterprise Design Thinking loop.",
    enrollUrl: "https://skillsbuild.org/students/course-catalog/professional-skills",
    badge: "IBM Business Badge",
    rating: 4.9,
    learnersCount: "82,000+",
  },

  // ─── Infosys Springboard ────────────────────────────────────────────────────
  {
    id: "infosys_mern_stack",
    title: "Full Stack Web Development with MERN (MongoDB, Express, React, Node)",
    platform: "Infosys Springboard",
    provider: "Infosys Education & Training",
    category: "Web Development",
    discipline: "Technical / Engineering",
    duration: "60 Hours (Self-Paced)",
    price: "100% Free",
    certificateAvailable: true,
    certificateType: "Infosys Springboard Verified Certificate",
    level: "Intermediate",
    skills: ["React", "Node.js", "Express", "MongoDB", "REST APIs", "MERN Stack"],
    description: "Curated by Infosys senior software architects for engineering students. Covers building scalable end-to-end web applications with React frontend, Express/Node microservices, and MongoDB Atlas.",
    enrollUrl: "https://infyspringboard.onwingspan.com/web/en/page/home",
    badge: "Infosys Certified",
    rating: 4.9,
    learnersCount: "145,000+",
  },
  {
    id: "infosys_strategic_marketing",
    title: "Digital Marketing Analytics & Strategic Brand Management",
    platform: "Infosys Springboard",
    provider: "Infosys Leadership Institute",
    category: "Management & MBA",
    discipline: "MBA / Business & Management",
    duration: "30 Hours (Self-Paced)",
    price: "100% Free",
    certificateAvailable: true,
    certificateType: "Infosys Springboard Certificate",
    level: "Beginner to Intermediate",
    skills: ["Marketing Analytics", "SEO/SEM", "Brand Strategy", "Customer Lifetime Value", "Market Research"],
    description: "Specially designed for MBA (Marketing/Operations) and BBA students. Learn data-driven marketing campaigns, CAC/LTV funnel optimization, and digital brand building.",
    enrollUrl: "https://infyspringboard.onwingspan.com/web/en/page/home",
    badge: "Infosys Springboard",
    rating: 4.8,
    learnersCount: "64,000+",
  },
  {
    id: "infosys_financial_analysis",
    title: "Business Intelligence, Financial Modeling & Excel Analytics",
    platform: "Infosys Springboard",
    provider: "Infosys Finance & Consulting",
    category: "Finance & Accounting",
    discipline: "MBA / Business & Management",
    duration: "25 Hours (Self-Paced)",
    price: "100% Free",
    certificateAvailable: true,
    certificateType: "Infosys Springboard Certificate",
    level: "Intermediate",
    skills: ["Financial Modeling", "Power BI", "Advanced Excel", "Valuation", "Business Analytics"],
    description: "Hands-on corporate valuation, discounted cash flow (DCF) modeling, budget variance analysis, and interactive dashboard creation using Power BI and Excel.",
    enrollUrl: "https://infyspringboard.onwingspan.com/web/en/page/home",
    badge: "Infosys Finance",
    rating: 4.9,
    learnersCount: "78,000+",
  },

  // ─── Swayam & NPTEL (Govt. of India Certified) ──────────────────────────────
  {
    id: "swayam_ai_iitr",
    title: "Artificial Intelligence: Search Methods for Problem Solving",
    platform: "Swayam / NPTEL (IIT Madras)",
    provider: "IIT Madras & Ministry of Education, Govt. of India",
    category: "Artificial Intelligence",
    discipline: "Technical / Engineering",
    duration: "12 Weeks",
    price: "100% Free",
    certificateAvailable: true,
    certificateType: "Official NPTEL / MoE Certificate",
    level: "Intermediate",
    skills: ["AI", "Search Algorithms", "Heuristics", "Graph Theory", "Python"],
    description: "Official Government of India certified course covering classical search, A* algorithm, constraint satisfaction problems, and games search with real-world AI applications.",
    enrollUrl: "https://onlinecourses.nptel.ac.in/noc24_cs54/preview",
    badge: "🇮🇳 Govt Certified",
    rating: 4.8,
    learnersCount: "42,000+",
  },
  {
    id: "swayam_python_iitm",
    title: "Programming, Data Structures And Algorithms Using Python",
    platform: "Swayam / NPTEL (IIT Madras)",
    provider: "IIT Madras & NPTEL",
    category: "Data Structures & Algorithms",
    discipline: "Technical / Engineering",
    duration: "8 Weeks",
    price: "100% Free",
    certificateAvailable: true,
    certificateType: "NPTEL Certificate",
    level: "Beginner to Intermediate",
    skills: ["Python", "DSA", "Recursion", "Searching & Sorting", "Time Complexity"],
    description: "Foundational computer science curriculum taught by top IIT Madras faculty. Learn algorithmic problem solving, recursion, memoization, and optimal data structure choices.",
    enrollUrl: "https://onlinecourses.nptel.ac.in/noc24_cs57/preview",
    badge: "🇮🇳 IIT Madras",
    rating: 4.9,
    learnersCount: "68,000+",
  },
  {
    id: "swayam_mba_strategy",
    title: "Strategic Management & Corporate Leadership",
    platform: "Swayam / NPTEL (IIT Roorkee)",
    provider: "IIT Roorkee, Department of Management Studies",
    category: "Management & MBA",
    discipline: "MBA / Business & Management",
    duration: "8 Weeks",
    price: "100% Free",
    certificateAvailable: true,
    certificateType: "Official NPTEL / MoE Certificate",
    level: "Postgraduate / MBA",
    skills: ["Corporate Strategy", "Porter's 5 Forces", "Competitive Advantage", "Mergers & Acquisitions", "Governance"],
    description: "Rigorous MBA-level strategic management taught by IIT Roorkee DMS faculty. Analyzes Indian and global corporate case studies, SWOT, PESTLE, and long-term sustainable advantage.",
    enrollUrl: "https://onlinecourses.nptel.ac.in/noc24_mg45/preview",
    badge: "🇮🇳 IIT Roorkee MBA",
    rating: 4.8,
    learnersCount: "35,000+",
  },
  {
    id: "swayam_corporate_finance",
    title: "Corporate Finance & Working Capital Management",
    platform: "Swayam / NPTEL (IIT Kharagpur)",
    provider: "IIT Kharagpur, Vinod Gupta School of Management (VGSOM)",
    category: "Finance & Accounting",
    discipline: "MBA / Business & Management",
    duration: "12 Weeks",
    price: "100% Free",
    certificateAvailable: true,
    certificateType: "Official NPTEL Certificate",
    level: "Intermediate to Advanced",
    skills: ["Capital Budgeting", "NPV/IRR", "Working Capital", "Cost of Capital", "Dividend Policy"],
    description: "Flagship finance course for MBA and commerce students from VGSOM IIT Kharagpur. Deep dive into investment appraisal, capital structure, and risk management.",
    enrollUrl: "https://onlinecourses.nptel.ac.in/noc24_mg78/preview",
    badge: "🇮🇳 IIT KGP VGSOM",
    rating: 4.9,
    learnersCount: "48,000+",
  },

  // ─── freeCodeCamp ──────────────────────────────────────────────────────────
  {
    id: "fcc_fullstack_js",
    title: "JavaScript Algorithms and Data Structures Certification",
    platform: "freeCodeCamp",
    provider: "freeCodeCamp Foundation",
    category: "Web Development",
    discipline: "Technical / Engineering",
    duration: "Self-Paced (300 Hours)",
    price: "100% Free",
    certificateAvailable: true,
    certificateType: "freeCodeCamp Verified Certification",
    level: "Beginner to Advanced",
    skills: ["JavaScript", "ES6+", "OOP", "Functional Programming", "Algorithms"],
    description: "World-renowned hands-on interactive coding curriculum. Build 5 major algorithmic projects and earn an industry-recognized free certification.",
    enrollUrl: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/",
    badge: "Free Certification",
    rating: 4.9,
    learnersCount: "500,000+",
  },
  {
    id: "fcc_backend_apis",
    title: "Back End Development and APIs Certification",
    platform: "freeCodeCamp",
    provider: "freeCodeCamp Foundation",
    category: "Backend Development",
    discipline: "Technical / Engineering",
    duration: "Self-Paced (300 Hours)",
    price: "100% Free",
    certificateAvailable: true,
    certificateType: "freeCodeCamp Verified Certification",
    level: "Intermediate",
    skills: ["Node.js", "Express", "MongoDB", "Mongoose", "REST APIs"],
    description: "Build microservices, database-driven web APIs, and production backend services using Node.js, Express, and MongoDB.",
    enrollUrl: "https://www.freecodecamp.org/learn/back-end-development-and-apis/",
    badge: "Free Certification",
    rating: 4.9,
    learnersCount: "250,000+",
  },

  // ─── Google Cloud & Kaggle ────────────────────────────────────────────────
  {
    id: "kaggle_intro_ml",
    title: "Intro to Machine Learning & Deep Learning",
    platform: "Kaggle Learn",
    provider: "Google LLC / Kaggle",
    category: "Machine Learning",
    discipline: "Technical / Engineering",
    duration: "Self-Paced (10 Hours)",
    price: "100% Free",
    certificateAvailable: true,
    certificateType: "Kaggle Skill Badge",
    level: "Beginner",
    skills: ["Scikit-learn", "Machine Learning", "Random Forests", "Pandas", "Model Validation"],
    description: "Hands-on browser-based micro-course taught through real machine learning competitions on Kaggle. Build predictive models from scratch.",
    enrollUrl: "https://www.kaggle.com/learn/intro-to-machine-learning",
    badge: "Google Kaggle",
    rating: 4.8,
    learnersCount: "180,000+",
  },
  {
    id: "google_cloud_skills",
    title: "Google Cloud Fundamentals: Core Infrastructure",
    platform: "Google Cloud Skills Boost",
    provider: "Google Cloud Training",
    category: "Cloud Computing",
    discipline: "Technical / Engineering",
    duration: "Self-Paced (8 Hours)",
    price: "100% Free",
    certificateAvailable: true,
    certificateType: "Google Cloud Badge",
    level: "Beginner",
    skills: ["Google Cloud", "Compute Engine", "Kubernetes", "Cloud Storage", "IAM"],
    description: "Official introduction to computing and storage services available in Google Cloud Platform, including Compute Engine, GKE, and BigQuery.",
    enrollUrl: "https://www.cloudskillsboost.google/course_templates/14",
    badge: "Google Official",
    rating: 4.8,
    learnersCount: "95,000+",
  },

  // ─── Harvard CS50 / edX ────────────────────────────────────────────────────
  {
    id: "harvard_cs50x",
    title: "CS50x: Introduction to Computer Science",
    platform: "Harvard University / edX",
    provider: "Harvard University",
    category: "Computer Science",
    discipline: "Technical / Engineering",
    duration: "12 Weeks (Self-Paced)",
    price: "100% Free to Learn",
    certificateAvailable: true,
    certificateType: "Free Harvard CS50 Certificate upon completion",
    level: "Beginner to Advanced",
    skills: ["C", "Python", "SQL", "Algorithms", "Memory Management", "Flask"],
    description: "The gold standard in computer science education taught by Prof. David J. Malan. Covers foundational algorithms, low-level memory in C, and modern web apps in Python.",
    enrollUrl: "https://cs50.harvard.edu/x/",
    badge: "Harvard University",
    rating: 4.9,
    learnersCount: "4,000,000+",
  },
  {
    id: "harvard_cs50w",
    title: "CS50W: Web Programming with Python and JavaScript",
    platform: "Harvard University / edX",
    provider: "Harvard University",
    category: "Web Development",
    discipline: "Technical / Engineering",
    duration: "12 Weeks (Self-Paced)",
    price: "100% Free to Learn",
    certificateAvailable: true,
    certificateType: "Free Harvard CS50 Certificate",
    level: "Intermediate",
    skills: ["Django", "React", "SQL", "Git", "CI/CD", "Web Security"],
    description: "Deep dive into web application design, database modeling, RESTful APIs, scalability, and automated testing with Django and React.",
    enrollUrl: "https://cs50.harvard.edu/web/",
    badge: "Harvard University",
    rating: 4.9,
    learnersCount: "850,000+",
  }
];

function getFreeCourses(filters = {}) {
  let results = [...FREE_COURSES];

  if (filters.discipline && filters.discipline !== 'All') {
    const d = filters.discipline.toLowerCase();
    results = results.filter(course => course.discipline && course.discipline.toLowerCase().includes(d));
  }

  if (filters.category && filters.category !== 'All') {
    const c = filters.category.toLowerCase();
    results = results.filter(course => course.category.toLowerCase().includes(c));
  }

  if (filters.platform && filters.platform !== 'All') {
    const p = filters.platform.toLowerCase();
    results = results.filter(course => course.platform.toLowerCase().includes(p));
  }

  if (filters.skill) {
    const s = filters.skill.toLowerCase();
    results = results.filter(course => course.skills.some(sk => sk.toLowerCase().includes(s)));
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(course =>
      course.title.toLowerCase().includes(q) ||
      course.provider.toLowerCase().includes(q) ||
      course.platform.toLowerCase().includes(q) ||
      course.category.toLowerCase().includes(q) ||
      course.skills.some(sk => sk.toLowerCase().includes(q))
    );
  }

  return results;
}

module.exports = {
  FREE_COURSES,
  getFreeCourses,
};
