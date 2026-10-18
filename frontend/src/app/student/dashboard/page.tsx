"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import JobCard from '@/components/JobCard';
import JobCardSkeleton from '@/components/JobCardSkeleton';
import { DashboardSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';
import { API_URL } from '@/lib/api';

export default function StudentDashboard() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = '/login';
      } else if (user.role !== 'student') {
        window.location.href = user.role === 'admin' ? '/admin/dashboard' : '/recruiter/dashboard';
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/student/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(studentData => {
        const p = studentData?.profile || null;
        setProfile(p);
        setMissingFields(studentData?.missingFields || []);
        const courseParam = p?.course ? `&course=${encodeURIComponent(p.course)}` : '';
        return fetch(`${API_URL}/api/jobs/listings?sortBy=closing_soon${courseParam}`);
      })
      .then(r => r.json())
      .then(jobsData => {
        setJobs(Array.isArray(jobsData) ? jobsData : (jobsData?.jobs || []));
        setFetching(false);
      })
      .catch(() => setFetching(false));
  }, [token]);

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <DashboardSkeleton />
      </main>
    );
  }

  const score = profile?.completenessScore || 0;
  const isVerified = profile?.livenessVerified && profile?.idCardUrl;
  const barColor = score >= 60 ? 'bg-green-500' : score >= 30 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-12">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              {profile?.facePhotoUrl ? (
                <img src={`${API_URL}${profile.facePhotoUrl}`} alt="face" className="w-14 h-14 rounded-full object-cover border-2 border-blue-400" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl">🎓</div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-gray-900">
                    {profile?.fullName || user?.name || user?.email || 'Student'}
                  </h1>
                  {isVerified && (
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">✅ Verified</span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mt-0.5">
                  {profile?.collegeName && `${profile.collegeName}`}
                  {profile?.course && ` · ${profile.course}`}
                  {profile?.yearOfStudy && ` · ${profile.yearOfStudy}`}
                </p>
              </div>
            </div>
            <button onClick={logout} className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-100">
              Logout
            </button>
          </div>

          {/* Profile Completeness */}
          <div className={`rounded-2xl border p-6 mb-8 ${score >= 60 ? 'bg-white border-gray-100' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-gray-800">Profile Completeness</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {score >= 60 ? 'Your profile is looking great!' : 'Complete your profile to stand out to recruiters.'}
                </p>
              </div>
              <span className={`text-3xl font-extrabold ${score >= 60 ? 'text-green-600' : 'text-yellow-500'}`}>{score}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
              <div className={`h-2.5 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${score}%` }} />
            </div>

            {/* Verification status pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              <StatusPill label="Face Verified" done={!!profile?.livenessVerified} />
              <StatusPill label="ID Card" done={!!profile?.idCardUrl} />
              <StatusPill label="College Info" done={!!(profile?.collegeName && profile?.course)} />
              <StatusPill label="Contact Info" done={!!(profile?.phone)} />
            </div>

            {missingFields.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-1">Missing:</p>
                <div className="flex flex-wrap gap-1">
                  {missingFields.map(f => <span key={f} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{f}</span>)}
                </div>
              </div>
            )}

            <Link href="/student/onboarding" className="inline-block text-sm font-semibold text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
              {score === 0 ? 'Complete Your Profile →' : 'Update Profile →'}
            </Link>
          </div>

          {/* Quick Links Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <Link href="/?jobType=Government+Internship" className="bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-xl p-5 hover:shadow-lg transition-all shadow-sm">
              <span className="text-2xl mb-1 block">🇮🇳</span>
              <p className="text-lg font-bold">Govt Free Internships</p>
              <p className="text-orange-100 text-xs mt-1">PM Internship Scheme & AICTE (Stipend ₹5,000+)</p>
            </Link>
            <Link href="/student/courses" className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl p-5 hover:shadow-lg transition-all shadow-sm">
              <span className="text-2xl mb-1 block">🎓</span>
              <p className="text-lg font-bold">Free Courses Hub</p>
              <p className="text-blue-100 text-xs mt-1">Swayam, NPTEL, freeCodeCamp (Student Exclusive)</p>
            </Link>
            <Link href="/trends" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all shadow-sm">
              <span className="text-2xl mb-1 block">📈</span>
              <p className="text-lg font-bold text-gray-900">Skill Trends</p>
              <p className="text-gray-500 text-xs mt-1">Top demanded skills in verified listings</p>
            </Link>
          </div>

          {/* Urgent Deadlines Section */}
          {!fetching && jobs.filter(j => typeof j.daysLeft === 'number' && j.daysLeft >= 0 && j.daysLeft <= 5).length > 0 && (
            <div className="mb-10 bg-gradient-to-r from-red-50/80 via-amber-50/70 to-orange-50/60 border border-amber-200 rounded-2xl p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⏰</span>
                    <h2 className="text-lg font-black text-gray-900">
                      Urgent Deadlines {profile?.course ? `for ${profile.course} Students` : ''}
                    </h2>
                    <span className="bg-red-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full animate-pulse">
                      {jobs.filter(j => typeof j.daysLeft === 'number' && j.daysLeft >= 0 && j.daysLeft <= 5).length} Closing Soon
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    These openings close within 5 days! 1-day left roles are prioritized first so you never miss an application.
                  </p>
                </div>
                <Link
                  href="/?sortBy=closing_soon"
                  className="text-xs font-bold text-red-700 hover:text-red-800 underline self-start sm:self-auto"
                >
                  View All Urgent Deadlines →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs
                  .filter(j => typeof j.daysLeft === 'number' && j.daysLeft >= 0 && j.daysLeft <= 5)
                  .slice(0, 3)
                  .map(job => (
                    <JobCard key={`urgent-${job._id || job.id}`} job={job} />
                  ))}
              </div>
            </div>
          )}

          {/* Job Listings */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 text-xl">Verified Listings ({jobs.length})</h2>
          </div>

          {fetching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <JobCardSkeleton key={i} />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-400">No verified listings yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map(job => <JobCard key={job._id || job.id} job={job} />)}
            </div>
          )}
        </div>
      </main>
    </ErrorBoundary>
  );
}

function StatusPill({ label, done }: { label: string; done: boolean }) {
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
      {done ? '✓' : '○'} {label}
    </span>
  );
}
