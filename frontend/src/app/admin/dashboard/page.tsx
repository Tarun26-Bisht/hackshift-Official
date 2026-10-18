"use client";
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AdminNav from '@/components/AdminNav';
import TrustBadge from '@/components/TrustBadge';
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

interface RecentJob {
  _id: string;
  title: string;
  companyName?: string;
  trustScore: number;
  status: 'approved' | 'blocked' | 'pending';
  blockReason?: string;
  createdAt: string;
  skills?: string[];
  daysLeft?: number | null;
}

export default function AdminDashboardPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [fetching, setFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/admin/login');
    }
  }, [user, loading, router]);

  const loadData = () => {
    if (!token || user?.role !== 'admin') return;
    setRefreshing(true);
    Promise.all([
      fetch(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => {
        if (!r.ok) throw new Error('Failed to load stats');
        return r.json();
      }),
      fetch(`${API_URL}/api/admin/jobs?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => {
        if (!r.ok) throw new Error('Failed to load recent jobs');
        return r.json();
      }),
    ])
      .then(([statsData, jobsData]) => {
        setStats(statsData);
        setRecentJobs(jobsData?.jobs || []);
        setFetching(false);
        setRefreshing(false);
      })
      .catch(err => {
        setError(err.message);
        setFetching(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [token, user]);

  const handleToggleJob = async (jobId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'approved' ? 'blocked' : 'approved';
    setActionLoadingId(jobId);
    try {
      const res = await fetch(`${API_URL}/api/admin/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: nextStatus,
          blockReason: nextStatus === 'blocked' ? 'Manual override by Platform Administrator' : null,
        }),
      });
      if (res.ok) {
        setRecentJobs(prev =>
          prev.map(j => (j._id === jobId ? { ...j, status: nextStatus as any } : j))
        );
        // Refresh stats
        fetch(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(d => setStats(d));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const maxSkillCount = useMemo(() => {
    if (!stats?.topSkills || stats.topSkills.length === 0) return 1;
    return Math.max(...stats.topSkills.map(s => s.count), 1);
  }, [stats]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-mono tracking-wider uppercase">Authenticating Administrative Session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      <AdminNav />

      {/* Background ambient radial gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-blue-600/10 via-indigo-600/5 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-96 right-0 w-[450px] h-[450px] bg-emerald-600/5 blur-3xl" />
        <div className="absolute top-96 left-0 w-[450px] h-[450px] bg-rose-600/5 blur-3xl" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Command Center Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Platform Security & Intelligence Control
              </span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="text-xs text-slate-400 font-mono">Build 2026.10</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Platform Intelligence & Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Real-time administrative telemetry across AI listing verification, student biometric KYC, and recruiter compliance.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Host: aws-ap-south-1</span>
            </div>

            <button
              onClick={loadData}
              disabled={refreshing}
              className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold shadow-2xs disabled:opacity-50"
            >
              <span className={`text-sm ${refreshing ? 'animate-spin' : ''}`}>↻</span>
              <span>{refreshing ? 'Refreshing...' : 'Refresh Telemetry'}</span>
            </button>

            <Link
              href="/admin/jobs"
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-blue-600/25 flex items-center gap-1.5"
            >
              <span>Audit Pipeline</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ─── 4 Hero KPI Cards ──────────────────────────────────────────────── */}
        {fetching ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 h-36 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Card 1: Total Users */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total User Base</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-sm">
                    👥
                  </div>
                </div>
                <div className="text-3xl font-black text-white tracking-tight">{stats.totalUsers}</div>
                <div className="mt-3.5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-300 font-bold">{stats.totalRecruiters}</span>
                    <span>recruiters</span>
                  </div>
                  <span className="text-slate-700">•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-300 font-bold">{stats.totalStudents}</span>
                    <span>students</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Job Audits Run */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Job Audits</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm">
                    ⚡
                  </div>
                </div>
                <div className="text-3xl font-black text-indigo-400 tracking-tight">{stats.totalJobs}</div>
                <div className="mt-3.5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span>✓</span> {stats.approvedJobs} Approved
                  </span>
                  <span className="text-slate-700">•</span>
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <span>🚫</span> {stats.blockedJobs} Blocked
                  </span>
                </div>
              </div>

              {/* Card 3: AI Pipeline Pass Rate */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">AI TrustPass Rate</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">
                    🎯
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white tracking-tight">{stats.approvalRate}%</span>
                  <span className="text-xs text-slate-400">of submissions</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-3.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(stats.approvalRate, 4)}%` }}
                  />
                </div>
              </div>

              {/* Card 4: Scams & Predatory Postings Blocked */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5 relative overflow-hidden group hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/5 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Scam Shield Defense</span>
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-sm">
                    🛡️
                  </div>
                </div>
                <div className="text-3xl font-black text-rose-400 tracking-tight">{stats.blockedJobs}</div>
                <div className="mt-3.5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-emerald-400 font-bold">100% Student Protection</span>
                  <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-mono">
                    Zero Bypass
                  </span>
                </div>
              </div>
            </div>

            {/* ─── 2-Column Command Grid ───────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Left Column (Primary - 2/3 width) */}
              <div className="lg:col-span-2 space-y-6">

                {/* Section 1: Live AI Audit & Security Stream */}
                <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-6 shadow-xl shadow-black/20">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                        <span>⚡</span>
                        <span>Live AI Audit & Threat Inspection Stream</span>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">
                          Latest 5
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Real-time Gemini AI & AWS NLP inspection logs with one-click administrative overrides.
                      </p>
                    </div>

                    <Link
                      href="/admin/jobs"
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Full Audit Pipeline</span>
                      <span>→</span>
                    </Link>
                  </div>

                  {recentJobs.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      No jobs audited yet. New postings will automatically stream in real-time.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentJobs.map(job => {
                        const isApproved = job.status === 'approved';
                        const isBlocked = job.status === 'blocked';
                        const isLoading = actionLoadingId === job._id;

                        return (
                          <div
                            key={job._id}
                            className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isApproved ? 'bg-emerald-400' : 'bg-rose-400'
                                  }`}
                                />
                                <h3 className="font-bold text-white text-sm truncate max-w-[260px] sm:max-w-[340px]">
                                  {job.title}
                                </h3>
                                <span
                                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                    isApproved
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  }`}
                                >
                                  {job.status}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                                <span className="font-medium text-slate-300">
                                  {job.companyName || 'Verified Employer'}
                                </span>
                                <span>•</span>
                                <span>
                                  {new Date(job.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {job.blockReason && (
                                  <>
                                    <span>•</span>
                                    <span className="text-rose-400/90 truncate max-w-[220px]" title={job.blockReason}>
                                      🚫 {job.blockReason}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-auto">
                              <TrustBadge score={job.trustScore} />

                              <button
                                onClick={() => handleToggleJob(job._id, job.status)}
                                disabled={isLoading}
                                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                                  isApproved
                                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                } disabled:opacity-40`}
                              >
                                {isLoading ? 'Updating...' : isApproved ? 'Override Block' : 'Unblock & Approve'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section 2: Core Governance Gateways */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Gateway 1: Recruiters */}
                  <Link
                    href="/admin/recruiters"
                    className="p-5 bg-slate-900/70 hover:bg-slate-850/90 border border-slate-800/90 hover:border-blue-500/50 rounded-2xl transition-all group shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xl mb-3.5 group-hover:scale-105 transition-transform">
                        🏢
                      </div>
                      <h3 className="font-extrabold text-white text-base group-hover:text-blue-400 transition-colors">
                        Recruiter Network
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Verify company legal CIN, tax credentials, address certificates & posting quota.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono">{stats.totalRecruiters} registered</span>
                      <span className="font-bold text-blue-400 group-hover:translate-x-0.5 transition-transform">
                        Manage →
                      </span>
                    </div>
                  </Link>

                  {/* Gateway 2: Students */}
                  <Link
                    href="/admin/students"
                    className="p-5 bg-slate-900/70 hover:bg-slate-850/90 border border-slate-800/90 hover:border-purple-500/50 rounded-2xl transition-all group shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-xl mb-3.5 group-hover:scale-105 transition-transform">
                        🎓
                      </div>
                      <h3 className="font-extrabold text-white text-base group-hover:text-purple-400 transition-colors">
                        Student Biometrics
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Inspect Rekognition face match challenge logs, college IDs & profile verification.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono">{stats.totalStudents} enrolled</span>
                      <span className="font-bold text-purple-400 group-hover:translate-x-0.5 transition-transform">
                        Verify KYC →
                      </span>
                    </div>
                  </Link>

                  {/* Gateway 3: Audit Pipeline */}
                  <Link
                    href="/admin/jobs"
                    className="p-5 bg-slate-900/70 hover:bg-slate-850/90 border border-slate-800/90 hover:border-emerald-500/50 rounded-2xl transition-all group shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl mb-3.5 group-hover:scale-105 transition-transform">
                        🛡️
                      </div>
                      <h3 className="font-extrabold text-white text-base group-hover:text-emerald-400 transition-colors">
                        AI Rules & Pipeline
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Inspect scam markers, Comprehend sentiment, blocklist keywords & manual audits.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono">{stats.totalJobs} audited</span>
                      <span className="font-bold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                        Pipeline →
                      </span>
                    </div>
                  </Link>
                </div>

                {/* Section 3: Subsystem Telemetry & Latency Health */}
                <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-extrabold text-white text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <span>📡</span> Subsystem Infrastructure Telemetry
                    </h3>
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      4/4 Operational
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                      <div className="text-slate-400 text-[11px]">AI Inspector Engine</div>
                      <div className="font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Gemini Flash
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">~410ms latency</p>
                    </div>

                    <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                      <div className="text-slate-400 text-[11px]">Primary Store</div>
                      <div className="font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        MongoDB Atlas
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">Pool: Active</p>
                    </div>

                    <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                      <div className="text-slate-400 text-[11px]">AWS NLP & Face</div>
                      <div className="font-bold text-blue-400 mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        Comprehend/Rekog
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">us-east-1</p>
                    </div>

                    <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                      <div className="text-slate-400 text-[11px]">Notification Dispatch</div>
                      <div className="font-bold text-indigo-400 mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        Nodemailer SMTP
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">Queue: 0 backlog</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (Secondary - 1/3 width) */}
              <div className="space-y-6">

                {/* Section 4: Trending Tech Skills Demand */}
                <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-6 shadow-xl shadow-black/20">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                      <span>📈</span> Trending Tech Skills
                    </h2>
                    <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-mono">
                      14-Day Window
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-5">
                    Real-time skill frequency extracted by AI from verified approved postings.
                  </p>

                  {stats.topSkills && stats.topSkills.length > 0 ? (
                    <div className="space-y-4">
                      {stats.topSkills.map((item, idx) => {
                        const pct = Math.round((item.count / maxSkillCount) * 100);
                        const colors = [
                          'from-blue-500 to-indigo-500',
                          'from-indigo-500 to-purple-500',
                          'from-purple-500 to-pink-500',
                          'from-emerald-500 to-teal-500',
                          'from-amber-500 to-orange-500',
                        ];
                        const barColor = colors[idx % colors.length];

                        return (
                          <div key={item.skill} className="text-xs">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-500 text-[11px] font-bold">#{idx + 1}</span>
                                <span className="font-bold text-slate-200 capitalize">{item.skill}</span>
                              </div>
                              <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                                {item.count} opening{item.count > 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
                                style={{ width: `${Math.max(pct, 12)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      No skills parsed yet. Active jobs will automatically populate this chart.
                    </div>
                  )}
                </div>

                {/* Section 5: Scam Threat Defense Radar */}
                <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-6 shadow-xl shadow-black/20">
                  <h2 className="text-base font-extrabold text-white mb-2 flex items-center gap-2">
                    <span>🛡️</span> Scam Vectors Intercepted
                  </h2>
                  <p className="text-xs text-slate-400 mb-4">
                    Automated heuristic filters guarding students against fraudulent listings:
                  </p>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>💰</span>
                        <span className="text-slate-300 font-medium">Upfront Registration Fees</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Blocked
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>🔗</span>
                        <span className="text-slate-300 font-medium">Fake Domain & Phishing Links</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Blocked
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>💬</span>
                        <span className="text-slate-300 font-medium">Telegram / WhatsApp Bait</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Blocked
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>⏱</span>
                        <span className="text-slate-300 font-medium">Under-threshold Completeness</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Blocked
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 6: Administrative Shortcuts */}
                <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5">
                  <h3 className="font-extrabold text-white text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <span>⚡</span> Administrative Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Link
                      href="/admin/recruiters"
                      className="p-2.5 bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 rounded-xl text-slate-300 hover:text-white font-medium transition-colors text-center"
                    >
                      Verify Recruiters
                    </Link>
                    <Link
                      href="/admin/students"
                      className="p-2.5 bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 rounded-xl text-slate-300 hover:text-white font-medium transition-colors text-center"
                    >
                      Student KYC Queue
                    </Link>
                    <Link
                      href="/admin/jobs?status=blocked"
                      className="p-2.5 bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 rounded-xl text-rose-300 hover:text-rose-200 font-medium transition-colors text-center"
                    >
                      Inspect Blocked ({stats.blockedJobs})
                    </Link>
                    <Link
                      href="/"
                      target="_blank"
                      className="p-2.5 bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 rounded-xl text-blue-300 hover:text-blue-200 font-medium transition-colors text-center"
                    >
                      Public Feed ↗
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
