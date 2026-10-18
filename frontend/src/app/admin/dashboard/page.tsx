"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AdminNav from '@/components/AdminNav';
import { API_URL } from '@/lib/api';

interface Stats {
  totalUsers: number;
  totalRecruiters: number;
  totalStudents: number;
  totalJobs: number;
  approvedJobs: number;
  blockedJobs: number;
  approvalRate: number;
  topSkills: { skill: string; count: number }[];
}

export default function AdminDashboardPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/admin/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!token || user?.role !== 'admin') return;
    fetch(`${API_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load stats');
        return res.json();
      })
      .then(data => {
        setStats(data);
        setFetching(false);
      })
      .catch(err => {
        setError(err.message);
        setFetching(false);
      });
  }, [token, user]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Platform Intelligence & Control</h1>
            <p className="text-sm text-slate-400 mt-1">
              Live oversight across AI audits, recruiter accounts, and student verifications.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              AI Pipeline Live
            </span>
            <button
              onClick={() => {
                setFetching(true);
                fetch(`${API_URL}/api/admin/stats`, {
                  headers: { Authorization: `Bearer ${token}` },
                })
                  .then(r => r.json())
                  .then(d => { setStats(d); setFetching(false); })
                  .catch(() => setFetching(false));
              }}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              ↻ Refresh Stats
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
            ⚠️ {error}
          </div>
        )}

        {fetching ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 h-32 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {/* Total Users */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Users</div>
                <div className="text-3xl font-extrabold text-white">{stats.totalUsers}</div>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">🏢 <strong className="text-slate-200">{stats.totalRecruiters}</strong> recruiters</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">🎓 <strong className="text-slate-200">{stats.totalStudents}</strong> students</span>
                </div>
              </div>

              {/* Total Listings */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Job Audits Run</div>
                <div className="text-3xl font-extrabold text-blue-400">{stats.totalJobs}</div>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                  <span className="text-emerald-400">✅ {stats.approvedJobs} Approved</span>
                  <span>·</span>
                  <span className="text-rose-400">🚫 {stats.blockedJobs} Blocked</span>
                </div>
              </div>

              {/* Approval Rate */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">AI Pipeline Pass Rate</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{stats.approvalRate}%</span>
                  <span className="text-xs text-slate-400 font-normal">of submissions</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-3.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-emerald-400 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${stats.approvalRate}%` }}
                  />
                </div>
              </div>

              {/* Scam Shield */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Scams & Fake Listings Prevented</div>
                <div className="text-3xl font-extrabold text-rose-400">{stats.blockedJobs}</div>
                <p className="text-xs text-slate-400 mt-3">
                  100% of students shielded from unverified predatory postings.
                </p>
              </div>
            </div>

            {/* Platform Management Cards + Top Skills */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Quick Actions Column */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>⚡</span> Governance Portals
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Link
                    href="/admin/recruiters"
                    className="p-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 rounded-2xl transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
                      🏢
                    </div>
                    <h3 className="font-bold text-white text-base">Recruiters</h3>
                    <p className="text-xs text-slate-400 mt-1 mb-3">
                      Review company registrations, legal docs & approval status.
                    </p>
                    <span className="text-xs font-semibold text-blue-400 group-hover:underline">
                      Manage Recruiters ({stats.totalRecruiters}) →
                    </span>
                  </Link>

                  <Link
                    href="/admin/students"
                    className="p-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/50 rounded-2xl transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
                      🎓
                    </div>
                    <h3 className="font-bold text-white text-base">Students</h3>
                    <p className="text-xs text-slate-400 mt-1 mb-3">
                      Inspect ID cards, Rekognition face match & liveness logs.
                    </p>
                    <span className="text-xs font-semibold text-purple-400 group-hover:underline">
                      Verify Students ({stats.totalStudents}) →
                    </span>
                  </Link>

                  <Link
                    href="/admin/jobs"
                    className="p-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-2xl transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
                      🛡️
                    </div>
                    <h3 className="font-bold text-white text-base">Audit Pipeline</h3>
                    <p className="text-xs text-slate-400 mt-1 mb-3">
                      View all listings, AI findings, and override block status.
                    </p>
                    <span className="text-xs font-semibold text-emerald-400 group-hover:underline">
                      Inspect Listings ({stats.totalJobs}) →
                    </span>
                  </Link>
                </div>

                {/* Subsystem Architecture Status */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-4">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4 text-slate-400">
                    System Services Status
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <div className="text-slate-400">AI Inspector</div>
                      <div className="font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Gemini Flash
                      </div>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <div className="text-slate-400">Database</div>
                      <div className="font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        MongoDB Atlas
                      </div>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <div className="text-slate-400">AWS Services</div>
                      <div className="font-bold text-blue-400 mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        Comprehend/Rekog
                      </div>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <div className="text-slate-400">Notifications</div>
                      <div className="font-bold text-indigo-400 mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        Nodemailer
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Skills In Demand */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <span>📈</span> Trending Skills
                </h2>
                <p className="text-xs text-slate-400 mb-4">Extracted by AI from verified listings</p>

                {stats.topSkills && stats.topSkills.length > 0 ? (
                  <div className="space-y-3 flex-1 flex flex-col justify-center">
                    {stats.topSkills.map((item, idx) => (
                      <div key={item.skill} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-slate-500 font-mono font-bold">#{idx + 1}</span>
                          <span className="font-medium text-slate-200 capitalize">{item.skill}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                          {item.count} jobs
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                    No skills tracked yet. Approved listings will automatically aggregate here.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
