"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import TrustBadge from '@/components/TrustBadge';
import { DashboardSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';
import { API_URL } from '@/lib/api';

export default function RecruiterDashboard() {
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
      } else if (user.role !== 'recruiter') {
        window.location.href = user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`${API_URL}/api/company/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_URL}/api/jobs/my-listings`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([companyData, jobsData]) => {
      setProfile(companyData?.profile || null);
      setMissingFields(companyData?.missingFields || []);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setFetching(false);
    }).catch(() => setFetching(false));
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
  const scoreColor = score >= 60 ? 'text-green-600' : score >= 30 ? 'text-yellow-500' : 'text-red-500';
  const barColor = score >= 60 ? 'bg-green-500' : score >= 30 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-12">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Recruiter Dashboard</h1>
              <p className="text-gray-500 mt-1">
                {user.name} {profile?.legalName && `· ${profile.legalName}`}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/post-job" className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                + Post a Job
              </Link>
              <button onClick={logout} className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-100">
                Logout
              </button>
            </div>
          </div>

          {/* Profile Completeness Card */}
          <div className={`rounded-2xl border p-6 mb-8 ${score >= 60 ? 'bg-white border-gray-100' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-gray-800 text-lg">Company Profile Completeness</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {score >= 60 ? 'Great! Your profile meets the minimum requirement.' : 'Complete your profile to build trust with students.'}
                </p>
              </div>
              <span className={`text-4xl font-extrabold ${scoreColor}`}>{score}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
              <div className={`h-3 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${score}%` }} />
            </div>

            {/* Milestones */}
            <div className="flex gap-6 text-xs text-gray-400 mb-4">
              {[{ pct: 30, label: 'Basic' }, { pct: 60, label: 'Good ✓' }, { pct: 80, label: 'Strong' }, { pct: 100, label: 'Complete' }].map(m => (
                <div key={m.pct} className={`flex flex-col items-center ${score >= m.pct ? 'text-green-600 font-semibold' : ''}`}>
                  <span>{m.pct}%</span>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>

            {/* Missing fields */}
            {missingFields.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Missing fields:</p>
                <div className="flex flex-wrap gap-2">
                  {missingFields.map(f => (
                    <span key={f} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
            )}

            <Link href="/recruiter/onboarding" className="inline-block text-sm font-semibold text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
              {score === 0 ? 'Start Company Profile →' : 'Complete Profile →'}
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <StatCard label="Total Posted" value={jobs.length} />
            <StatCard label="Approved" value={jobs.filter(j => j.status === 'approved').length} color="text-green-600" />
            <StatCard label="Blocked" value={jobs.filter(j => j.status === 'blocked').length} color="text-red-500" />
          </div>

          {/* Listings */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 text-xl">Your Listings</h2>
            <Link href="/post-job" className="text-sm text-blue-600 hover:underline">+ Add new</Link>
          </div>

          {fetching ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 h-20 animate-pulse flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-48" />
                    <div className="h-3 bg-gray-100 rounded w-32" />
                  </div>
                  <div className="h-7 w-24 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-400 mb-3">No listings yet.</p>
              <Link href="/post-job" className="text-blue-600 text-sm font-semibold hover:underline">Post your first job →</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {jobs.map(job => (
                <div key={job._id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{job.title}</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {job.auditCount > 1 && ` · Audit #${job.auditCount}`}
                    </p>
                    {job.status === 'blocked' && job.blockReason && (
                      <p className="text-xs text-red-500 mt-1">🚫 {job.blockReason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <TrustBadge score={job.trustScore} />
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      job.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {job.status}
                    </span>
                    {job.status === 'blocked' && (
                      <Link href={`/post-job?reaudit=${job._id}`} className="text-xs text-blue-600 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50">
                        Fix & Resubmit
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </ErrorBoundary>
  );
}

function StatCard({ label, value, color = 'text-gray-900' }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-extrabold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
