"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminNav from '@/components/AdminNav';
import { API_URL } from '@/lib/api';

interface Recruiter {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  companyName?: string;
  companyWebsite?: string;
  companyType?: string;
  createdAt: string;
  profile?: {
    legalName?: string;
    completenessScore?: number;
    cin?: string;
    website?: string;
    officialEmail?: string;
    registrationDocUrl?: string;
    logoUrl?: string;
  };
  jobStats?: {
    total: number;
    approved: number;
  };
}

export default function AdminRecruitersPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified' | 'suspended'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/admin/login');
    }
  }, [user, loading, router]);

  const loadRecruiters = () => {
    if (!token) return;
    setFetching(true);
    fetch(`${API_URL}/api/admin/recruiters`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setRecruiters(Array.isArray(data) ? data : []);
        setFetching(false);
      })
      .catch(() => setFetching(false));
  };

  useEffect(() => {
    if (token && user?.role === 'admin') {
      loadRecruiters();
    }
  }, [token, user]);

  const updateStatus = async (id: string, updates: { isActive?: boolean; isVerified?: boolean; reason?: string }) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      setRecruiters(prev => prev.map(r => (r._id === id ? { ...r, ...data.user } : r)));
      setNotification({ message: 'Account status updated successfully', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({ message: err.message || 'Error updating account', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = recruiters.filter(r => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.companyName && r.companyName.toLowerCase().includes(search.toLowerCase())) ||
      (r.profile?.legalName && r.profile.legalName.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'verified') return r.isVerified && r.isActive !== false;
    if (statusFilter === 'unverified') return !r.isVerified && r.isActive !== false;
    if (statusFilter === 'suspended') return r.isActive === false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Recruiter Accounts Governance</h1>
            <p className="text-xs text-slate-400 mt-1">
              Verify employer legitimacy, inspect company registrations, and control job posting access.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Total Recruiters:</span>
            <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-blue-400">
              {recruiters.length}
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
              placeholder="Search by recruiter name, email, company..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {(['all', 'verified', 'unverified', 'suspended'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Recruiters List */}
        {fetching ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-sm">No recruiters found matching current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(recruiter => {
              const compScore = recruiter.profile?.completenessScore || 0;
              const isSuspended = recruiter.isActive === false;
              const isUpdating = updatingId === recruiter._id;

              return (
                <div
                  key={recruiter._id}
                  className={`bg-slate-900 border rounded-2xl p-5 transition-all ${
                    isSuspended ? 'border-rose-900/50 opacity-75' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
                        {recruiter.profile?.logoUrl ? (
                          <img
                            src={`${API_URL}${recruiter.profile.logoUrl}`}
                            alt="logo"
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          recruiter.name[0]
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-bold text-white">{recruiter.name}</h2>
                          {recruiter.isVerified ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold rounded-full flex items-center gap-1">
                              ✓ Verified Employer
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold rounded-full">
                              ⏳ Unverified
                            </span>
                          )}

                          {isSuspended && (
                            <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-semibold rounded-full">
                              🚫 Suspended
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                          <span>✉️ {recruiter.email}</span>
                          <span>·</span>
                          <span>🏢 {recruiter.profile?.legalName || recruiter.companyName || 'No Company Name'}</span>
                          {recruiter.companyType && (
                            <>
                              <span>·</span>
                              <span className="capitalize">{recruiter.companyType}</span>
                            </>
                          )}
                          {recruiter.profile?.cin && (
                            <>
                              <span>·</span>
                              <span className="font-mono text-slate-400">CIN: {recruiter.profile.cin}</span>
                            </>
                          )}
                        </div>

                        {/* Profile & Job metrics */}
                        <div className="flex items-center gap-4 mt-3 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <span className="text-slate-400">Profile Completeness:</span>
                            <span className="font-bold text-blue-400">{compScore}%</span>
                          </div>
                          <span className="text-slate-700">|</span>
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <span className="text-slate-400">Listings:</span>
                            <span className="font-bold text-white">{recruiter.jobStats?.total || 0}</span>
                            <span className="text-emerald-400 font-semibold">({recruiter.jobStats?.approved || 0} approved)</span>
                          </div>
                          {recruiter.profile?.registrationDocUrl && (
                            <>
                              <span className="text-slate-700">|</span>
                              <a
                                href={`${API_URL}${recruiter.profile.registrationDocUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline flex items-center gap-1"
                              >
                                📄 View Reg Document
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                      {!recruiter.isVerified ? (
                        <button
                          disabled={isUpdating}
                          onClick={() => updateStatus(recruiter._id, { isVerified: true, isActive: true })}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {isUpdating ? '...' : '✓ Approve & Verify'}
                        </button>
                      ) : (
                        <button
                          disabled={isUpdating}
                          onClick={() => updateStatus(recruiter._id, { isVerified: false })}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {isUpdating ? '...' : 'Revoke Verification'}
                        </button>
                      )}

                      {isSuspended ? (
                        <button
                          disabled={isUpdating}
                          onClick={() => updateStatus(recruiter._id, { isActive: true })}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {isUpdating ? '...' : 'Reactivate Account'}
                        </button>
                      ) : (
                        <button
                          disabled={isUpdating}
                          onClick={() => {
                            const reason = prompt('Optional reason for account suspension:');
                            if (reason !== null) {
                              updateStatus(recruiter._id, { isActive: false, reason });
                            }
                          }}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {isUpdating ? '...' : 'Suspend Account'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
