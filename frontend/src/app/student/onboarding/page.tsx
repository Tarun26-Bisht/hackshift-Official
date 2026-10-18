"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FormSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';
import { API_URL } from '@/lib/api';
import dynamic from 'next/dynamic';

const LivenessCheck = dynamic(() => import('@/components/LivenessCheck'), { ssr: false });

const STEPS = ['Personal Details', 'College ID Card', 'Face Verification', 'Review & Finish'];

export default function StudentOnboarding() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [completeness, setCompleteness] = useState(0);
  const [error, setError] = useState('');

  // Step 1 form
  const [form, setForm] = useState({
    fullName: '', collegeName: '', course: '', yearOfStudy: '',
    rollNumber: '', city: '', state: '', phone: '', linkedIn: '', github: '', bio: '',
  });

  // Step 2
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState('');
  const [idCardType, setIdCardType] = useState('college_id');
  const [idUploaded, setIdUploaded] = useState(false);

  // Step 3
  const [faceDataUrl, setFaceDataUrl] = useState('');
  const [livenessChallenge, setLivenessChallenge] = useState('');
  const [faceUploaded, setFaceUploaded] = useState(false);

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
    fetch(`${API_URL}/api/student/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(data => {
      if (data.profile) {
        const p = data.profile;
        setCompleteness(p.completenessScore || 0);
        setForm(prev => ({
          ...prev,
          fullName: p.fullName || '', collegeName: p.collegeName || '',
          course: p.course || '', yearOfStudy: p.yearOfStudy || '',
          rollNumber: p.rollNumber || '', city: p.city || '',
          state: p.state || '', phone: p.phone || '',
          linkedIn: p.linkedIn || '', github: p.github || '', bio: p.bio || '',
        }));
        if (p.idCardUrl) { setIdCardPreview(`${API_URL}${p.idCardUrl}`); setIdUploaded(true); }
        if (p.facePhotoUrl) { setFaceDataUrl(`${API_URL}${p.facePhotoUrl}`); setFaceUploaded(true); setLivenessChallenge(p.livenessChallenge || ''); }
      }
    });
  }, [token]);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const saveStep1 = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API_URL}/api/student/step`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setCompleteness(data.completenessScore);
      setStep(1);
    } catch { setError('Could not connect to server.'); }
    finally { setSaving(false); }
  };

  const uploadIdCard = async () => {
    if (!idCardFile) { setStep(2); return; }
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('idCard', idCardFile);
      fd.append('idCardType', idCardType);
      const res = await fetch(`${API_URL}/api/student/upload/id-card`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setCompleteness(data.completenessScore);
      setIdUploaded(true);
      setStep(2);
    } catch { setError('Could not connect to server.'); }
    finally { setSaving(false); }
  };

  const uploadFace = async (photoDataUrl: string, challenge: string) => {
    setFaceDataUrl(photoDataUrl);
    setLivenessChallenge(challenge);
    setSaving(true); setError('');
    try {
      // Convert dataUrl to blob
      const blob = await (await fetch(photoDataUrl)).blob();
      const fd = new FormData();
      fd.append('face', blob, 'face.jpg');
      fd.append('livenessVerified', 'true');
      fd.append('challenge', challenge);
      const res = await fetch(`${API_URL}/api/student/upload/face`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setCompleteness(data.completenessScore);
      setFaceUploaded(true);
      setStep(3);
    } catch { setError('Could not connect to server.'); }
    finally { setSaving(false); }
  };

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <FormSkeleton />
      </main>
    );
  }

  const scoreColor = completeness >= 60 ? 'bg-green-500' : completeness >= 30 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-extrabold text-blue-600">TrustBridge</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Profile: {completeness}%</span>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-2 rounded-full transition-all duration-500 ${scoreColor}`} style={{ width: `${completeness}%` }} />
            </div>
          </div>
          <button onClick={() => router.push('/student/dashboard')} className="text-sm text-gray-400 hover:text-gray-600">
            Skip for now →
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-10">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center shrink-0 ${
                i === step ? 'bg-blue-600 text-white' : i < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i === step ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>{s}</span>
              {i < 3 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{STEPS[step]}</h2>
          <p className="text-sm text-gray-400 mb-8">
            {['Tell us about yourself.', 'Upload your college ID or any valid ID.', 'Quick liveness check — prove you\'re human!', 'Everything looks good. Let\'s go!'][step]}
          </p>

          {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>}

          {step === 0 && <StepOne form={form} set={set} />}
          {step === 1 && (
            <StepTwo
              idCardPreview={idCardPreview} idCardType={idCardType}
              onTypeChange={(e: React.ChangeEvent<HTMLSelectElement>) => setIdCardType(e.target.value)}
              onFileChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const f = e.target.files?.[0];
                if (f) { setIdCardFile(f); setIdCardPreview(URL.createObjectURL(f)); }
              }}
            />
          )}
          {step === 2 && !faceUploaded && <LivenessCheck onVerified={uploadFace} />}
          {step === 2 && faceUploaded && (
            <div className="flex flex-col items-center gap-4">
              <img src={faceDataUrl} alt="face" className="w-40 h-40 rounded-full object-cover border-4 border-green-400" />
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
                <p className="text-green-700 font-semibold">✅ Liveness Verified!</p>
                <p className="text-green-600 text-sm mt-1">Challenge passed: <span className="font-medium capitalize">{livenessChallenge.replace('_', ' ')}</span></p>
              </div>
              <button onClick={() => setStep(3)} className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700">
                Continue →
              </button>
            </div>
          )}
          {step === 3 && (
            <StepReview
              form={form} idCardPreview={idCardPreview} faceDataUrl={faceDataUrl}
              idUploaded={idUploaded} faceUploaded={faceUploaded} completeness={completeness}
              onFinish={() => router.push('/student/dashboard')}
            />
          )}

          {/* Nav buttons for steps 0 and 1 */}
          {(step === 0 || step === 1) && (
            <div className="flex justify-between mt-8">
              <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
                className="text-sm text-gray-500 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30">
                ← Back
              </button>
              <button
                onClick={step === 0 ? saveStep1 : uploadIdCard}
                disabled={saving}
                className="bg-blue-600 text-white text-sm font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save & Continue →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  </ErrorBoundary>
);
}

// ─── Step Components ──────────────────────────────────────────────────────────

function StepOne({ form, set }: any) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Full Name *" name="fullName" value={form.fullName} onChange={set} required />
        <Field label="Phone *" name="phone" value={form.phone} onChange={set} type="tel" placeholder="+91 98765 43210" />
      </div>
      <Field label="College / University *" name="collegeName" value={form.collegeName} onChange={set} placeholder="e.g. IIT Delhi" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Course *" name="course" value={form.course} onChange={set} placeholder="e.g. B.Tech CSE" />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Year of Study</label>
          <select name="yearOfStudy" value={form.yearOfStudy} onChange={set} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select year</option>
            {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Roll Number" name="rollNumber" value={form.rollNumber} onChange={set} placeholder="e.g. 2021CSE042" />
        <Field label="City" name="city" value={form.city} onChange={set} placeholder="e.g. Mumbai" />
      </div>
      <Field label="State" name="state" value={form.state} onChange={set} placeholder="e.g. Maharashtra" />
      <Field label="LinkedIn Profile" name="linkedIn" value={form.linkedIn} onChange={set} type="url" placeholder="https://linkedin.com/in/..." />
      <Field label="GitHub Profile" name="github" value={form.github} onChange={set} type="url" placeholder="https://github.com/..." />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Short Bio</label>
        <textarea name="bio" value={form.bio} onChange={set} rows={3}
          placeholder="Tell recruiters a bit about yourself..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
    </div>
  );
}

function StepTwo({ idCardPreview, idCardType, onTypeChange, onFileChange }: any) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">ID Card Type</label>
        <select value={idCardType} onChange={onTypeChange} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="college_id">College ID Card</option>
          <option value="aadhar">Aadhar Card</option>
          <option value="passport">Passport</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Upload ID Card *</label>
        {idCardPreview && (
          <img src={idCardPreview} alt="ID Card" className="w-full max-h-48 object-contain rounded-xl border border-gray-200 bg-gray-50" />
        )}
        <label className="cursor-pointer border-2 border-dashed border-gray-200 rounded-xl px-6 py-6 text-center text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
          {idCardPreview ? '🔄 Change ID Card' : '📷 Upload ID Card (JPG/PNG/PDF, max 5MB)'}
          <input type="file" accept="image/*,.pdf" onChange={onFileChange} className="hidden" />
        </label>
      </div>

      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-xs text-yellow-700">
        🔒 Your ID is stored securely and only used to verify your student status. It is never shared publicly.
      </div>
    </div>
  );
}

function StepReview({ form, idCardPreview, faceDataUrl, idUploaded, faceUploaded, completeness, onFinish }: any) {
  const scoreColor = completeness >= 60 ? 'text-green-600' : 'text-yellow-500';
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        {faceDataUrl && <img src={faceDataUrl} alt="face" className="w-16 h-16 rounded-full object-cover border-2 border-blue-400" />}
        <div>
          <p className="font-bold text-gray-900">{form.fullName || 'Student'}</p>
          <p className="text-sm text-gray-500">{form.collegeName} · {form.course}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <ReviewItem label="Roll Number" value={form.rollNumber} />
        <ReviewItem label="Year" value={form.yearOfStudy} />
        <ReviewItem label="City" value={form.city} />
        <ReviewItem label="Phone" value={form.phone} />
      </div>

      <div className="flex gap-3">
        <StatusBadge label="ID Card" done={idUploaded} />
        <StatusBadge label="Face Verified" done={faceUploaded} />
        <StatusBadge label={`Profile ${completeness}%`} done={completeness >= 60} />
      </div>

      <div className={`rounded-xl p-4 text-sm ${completeness >= 60 ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-yellow-50 border border-yellow-200 text-yellow-700'}`}>
        {completeness >= 60
          ? '🎉 Great profile! You can now browse all verified job listings.'
          : '💡 Your profile is set up. You can complete more details later from your dashboard.'}
      </div>

      <button onClick={onFinish} className="bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors">
        Go to Dashboard →
      </button>
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Field({ label, name, value, onChange, required, type = 'text', placeholder }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-gray-800 mt-0.5">{value || '—'}</p>
    </div>
  );
}

function StatusBadge({ label, done }: { label: string; done: boolean }) {
  return (
    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
      {done ? '✓' : '○'} {label}
    </span>
  );
}
