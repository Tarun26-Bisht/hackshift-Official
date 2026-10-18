/**
 * All-India Government Free Internships Service
 * Curates verified Central & State Government internship schemes
 * Zero fees, verified portals, official stipends, and 100/100 trust scores.
 */

const GOVERNMENT_INTERNSHIPS = [
  {
    _id: "gov_pmis_2026",
    id: "gov_pmis_2026",
    title: "Prime Minister's Internship Scheme (PMIS) 2026",
    companyName: "Ministry of Corporate Affairs (Govt. of India)",
    organization: "Central Government — Top 500 Companies",
    schemeCode: "PMIS-MCA",
    ministry: "Ministry of Corporate Affairs",
    location: "Pan-India (Multiple Locations & Dist. HQs)",
    jobType: "Government Internship",
    duration: "12 Months",
    salary: "₹5,000/month + ₹6,000 one-time grant",
    description: "Flagship Central Government initiative providing 12-month real-world professional training in top 500 Indian corporations (Tata, Reliance, L&T, Infosys, Mahindra). Full monthly stipend of ₹5,000 (₹4,500 Govt + ₹500 CSR) plus an upfront ₹6,000 incidental grant. Zero application fee.",
    skills: ["Operations", "Business Administration", "Technical Assistance", "Digital Tools", "Customer Operations"],
    eligibility: "Indian youth aged 21–24 years. Passed 10th, 12th, ITI, Polytechnic Diploma, or Graduation (BA, B.Sc, B.Com, BCA, BBA, B.Pharma).",
    trustScore: 100,
    isGovernment: true,
    isFree: true,
    applicationFee: "₹0 (Free)",
    verifiedBadge: "🇮🇳 Govt of India Official",
    link: "https://pminternship.mca.gov.in",
    portalName: "pminternship.mca.gov.in",
    status: "approved",
    deadline: "Rolling Admissions 2026",
  },
  {
    _id: "gov_aicte_nip_2026",
    id: "gov_aicte_nip_2026",
    title: "AICTE National Internship Opportunities (ISRO, DRDO, NHAI)",
    companyName: "All India Council for Technical Education (AICTE)",
    organization: "Ministry of Education, Govt. of India",
    schemeCode: "AICTE-NIP",
    ministry: "Ministry of Education",
    location: "Pan-India & Remote",
    jobType: "Technical Internship",
    duration: "2 to 6 Months",
    salary: "₹10,000 – ₹25,000/month",
    description: "Official portal under the Ministry of Education connecting engineering, management, and technical students with premier research bodies (ISRO, DRDO, CSIR) and central infrastructure agencies (NHAI). Projects range from satellite payload systems to AI road safety architectures.",
    skills: ["Python", "Machine Learning", "Embedded Systems", "CAD/GIS", "Cloud Computing"],
    eligibility: "Enrolled in or graduated from AICTE-approved technical institutions (B.Tech / B.E / MCA / M.Tech / Diploma).",
    trustScore: 100,
    isGovernment: true,
    isFree: true,
    applicationFee: "₹0 (Free)",
    verifiedBadge: "🇮🇳 AICTE Verified",
    link: "https://internship.aicte-india.org",
    portalName: "internship.aicte-india.org",
    status: "approved",
    deadline: "Active Cycles",
  },
  {
    _id: "gov_meity_digital_india",
    id: "gov_meity_digital_india",
    title: "Digital India Internship Scheme 2026",
    companyName: "Ministry of Electronics & IT (MeitY)",
    organization: "Government of India",
    schemeCode: "MEITY-DIIS",
    ministry: "Ministry of Electronics and Information Technology",
    location: "New Delhi / Hybrid",
    jobType: "Research & Development",
    duration: "2 Months (Extendable to 3)",
    salary: "₹10,000/month",
    description: "Hands-on exposure to national-scale digital infrastructure including Aadhaar architectures, DigiLocker, UPI standards, Cyber Security emergency response (CERT-In), and IndiaAI mission projects. Certificate signed by Joint Secretary, MeitY.",
    skills: ["Cyber Security", "Artificial Intelligence", "Data Analytics", "Cloud Architecture", "Public Policy"],
    eligibility: "Indian students pursuing B.E/B.Tech (CSE, IT, ECE), MCA, MSc (CS/IT), or LLB (Cyber Law) with minimum 60% cumulative marks.",
    trustScore: 100,
    isGovernment: true,
    isFree: true,
    applicationFee: "₹0 (Free)",
    verifiedBadge: "🇮🇳 MeitY Official",
    link: "https://www.meity.gov.in/internship-scheme",
    portalName: "meity.gov.in/internship-scheme",
    status: "approved",
    deadline: "Annual Cohorts (May–July & Oct–Dec)",
  },
  {
    _id: "gov_tulip_mohua",
    id: "gov_tulip_mohua",
    title: "The Urban Learning Internship Program (TULIP)",
    companyName: "Ministry of Housing & Urban Affairs & AICTE",
    organization: "Smart Cities Mission / MoHUA",
    schemeCode: "MOHUA-TULIP",
    ministry: "Ministry of Housing and Urban Affairs",
    location: "100+ Smart Cities across India",
    jobType: "Urban Governance",
    duration: "8 Weeks to 1 Year",
    salary: "₹8,000 – ₹15,000/month",
    description: "Unique platform for fresh graduates to work on high-impact urban infrastructure: Smart Water Grids, Intelligent Traffic Management, Geographic Information Systems (GIS), and Sustainable Municipal Waste operations across India's Smart Cities.",
    skills: ["Urban Planning", "GIS Mapping", "Civil Engineering", "Data Analytics", "Environmental Science"],
    eligibility: "Indian citizens who graduated with B.Tech / B.Arch / B.Plan / BCA / BBA within the last 18 months of application date.",
    trustScore: 100,
    isGovernment: true,
    isFree: true,
    applicationFee: "₹0 (Free)",
    verifiedBadge: "🇮🇳 MoHUA Smart Cities",
    link: "https://internship.aicte-india.org/tulip/",
    portalName: "internship.aicte-india.org/tulip",
    status: "approved",
    deadline: "Open All Year",
  },
  {
    _id: "gov_niti_aayog",
    id: "gov_niti_aayog",
    title: "NITI Aayog Policy & Research Internship",
    companyName: "NITI Aayog (Govt. of India Policy Think Tank)",
    organization: "Prime Minister's Policy Council",
    schemeCode: "NITI-INTERN",
    ministry: "NITI Aayog",
    location: "New Delhi (Sansad Marg)",
    jobType: "Policy & Economic Research",
    duration: "6 Weeks to 6 Months",
    salary: "Official Govt Experience & Certificate",
    description: "Prestigious internship working directly with NITI Aayog Verticals (AI & Frontier Tech, Economics, Agriculture, Health & Nutrition, Green Hydrogen). Interns contribute to policy briefs, evaluation studies, and pilot governance models.",
    skills: ["Policy Analysis", "Econometrics", "Technical Research", "Report Writing", "Data Visualization"],
    eligibility: "Undergraduate students who completed 2nd year examinations with min 85%, or Postgraduate students with min 70% in graduation.",
    trustScore: 100,
    isGovernment: true,
    isFree: true,
    applicationFee: "₹0 (Free)",
    verifiedBadge: "🇮🇳 NITI Aayog Verified",
    link: "https://www.niti.gov.in/internship",
    portalName: "niti.gov.in/internship",
    status: "approved",
    deadline: "1st to 10th of every calendar month",
  },
  {
    _id: "gov_nats_apprentice",
    id: "gov_nats_apprentice",
    title: "National Apprenticeship Training Scheme (NATS)",
    companyName: "Board of Apprenticeship Training (Ministry of Education)",
    organization: "Central Public Sector Enterprises (PSUs)",
    schemeCode: "NATS-MHRD",
    ministry: "Ministry of Education",
    location: "Pan-India (PSUs & Central Units)",
    jobType: "Govt Apprenticeship",
    duration: "1 Year",
    salary: "₹9,000 – ₹15,000/month",
    description: "Statutory apprenticeship under the Apprentices Act in leading Central PSUs (BHEL, IOCL, ONGC, NTPC, HAL, Railways). Hands-on technical exposure with 50% stipend funded directly by Central Government DBT (Direct Benefit Transfer).",
    skills: ["Industrial Automation", "Electrical Engineering", "Mechanical QA", "Computer Operations", "Database Admin"],
    eligibility: "Diploma or Degree holders in Engineering, Technology, or General Streams (B.Sc, B.Com, B.A) graduating in the last 3 years.",
    trustScore: 100,
    isGovernment: true,
    isFree: true,
    applicationFee: "₹0 (Free)",
    verifiedBadge: "🇮🇳 Govt of India NATS",
    link: "https://nats.education.gov.in",
    portalName: "nats.education.gov.in",
    status: "approved",
    deadline: "Ongoing All Year",
  }
];

function getAllGovernmentInternships(filters = {}) {
  let results = [...GOVERNMENT_INTERNSHIPS];

  if (filters.ministry) {
    const m = filters.ministry.toLowerCase();
    results = results.filter(i => i.ministry.toLowerCase().includes(m) || i.companyName.toLowerCase().includes(m));
  }

  if (filters.skill) {
    const s = filters.skill.toLowerCase();
    results = results.filter(i => i.skills.some(sk => sk.toLowerCase().includes(s)));
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.companyName.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.skills.some(sk => sk.toLowerCase().includes(q))
    );
  }

  return results;
}

module.exports = {
  GOVERNMENT_INTERNSHIPS,
  getAllGovernmentInternships,
};
