"use client";
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import TrustBadge from '@/components/TrustBadge';
import AuditResult from '@/components/AuditResult';
import { FormSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';

const JOB_WEIGHTS: Record<string, number> = {
  title: 14, description: 18, salary: 10, duration: 10,
  jobType: 8, location: 8, contactEmail: 8, link: 8, skills: 6, deadline: 10,
};

const initialForm = {
  title: '', description: '', salary: '', duration: '',
  jobType: '', location: '', contactEmail: '', link: '', skills: '', deadline: '',
};

function calcCompleteness(form: typeof initialForm) {
  let score = 0;
  for (const [field, weight] of Object.entries(JOB_WEIGHTS)) {
    const val = (form as any)[field];
    if (val && String(val).trim()) score += weight;
  }
  return Math.min(100, score);
}

export default function PostJobPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [incompleteFields, setIncompleteFields] = useState<string[]>([]);

  const completeness = useMemo(() => calcCompleteness(form), [form]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const setPresetDeadline = (days: number) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    const dateStr = target.toISOString().split('T')[0];
    setForm(prev => ({ ...prev, deadline: dateStr }));
    setIncompleteFields(prev => prev.filter(f => f !== 'deadline'));
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== 'recruiter')) router.replace('/login');
  }, [user, loading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setIncompleteFields([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (completeness < 90) {
      const missing = Object.keys(JOB_WEIGHTS).filter(f => !((form as any)[f]?.trim()));
      setIncompleteFields(missing);
      return;
    }
    setSubmitting(true);
    setResult(null);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/jobs/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.job);
        setForm(initialForm);
      } else {
        setError(data.message || data.error || 'Audit failed.');
        if (data.missingHint) setIncompleteFields(data.missingHint);
      }
    } catch {
      setError('Could not connect to server.');
    } finally {
      setSubmitting(false);
    }
  };

  const barColor = completeness >= 90 ? 'bg-green-500' : completeness >= 60 ? 'bg-yellow-400' : 'bg-red-400';
  const barLabel = completeness >= 90 ? '✅ Ready to submit' : `${completeness}% — need 90% to submit`;

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <FormSkeleton />
      </main>
    );
  }

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Post a Job / Internship</h1>
          <p className="text-gray-500 mb-8 text-sm">Fill all fields to reach 90% completeness, then AI will audit your listing.</p>

          {/* Live Completeness Meter */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Listing Completeness</span>
              <span className={`text-sm font-bold ${completeness >= 90 ? 'text-green-600' : 'text-orange-500'}`}>{barLabel}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div className={`h-3 rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${completeness}%` }} />
            </div>
            {incompleteFields.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {incompleteFields.map(f => (
                  <span key={f} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full capitalize">{f}</span>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col gap-5">
            <Field label="Job Title *" name="title" value={form.title} onChange={handleChange} highlight={incompleteFields.includes('title')} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-800">Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={5}
                placeholder="Describe the role, responsibilities, requirements, and what the candidate will learn..."
                className={`border rounded-lg px-3.5 py-2.5 text-sm text-gray-900 font-medium placeholder:text-gray-400 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${incompleteFields.includes('description') ? 'border-orange-400 bg-orange-50' : 'border-gray-300'}`} />
              <p className="text-xs text-gray-500 font-medium">{form.description.length} chars — more detail = higher trust score</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Salary / Stipend *" name="salary" value={form.salary} onChange={handleChange} placeholder="e.g. ₹15,000/month" highlight={incompleteFields.includes('salary')} />
              <Field label="Duration *" name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 3 months" highlight={incompleteFields.includes('duration')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Job Type *</label>
                <select name="jobType" value={form.jobType} onChange={handleChange}
                  className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${incompleteFields.includes('jobType') ? 'border-orange-400' : 'border-gray-200'}`}>
                  <option value="">Select type</option>
                  {['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <Field label="Location *" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Remote / Mumbai" highlight={incompleteFields.includes('location')} />
            </div>
            <Field label="Skills Required *" name="skills" value={form.skills} onChange={handleChange} placeholder="e.g. Python, React, Communication" highlight={incompleteFields.includes('skills')} />
            <Field label="Contact Email *" name="contactEmail" value={form.contactEmail} onChange={handleChange} type="email" placeholder="hr@company.com" highlight={incompleteFields.includes('contactEmail')} />
            <Field label="Apply / Job Link *" name="link" value={form.link} onChange={handleChange} type="url" placeholder="https://company.com/apply" highlight={incompleteFields.includes('link')} />

            {/* Application Deadline Section */}
            <div className={`p-4 rounded-xl border ${incompleteFields.includes('deadline') ? 'bg-orange-50/60 border-orange-300' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div>
                  <label className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <span>📅 Application Deadline (Last Date to Apply) *</span>
                    {form.deadline && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {form.deadline}
                      </span>
                    )}
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Students will see a dynamic 5-day countdown badge and prioritized top ranking when the deadline nears.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <input
                  type="date"
                  name="deadline"
                  min={todayStr}
                  value={form.deadline}
                  onChange={handleChange}
                  className={`border rounded-lg px-3.5 py-2 text-sm text-gray-900 font-medium bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    incompleteFields.includes('deadline') ? 'border-orange-400' : 'border-gray-300'
                  }`}
                />

                {/* 1-Click Quick Preset Buttons */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs font-medium text-gray-500 mr-1">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => setPresetDeadline(7)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-700 transition-colors shadow-2xs"
                  >
                    ⚡ 7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetDeadline(15)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-700 transition-colors shadow-2xs"
                  >
                    📅 15 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetDeadline(30)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-700 transition-colors shadow-2xs"
                  >
                    📅 30 Days
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={submitting || completeness < 90}
              className="bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {submitting ? 'Auditing with AI...' : completeness < 90 ? `Complete listing to submit (${completeness}%)` : 'Submit for AI Audit →'}
            </button>
          </form>

          {error && <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

          {result && (
            <div className="mt-6">
              <AuditResult job={result} />
              {result.status === 'blocked' && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                  💡 Fix the issues above and <button onClick={() => { setResult(null); setForm(prev => ({ ...prev, ...result })); }} className="font-semibold underline">edit & resubmit</button> your listing.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </ErrorBoundary>
  );
}

function Field({ label, name, value, onChange, required, type = 'text', placeholder, highlight }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-800">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
        className={`border rounded-lg px-3.5 py-2.5 text-sm text-gray-900 font-medium placeholder:text-gray-400 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${highlight ? 'border-orange-400 bg-orange-50' : 'border-gray-300'}`} />
    </div>
  );
}

function Detail({ label, items, color }: { label: string; items: string[]; color: string }) {
  const colors: Record<string, string> = { yellow: 'bg-yellow-100 text-yellow-700', red: 'bg-red-100 text-red-700', blue: 'bg-blue-100 text-blue-700' };
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item: string) => <span key={item} className={`text-xs px-2 py-0.5 rounded-full ${colors[color]}`}>{item}</span>)}
      </div>
    </div>
  );
}
