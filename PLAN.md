# TrustBridge — Scam-Free Education & Job Platform

## What We're Building

A platform where startups, companies, and HRs post jobs/internships.
Every listing goes through an AI audit pipeline before students can see it.
Students also get skill gap insights and course recommendations based on trending job skills.

---

## Core Features

### 1. Job/Internship Submission (Company/HR Side)
- A form where employers fill in: title, company, description, skills, salary, duration, job type, location, contact email, and a link
- On submit → hits `POST /api/jobs/audit`

### 2. AI Audit Pipeline (Backend)
- **Google Gemini AI** analyzes the description for:
  - Skills extracted
  - Missing fields (salary, duration, job_type, location, contact_email)
  - Scam markers (predatory language, unrealistic promises, vague description)
  - Professionalism score (0–10)
  - `isLikelyScam` boolean
- **Link Validator** — checks if the provided URL is reachable
- **TrustScore Engine** — calculates a score (0–100):
  - Professionalism score contributes 30 pts
  - Each missing field deducts 10 pts
  - Scam markers deduct 5 pts each
  - `isLikelyScam` deducts 50 pts
  - Broken/missing link deducts 40 pts
  - Generic email (gmail/yahoo) deducts 10 pts
  - Missing email deducts 15 pts
- **Decision**:
  - Score ≥ 40 AND not a scam → `approved` ✅
  - Score < 40 OR scam detected → `blocked` 🚫

### 3. Job Listings Page (Student Side)
- Shows only `approved` jobs in a card grid
- Each card shows: title, company, trust score badge, skills, salary, duration, link

### 4. Skill Trends Dashboard
- Tracks skills from all approved listings
- Shows top 10 trending skills in the last 14 days (bar chart)

### 5. Course Recommendations
- Based on top 3 trending skills
- Shows free + paid courses (YouTube, Udemy, Coursera, LinkedIn Learning)

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Node.js, Express.js 5 |
| AI | Google Gemini 1.5 Flash |
| HTTP Client | Axios |
| Storage | In-memory (hackathon scope) |

---

## Project Structure

```
harkathon/
├── backend/
│   └── src/
│       ├── index.js                  ✅ exists
│       ├── routes/
│       │   └── jobs.js               ✅ exists
│       └── services/
│           ├── aiInspector.js        ✅ exists
│           ├── trustScore.js         ✅ exists
│           └── education.js          ✅ exists
│
└── frontend/
    └── src/
        ├── app/
        │   ├── layout.tsx            ✅ exists
        │   ├── page.tsx              ✅ exists (job listings)
        │   ├── post-job/
        │   │   └── page.tsx          ❌ to build (job submission form)
        │   ├── trends/
        │   │   └── page.tsx          ❌ to build (skill trends + courses)
        │   └── globals.css           ✅ exists
        └── components/
            ├── Navbar.tsx            ❌ to build
            ├── JobCard.tsx           ❌ to build
            ├── TrustBadge.tsx        ❌ to build
            ├── SkillTrendsChart.tsx  ❌ to build
            └── CourseCard.tsx        ❌ to build
```

---

## Build Steps

### Step 1 — Backend `.env` setup
- Create `backend/.env` with `GEMINI_API_KEY` and `PORT`

### Step 2 — Frontend Components
- `Navbar.tsx` — nav with links to Home, Post a Job, Trends
- `TrustBadge.tsx` — colored badge showing trust score
- `JobCard.tsx` — card showing job details + trust badge
- `CourseCard.tsx` — card showing course title, platform, price, link

### Step 3 — Job Submission Page (`/post-job`)
- Form with all fields
- Calls `POST /api/jobs/audit`
- Shows audit result: trust score, AI findings, approved/blocked status

### Step 4 — Trends & Recommendations Page (`/trends`)
- Fetches `GET /api/jobs/trends` → renders bar chart of top skills
- Fetches `GET /api/jobs/recommendations` → renders course cards per skill

### Step 5 — Polish Home Page
- Improve `page.tsx` to show trust score on each card
- Add empty state and loading skeleton

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/jobs/audit` | Submit + audit a job listing |
| GET | `/api/jobs/listings` | Get all approved listings |
| GET | `/api/jobs/trends` | Get top 10 trending skills |
| GET | `/api/jobs/recommendations` | Get courses for top 3 skills |
| GET | `/health` | Health check |

---

## TrustScore Breakdown

| Factor | Impact |
|---|---|
| Professionalism (AI) | Up to +30 pts |
| Missing fields | -10 pts each |
| Scam markers | -5 pts each |
| isLikelyScam = true | -50 pts |
| Broken link | -40 pts |
| Generic email | -10 pts |
| No email | -15 pts |

Score ≥ 40 → Approved ✅  
Score < 40 or scam → Blocked 🚫
