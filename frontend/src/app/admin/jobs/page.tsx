"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminNav from '@/components/AdminNav';
import TrustBadge from '@/components/TrustBadge';
import { API_URL } from '@/lib/api';

interface Job {
  _id: string;
  title: string;
  companyName: string;
  description: string;
  salary?: string;
  duration?: string;
  jobType?: string;
  location?: string;
  link?: string;
  skills: string[];
  trustScore: number;
  status: 'approved' | 'blocked';
  blockReason?: string;
  blocklistMatches?: string[];
  createdAt: string;
  aiResult?: {
    skills?: string[];
    missingFields?: string[];
    scamMarkers?: string[];
    isLikelyScam?: boolean;
    professionalismScore?: number;
  };
  linkResult?: {
    isValid: boolean;
    reason?: string;
  };
  comprehendResult?: {
    sentiment?: string;
    signals?: string[];
    penalty?: number;
    comprehendUsed?: boolean;
  };
}

export default function AdminJobsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [fetching, setFetching] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'blocked'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [search, setSearch] = useState('');
  const [inspectJob, setInspectJob] = useState<Job | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/admin/login');
    }
  }, [user, loading, router]);

  const loadJobs = () => {
    if (!token) return;
    setFetching(true);
    const query = new URLSearchParams({
      page: String(page),
      limit: '15',
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    });

    fetch(`${API_URL}/api/admin/jobs?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setJobs(data.jobs || []);
        setTotalPages(data.pages || 1);
        setTotalJobs(data.total || 0);
        setFetching(false);
      })
      .catch(() => setFetching(false));
  };

  useEffect(() => {
    if (token && user?.role === 'admin') {
      loadJobs();
    }
  }, [token, user, statusFilter, page]);

  const toggleJobStatus = async (jobId: string, currentStatus: string) => {
    setUpdatingId(jobId);
    try {
      const newStatus = currentStatus === 'approved' ? 'blocked' : 'approved';
      let blockReason: string | null = null;

      if (newStatus === 'blocked') {
        const inputReason = prompt('Reason for manually blocking this listing:', 'Flagged by administrator upon manual review');
        if (inputReason === null) {
          setUpdatingId(null);
          return;
        }
        blockReason = inputReason;
      }

      const res = await fetch(`${API_URL}/api/admin/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, blockReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update job status');

      setJobs(prev => prev.map(j => (j._id === jobId ? { ...j, ...data.job } : j)));
      if (inspectJob?._id === jobId) {
        setInspectJob(prev => (prev ? { ...prev, ...data.job } : null));
      }

      setNotification({
        message: `Listing successfully ${newStatus === 'approved' ? 'approved & published' : 'blocked'}`,
        type: 'success',
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({ message: err.message || 'Error updating job', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    return (
      j.title.toLowerCase().includes(q) ||
      (j.companyName && j.companyName.toLowerCase().includes(q)) ||
      (j.skills && j.skills.some(s => s.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Listing Audits & Governance</h1>
            <p className="text-xs text-slate-400 mt-1">
              Deep dive into Gemini AI decisions, scam markers, Comprehend sentiment, and override listing visibility.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Total Listings:</span>
            <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-emerald-400">
              {totalJobs}
            </span>
          </div>
        </div>

        {notification && (
          <div
            className={`mb-6 p-3.5 rounded-xl text-xs font-medium border flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Controls Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-96 relative">
            <input
              type="text"
              placeholder="Search by job title, company, or skills..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {(['all', 'approved', 'blocked'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setStatusFilter(tab);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Table / Cards */}
        {fetching ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-sm">No listings found matching current criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(job => {
              const isApproved = job.status === 'approved';
              const isUpdating = updatingId === job._id;

              return (
                <div
                  key={job._id}
                  className={`bg-slate-900 border rounded-2xl p-5 transition-all ${
                    !isApproved ? 'border-rose-900/40 bg-slate-900/80' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Job Basic Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-base font-bold text-white">{job.title}</h2>
                        <span className="text-xs text-slate-400 font-medium">@{job.companyName}</span>
                        <TrustBadge score={job.trustScore || 0} />
                        <span
                          className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isApproved ? '✅ Approved' : '🚫 Blocked'}
                        </span>
                      </div>

                      {/* Snippet / Block reason */}
                      {!isApproved && job.blockReason && (
                        <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-2.5 py-1.5 mt-2 font-mono">
                          ⚠️ Audit Reason: {job.blockReason}
                        </p>
                      )}

                      {/* Meta badges */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 flex-wrap">
                        {job.location && <span>📍 {job.location}</span>}
                        {job.jobType && <span>💼 {job.jobType}</span>}
                        {job.salary && <span>💰 {job.salary}</span>}
                        {job.duration && <span>⏱ {job.duration}</span>}
                        <span className="text-slate-600">·</span>
                        <span>Date: {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>

                      {/* Skills */}
                      {job.skills && job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {job.skills.slice(0, 6).map(s => (
                            <span key={s} className="bg-slate-800 text-blue-300 text-[10px] px-2 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                      <button
                        onClick={() => setInspectJob(job)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                      >
                        <span>🔍</span> Inspect Audit Logs
                      </button>

                      <button
                        disabled={isUpdating}
                        onClick={() => toggleJobStatus(job._id, job.status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                          isApproved
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {isUpdating ? '...' : isApproved ? 'Block Listing' : 'Override & Approve'}
                      </button>

                      {job.link && (
                        <a
                          href={job.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg"
                          title="Open Listing URL"
                        >
                          ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-400">
            <div>
              Page <span className="text-white font-bold">{page}</span> of{' '}
              <span className="text-white font-bold">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg disabled:opacity-30 disabled:hover:border-slate-800 transition-colors"
              >
                ← Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg disabled:opacity-30 disabled:hover:border-slate-800 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Audit Inspector Modal */}
        {inspectJob && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 text-white max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-white">{inspectJob.title}</h3>
                  <p className="text-xs text-slate-400">Audit telemetry for {inspectJob.companyName}</p>
                </div>
                <button
                  onClick={() => setInspectJob(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="mt-5 space-y-4 text-xs">
                {/* Score breakdown */}
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div>
                    <div className="text-slate-400">Trust Score</div>
                    <div className="text-xl font-black text-blue-400 mt-1">{inspectJob.trustScore}/100</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Status</div>
                    <div className={`text-base font-bold mt-1 ${inspectJob.status === 'approved' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {inspectJob.status.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Professionalism</div>
                    <div className="text-base font-bold text-slate-200 mt-1">
                      {inspectJob.aiResult?.professionalismScore ?? 'N/A'}/10
                    </div>
                  </div>
                </div>

                {/* Gemini AI Result */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                    <span>✨</span> Google Gemini 1.5 Flash Inspector
                  </h4>
                  <div className="space-y-2 text-slate-300">
                    <p>
                      <strong>Likely Scam Flag:</strong>{' '}
                      <span className={inspectJob.aiResult?.isLikelyScam ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {inspectJob.aiResult?.isLikelyScam ? '⚠️ YES — Scam pattern matched' : '✓ No scam pattern'}
                      </span>
                    </p>

                    <div>
                      <strong>Extracted Skills:</strong>{' '}
                      {inspectJob.aiResult?.skills && inspectJob.aiResult.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {inspectJob.aiResult.skills.map(s => (
                            <span key={s} className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-[11px]">
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500">None detected</span>
                      )}
                    </div>

                    <div>
                      <strong>Scam Markers Flagged:</strong>{' '}
                      {inspectJob.aiResult?.scamMarkers && inspectJob.aiResult.scamMarkers.length > 0 ? (
                        <ul className="list-disc list-inside text-rose-400 mt-1">
                          {inspectJob.aiResult.scamMarkers.map(m => (
                            <li key={m}>{m}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-500">None</span>
                      )}
                    </div>

                    <div>
                      <strong>Missing Fields:</strong>{' '}
                      {inspectJob.aiResult?.missingFields && inspectJob.aiResult.missingFields.length > 0 ? (
                        <span className="text-amber-400">{inspectJob.aiResult.missingFields.join(', ')}</span>
                      ) : (
                        <span className="text-slate-500">None</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* AWS Comprehend Result */}
                {inspectJob.comprehendResult && (
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <h4 className="font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                      <span>☁️</span> AWS Comprehend NLP Signals
                    </h4>
                    <p className="text-slate-300">
                      <strong>Sentiment:</strong>{' '}
                      <span className="capitalize">{inspectJob.comprehendResult.sentiment || 'Neutral'}</span>
                    </p>
                    <p className="text-slate-300 mt-1">
                      <strong>Score Penalty Applied:</strong> -{inspectJob.comprehendResult.penalty || 0} pts
                    </p>
                    {inspectJob.comprehendResult.signals && inspectJob.comprehendResult.signals.length > 0 && (
                      <div className="mt-2 text-rose-400">
                        {inspectJob.comprehendResult.signals.map(s => (
                          <div key={s}>• {s}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Link Validation Result */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                    <span>🔗</span> URL Validation Result
                  </h4>
                  <p className="text-slate-300">
                    <strong>URL Reachability:</strong>{' '}
                    <span className={inspectJob.linkResult?.isValid ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                      {inspectJob.linkResult?.isValid ? '✓ Reachable & Valid HTTP response' : `⚠️ ${inspectJob.linkResult?.reason || 'Failed reachability check'}`}
                    </span>
                  </p>
                  {inspectJob.link && (
                    <p className="text-slate-400 mt-1 truncate">
                      <strong>Target:</strong> {inspectJob.link}
                    </p>
                  )}
                </div>

                {/* Full Description */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-slate-200 mb-1">Original Listing Description</h4>
                  <p className="text-slate-400 text-xs whitespace-pre-line max-h-40 overflow-y-auto mt-2">
                    {inspectJob.description}
                  </p>
                </div>
              </div>

              {/* Modal footer */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  disabled={updatingId === inspectJob._id}
                  onClick={() => toggleJobStatus(inspectJob._id, inspectJob.status)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold ${
                    inspectJob.status === 'approved'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {inspectJob.status === 'approved' ? 'Block Listing' : 'Override & Approve'}
                </button>
                <button
                  onClick={() => setInspectJob(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium"
                >
                  Close Audit View
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
