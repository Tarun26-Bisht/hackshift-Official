/**
 * Company profile field weights — total = 100
 */
const PROFILE_WEIGHTS = {
  legalName: 8,
  brandName: 3,
  companyType: 5,
  industry: 5,
  foundedYear: 3,
  companySize: 4,
  description: 8,
  website: 8,
  linkedIn: 6,
  twitter: 2,
  github: 2,
  country: 5,
  registrationNumber: 8,
  gstOrTaxId: 5,
  'address.street': 3,
  'address.city': 4,
  'address.state': 3,
  'address.pincode': 3,
  hrName: 5,
  hrDesignation: 3,
  hrPhone: 4,
  hrEmail: 5,
  logoUrl: 5,
  incorporationCertUrl: 6,
};

/**
 * Job listing field weights — total = 100
 */
const JOB_WEIGHTS = {
  title: 15,
  description: 20,
  salary: 12,
  duration: 10,
  jobType: 8,
  location: 8,
  contactEmail: 10,
  link: 10,
  skills: 7,
};

function calculateProfileCompleteness(profile) {
  let score = 0;
  for (const [field, weight] of Object.entries(PROFILE_WEIGHTS)) {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (profile[parent]?.[child]) score += weight;
    } else {
      if (profile[field]) score += weight;
    }
  }
  return Math.min(100, Math.round(score));
}

function calculateJobCompleteness(jobData) {
  let score = 0;
  for (const [field, weight] of Object.entries(JOB_WEIGHTS)) {
    const val = jobData[field];
    if (field === 'skills') {
      if (Array.isArray(val) && val.length > 0) score += weight;
      else if (typeof val === 'string' && val.trim()) score += weight;
    } else if (val && String(val).trim()) {
      score += weight;
    }
  }
  return Math.min(100, Math.round(score));
}

function getProfileMissingFields(profile) {
  const missing = [];
  const labels = {
    legalName: 'Legal Company Name', description: 'Company Description',
    website: 'Website', linkedIn: 'LinkedIn Page',
    country: 'Country', registrationNumber: 'Registration Number',
    hrName: 'HR Contact Name', hrEmail: 'HR Email',
    logoUrl: 'Company Logo', incorporationCertUrl: 'Incorporation Certificate',
  };
  for (const [field, label] of Object.entries(labels)) {
    if (!profile[field]) missing.push(label);
  }
  return missing;
}

/**
 * Student profile field weights — total = 100
 */
const STUDENT_WEIGHTS = {
  fullName: 10,
  collegeName: 10,
  course: 8,
  yearOfStudy: 5,
  rollNumber: 7,
  city: 5,
  state: 5,
  phone: 8,
  linkedIn: 7,
  github: 5,
  bio: 5,
  idCardUrl: 15,
  facePhotoUrl: 10,
};

function calculateStudentCompleteness(profile) {
  let score = 0;
  for (const [field, weight] of Object.entries(STUDENT_WEIGHTS)) {
    if (profile[field]) score += weight;
  }
  return Math.min(100, Math.round(score));
}

function getStudentMissingFields(profile) {
  const labels = {
    fullName: 'Full Name', collegeName: 'College Name', course: 'Course',
    rollNumber: 'Roll Number', phone: 'Phone Number',
    idCardUrl: 'College ID Card', facePhotoUrl: 'Face Photo',
  };
  return Object.entries(labels).filter(([f]) => !profile[f]).map(([, l]) => l);
}

module.exports = { calculateProfileCompleteness, calculateJobCompleteness, getProfileMissingFields, calculateStudentCompleteness, getStudentMissingFields };
