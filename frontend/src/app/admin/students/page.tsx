"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminNav from '@/components/AdminNav';
import { API_URL } from '@/lib/api';

interface Student {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  collegeName?: string;
  course?: string;
  yearOfStudy?: string;
  createdAt: string;
  profile?: {
    fullName?: string;
    collegeName?: string;
    course?: string;
    yearOfStudy?: string;
    skills?: string[];
    completenessScore?: number;
    idCardUrl?: string;
    facePhotoUrl?: string;
    livenessVerified?: boolean;
    livenessScore?: number;
    idCardType?: string;
  };
}

export default function AdminStudentsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified' | 'suspended'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{ title: string; url: string } | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/admin/login');
    }
  }, [user, loading, router]);

  const loadStudents = () => {
    if (!token) return;
    setFetching(true);
    fetch(`${API_URL}/api/admin/students`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setStudents(Array.isArray(data) ? data : []);
        setFetching(false);
      })
      .catch(() => setFetching(false));
  };

  useEffect(() => {
    if (token && user?.role === 'admin') {
      loadStudents();
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

      setStudents(prev => prev.map(s => (s._id === id ? { ...s, ...data.user } : s)));
      setNotification({ message: 'Student status updated successfully', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({ message: err.message || 'Error updating student', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = students.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.collegeName && s.collegeName.toLowerCase().includes(search.toLowerCase())) ||
      (s.profile?.collegeName && s.profile.collegeName.toLowerCase().includes(search.toLowerCase())) ||
      (s.course && s.course.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'verified') return s.isVerified || s.profile?.livenessVerified;
    if (statusFilter === 'unverified') return !s.isVerified && !s.profile?.livenessVerified;
    if (statusFilter === 'suspended') return s.isActive === false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Student Verification Oversight</h1>
            <p className="text-xs text-slate-400 mt-1">
              Verify biometric liveness results, inspect college ID documents, and manage trust status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Total Students:</span>
            <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-purple-400">
              {students.length}
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
              placeholder="Search by student name, college, email, course..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {(['all', 'verified', 'unverified', 'suspended'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Students List */}
        {fetching ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-sm">No students found matching current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(student => {
              const compScore = student.profile?.completenessScore || 0;
              const isVerified = student.isVerified || student.profile?.livenessVerified;
              const isSuspended = student.isActive === false;
              const isUpdating = updatingId === student._id;

              return (
                <div
                  key={student._id}
                  className={`bg-slate-900 border rounded-2xl p-5 transition-all ${
                    isSuspended ? 'border-rose-900/50 opacity-75' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Info */}
                    <div className="flex items-start gap-4">
                      {/* Avatar / Face Photo */}
                      <div className="relative shrink-0">
                        {student.profile?.facePhotoUrl ? (
                          <img
                            src={`${API_URL}${student.profile.facePhotoUrl}`}
                            alt="face"
                            onClick={() =>
                              setPreviewMedia({
                                title: `${student.name}'s Face Photo (Liveness Check)`,
                                url: `${API_URL}${student.profile!.facePhotoUrl}`,
                              })
                            }
                            className="w-12 h-12 rounded-xl object-cover border-2 border-purple-500/40 cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg">
                            {student.name[0]}
                          </div>
                        )}
                        {isVerified && (
                          <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-bold text-white">{student.name}</h2>
                          {isVerified ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold rounded-full">
                              ✓ Verified Student
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold rounded-full">
                              ⏳ Identity Pending
                            </span>
                          )}

                          {isSuspended && (
                            <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-semibold rounded-full">
                              🚫 Suspended
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                          <span>✉️ {student.email}</span>
                          <span>·</span>
                          <span>🏫 {student.profile?.collegeName || student.collegeName || 'College Not Set'}</span>
                          {(student.profile?.course || student.course) && (
                            <>
                              <span>·</span>
                              <span>{student.profile?.course || student.course}</span>
                            </>
                          )}
                          {(student.profile?.yearOfStudy || student.yearOfStudy) && (
                            <>
                              <span>·</span>
                              <span>{student.profile?.yearOfStudy || student.yearOfStudy}</span>
                            </>
                          )}
                        </div>

                        {/* Verification & ID card details */}
                        <div className="flex items-center gap-4 mt-3 text-xs flex-wrap">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <span className="text-slate-400">Profile Completeness:</span>
                            <span className="font-bold text-purple-400">{compScore}%</span>
                          </div>
                          <span className="text-slate-700">|</span>

                          {/* ID Card preview */}
                          {student.profile?.idCardUrl ? (
                            <button
                              onClick={() =>
                                setPreviewMedia({
                                  title: `${student.name}'s Student ID Card (${student.profile?.idCardType || 'Document'})`,
                                  url: `${API_URL}${student.profile!.idCardUrl}`,
                                })
                              }
                              className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2 flex items-center gap-1"
                            >
                              🪪 Inspect ID Card
                            </button>
                          ) : (
                            <span className="text-slate-500">No ID Card uploaded</span>
                          )}

                          {student.profile?.skills && student.profile.skills.length > 0 && (
                            <>
                              <span className="text-slate-700">|</span>
                              <div className="flex items-center gap-1">
                                {student.profile.skills.slice(0, 3).map(sk => (
                                  <span key={sk} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                      {!isVerified ? (
                        <button
                          disabled={isUpdating}
                          onClick={() => updateStatus(student._id, { isVerified: true, isActive: true })}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {isUpdating ? '...' : '✓ Approve Verification'}
                        </button>
                      ) : (
                        <button
                          disabled={isUpdating}
                          onClick={() => updateStatus(student._id, { isVerified: false })}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {isUpdating ? '...' : 'Revoke Verification'}
                        </button>
                      )}

                      {isSuspended ? (
                        <button
                          disabled={isUpdating}
                          onClick={() => updateStatus(student._id, { isActive: true })}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {isUpdating ? '...' : 'Reactivate Account'}
                        </button>
                      ) : (
                        <button
                          disabled={isUpdating}
                          onClick={() => {
                            const reason = prompt('Optional reason for suspending student:');
                            if (reason !== null) {
                              updateStatus(student._id, { isActive: false, reason });
                            }
                          }}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {isUpdating ? '...' : 'Suspend'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Media Preview Modal */}
        {previewMedia && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-white relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-200">{previewMedia.title}</h3>
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>
              <div className="rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[70vh]">
                <img src={previewMedia.url} alt="preview" className="max-h-[65vh] w-auto object-contain" />
              </div>
              <div className="mt-4 flex justify-end">
                <a
                  href={previewMedia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:underline mr-auto"
                >
                  Open Full Image in New Tab ↗
                </a>
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
