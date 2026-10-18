# All-India Government Free Internships, Student Courses Hub, ID & Video Verification, and Dark Form Styling Plan

## Goal
Implement:
1. **High-Contrast Dark Form Inputs**: Ensure all text typed into forms, placeholders, and borders across the entire app are dark (#111827 / text-gray-900), sharp, and highly legible.
2. **All-India Government Free Internships API & UI**: Curate and expose central government schemes (PM Internship Scheme, AICTE, Digital India MeitY, TULIP, NITI Aayog, NATS) with stipend details, 100/100 trust scores, and direct portal links.
3. **Student-Only Free Courses Hub**: 100% free course catalog (Swayam/NPTEL, freeCodeCamp, Google Cloud, Kaggle, CS50) strictly restricted to authenticated students.
4. **Student College ID Card & Video Verification**: Verify student via College ID Card upload + real-time webcam video gesture challenge, updating platform-wide verification status (`User.isVerified`).

---

## Step-by-Step Implementation Steps

### Step 1: Dark Form Inputs
- `frontend/src/app/globals.css`: Base CSS reset for input, textarea, select.
- `frontend/src/app/login/page.tsx`: Explicit text-gray-900, border-gray-300 styling.
- `frontend/src/app/signup/page.tsx`: Explicit text-gray-900 on all fields.
- `frontend/src/app/student/onboarding/page.tsx`: Update Field helper and selects.
- `frontend/src/app/recruiter/onboarding/page.tsx`: Update Field helper and selects.
- `frontend/src/app/post-job/page.tsx`: Update all job posting inputs.

### Step 2: All-India Government Free Internships
- `backend/src/services/governmentInternships.js`: Catalog of central schemes.
- `backend/src/routes/jobs.js`: `GET /api/jobs/government-internships`.
- `frontend/src/app/page.tsx`: Filter tab for Govt Internships.
- `frontend/src/app/student/dashboard/page.tsx`: Govt Internships widget.

### Step 3: Student-Only Free Courses Hub
- `backend/src/services/freeCourses.js`: Catalog of verified free courses.
- `backend/src/routes/courses.js`: Protected route `GET /api/student/courses`.
- `backend/src/index.js`: Register courses router.
- `frontend/src/app/student/courses/page.tsx`: Student courses page.
- `frontend/src/components/Navbar.tsx`: Student courses nav link.

### Step 4: Student ID Card & Video Verification
- `backend/src/routes/student.js`: Auto-verify `User.isVerified = true` when ID card + video liveness pass.
- `frontend/src/app/student/onboarding/page.tsx`: High-clarity ID card & video review.
- `frontend/src/app/admin/students/page.tsx`: Admin ID & video inspection modal.

### Step 5: Verification & Quality Assurance
- Automated curl tests for API endpoints.
- Next.js full production build verification (`npm run build`).
