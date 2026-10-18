"use client";
import { useState, useEffect, useRef } from 'react';
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
  const [isPdf, setIsPdf] = useState(false);

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
    })
      .then(r => r.json())
      .then(data => {
        if (data.profile) {
          const p = data.profile;
          setCompleteness(p.completenessScore || 0);
          setForm(prev => ({
            ...prev,
            fullName: p.fullName || user?.name || '',
            collegeName: p.collegeName || user?.collegeName || '',
            course: p.course || user?.course || '',
            yearOfStudy: p.yearOfStudy || user?.yearOfStudy || '',
            rollNumber: p.rollNumber || '',
            city: p.city || '',
            state: p.state || '',
            phone: p.phone || '',
            linkedIn: p.linkedIn || '',
            github: p.github || '',
            bio: p.bio || '',
          }));
          if (p.idCardUrl) {
            setIdCardPreview(`${API_URL}${p.idCardUrl}`);
            setIdUploaded(true);
            setIsPdf(p.idCardUrl.toLowerCase().endsWith('.pdf'));
          }
          if (p.facePhotoUrl) {
            setFaceDataUrl(`${API_URL}${p.facePhotoUrl}`);
            setFaceUploaded(true);
            setLivenessChallenge(p.livenessChallenge || 'verified');
          }
        }
      })
      .catch(err => console.error('Fetch student profile error:', err));
  }, [token, user]);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const saveStep1 = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/student/step`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save personal details.');
        return;
      }
      setCompleteness(data.completenessScore || 0);
      setStep(1);
    } catch {
      setError('Could not connect to server.');
    } finally {
      setSaving(false);
    }
  };

  const uploadIdCard = async () => {
    // If no new file selected and not already uploaded, require an ID card
    if (!idCardFile && !idUploaded) {
      setError('Please select or upload your college ID card before continuing.');
      return;
    }

    // If no new file was chosen but already uploaded, simply advance
    if (!idCardFile && idUploaded) {
      setStep(2);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      if (idCardFile) {
        fd.append('idCard', idCardFile);
      }
      fd.append('idCardType', idCardType);

      const res = await fetch(`${API_URL}/api/student/upload/id-card`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to upload ID card.');
        return;
      }

      setCompleteness(data.completenessScore || 0);
      setIdUploaded(true);
      if (data.url) {
        setIdCardPreview(`${API_URL}${data.url}`);
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Could not connect to server.');
    } finally {
      setSaving(false);
    }
  };

  const uploadFace = async (photoDataUrl: string, challenge: string) => {
    setFaceDataUrl(photoDataUrl);
    setLivenessChallenge(challenge);
    setSaving(true);
    setError('');
    try {
      // Convert dataUrl to blob
      const blob = await (await fetch(photoDataUrl)).blob();
      const fd = new FormData();
      fd.append('face', blob, 'selfie.jpg');
      fd.append('livenessVerified', 'true');
      fd.append('challenge', challenge);

      const res = await fetch(`${API_URL}/api/student/upload/face`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save photo verification.');
        return;
      }

      setCompleteness(data.completenessScore || 0);
      setFaceUploaded(true);
      setStep(3);
    } catch {
      setError('Could not connect to server.');
    } finally {
      setSaving(false);
    }
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
      <main className="min-h-screen bg-gray-50 pb-16">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <span className="text-xl font-extrabold text-blue-600">TrustBridge</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-semibold">Verification: {completeness}%</span>
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${scoreColor}`}
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => router.push('/student/dashboard')}
              className="text-sm text-gray-500 hover:text-gray-800 font-medium"
            >
              Skip for now →
            </button>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 py-8">
          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-all ${
                    i === step
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : i < step
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span
                  className={`text-xs hidden sm:block truncate ${
                    i === step ? 'text-blue-600 font-bold' : 'text-gray-400'
                  }`}
                >
                  {s}
                </span>
                {i < 3 && (
                  <div
                    className={`flex-1 h-0.5 ${i < step ? 'bg-emerald-400' : 'bg-gray-200'}`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">{STEPS[step]}</h2>
              <p className="text-xs text-gray-500 mt-1">
                {[
                  'Provide your academic and contact details for recruiter matching.',
                  'Upload your college ID, admission slip, or government student ID.',
                  'Take a quick photo or selfie to confirm your identity.',
                  'Review your verified credentials and finalize onboarding.',
                ][step]}
              </p>
            </div>

            {error && (
              <div className="mb-5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <span>⚠️ {error}</span>
                <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold ml-2">
                  ×
                </button>
              </div>
            )}

            {/* Step 0: Personal Details */}
            {step === 0 && <StepOne form={form} set={set} />}

            {/* Step 1: ID Card Upload */}
            {step === 1 && (
              <StepTwo
                idCardPreview={idCardPreview}
                idCardType={idCardType}
                idCardFile={idCardFile}
                isPdf={isPdf}
                idUploaded={idUploaded}
                onTypeChange={(e: React.ChangeEvent<HTMLSelectElement>) => setIdCardType(e.target.value)}
                onFileChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setError('');
                    setIdCardFile(f);
                    const isPdfFile = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
                    setIsPdf(isPdfFile);
                    if (!isPdfFile) {
                      setIdCardPreview(URL.createObjectURL(f));
                    } else {
                      setIdCardPreview('');
                    }
                  }
                }}
              />
            )}

            {/* Step 2: Face Verification */}
            {step === 2 && !faceUploaded && <LivenessCheck onVerified={uploadFace} />}
            {step === 2 && faceUploaded && (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="relative">
                  <img
                    src={faceDataUrl}
                    alt="face"
                    className="w-36 h-36 rounded-full object-cover border-4 border-emerald-500 shadow-md"
                  />
                  <span className="absolute bottom-1 right-1 bg-emerald-500 text-white rounded-full p-1.5 shadow">
                    ✓
                  </span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 text-center max-w-sm">
                  <p className="text-emerald-800 font-bold text-sm">✅ Photo Verified Successfully!</p>
                  <p className="text-emerald-600 text-xs mt-0.5">
                    Verification Method: <span className="font-semibold capitalize">{livenessChallenge.replace(/_/g, ' ')}</span>
                  </p>
                </div>
                <div className="flex gap-3 mt-2 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setFaceUploaded(false);
                      setFaceDataUrl('');
                    }}
                    className="flex-1 border border-gray-300 text-gray-700 font-semibold text-xs py-2.5 rounded-xl hover:bg-gray-50"
                  >
                    Retake Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 bg-blue-600 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-blue-700 shadow-md"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Finish */}
            {step === 3 && (
              <StepReview
                form={form}
                idCardPreview={idCardPreview}
                isPdf={isPdf}
                faceDataUrl={faceDataUrl}
                idUploaded={idUploaded}
                faceUploaded={faceUploaded}
                completeness={completeness}
                onFinish={() => {
                  try {
                    const stored = localStorage.getItem('tb_user');
                    if (stored) {
                      const u = JSON.parse(stored);
                      u.isVerified = true;
                      localStorage.setItem('tb_user', JSON.stringify(u));
                    }
                  } catch (e) {}
                  window.location.href = '/student/dashboard';
                }}
              />
            )}

            {/* Navigation buttons for Step 0 and Step 1 */}
            {(step === 0 || step === 1) && (
              <div className="flex justify-between items-center mt-8 pt-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep(s => Math.max(0, s - 1));
                  }}
                  disabled={step === 0}
                  className="text-xs font-semibold text-gray-500 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={step === 0 ? saveStep1 : uploadIdCard}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save & Continue →</span>
                  )}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name *" name="fullName" value={form.fullName} onChange={set} required />
        <Field label="Phone *" name="phone" value={form.phone} onChange={set} type="tel" placeholder="+91 98765 43210" />
      </div>
      <Field label="College / University *" name="collegeName" value={form.collegeName} onChange={set} placeholder="e.g. IIT Delhi" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Course / Degree *" name="course" value={form.course} onChange={set} placeholder="e.g. B.Tech CSE, MBA, BCA" />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-800">Year of Study</label>
          <select
            name="yearOfStudy"
            value={form.yearOfStudy}
            onChange={set}
            className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select year</option>
            {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Roll / Student ID Number" name="rollNumber" value={form.rollNumber} onChange={set} placeholder="e.g. 2021CSE042" />
        <Field label="City" name="city" value={form.city} onChange={set} placeholder="e.g. New Delhi" />
      </div>
      <Field label="State" name="state" value={form.state} onChange={set} placeholder="e.g. Delhi" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="LinkedIn Profile" name="linkedIn" value={form.linkedIn} onChange={set} type="url" placeholder="https://linkedin.com/in/..." />
        <Field label="GitHub Profile" name="github" value={form.github} onChange={set} type="url" placeholder="https://github.com/..." />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-gray-800">Short Bio</label>
        <textarea
          name="bio"
          value={form.bio}
          onChange={set}
          rows={3}
          placeholder="Tell recruiters about your interests, key projects, and career aspirations..."
          className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium placeholder:text-gray-400 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
    </div>
  );
}

function StepTwo({
  idCardPreview,
  idCardType,
  idCardFile,
  isPdf,
  idUploaded,
  onTypeChange,
  onFileChange,
}: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-gray-800">Select Document Type *</label>
        <select
          value={idCardType}
          onChange={onTypeChange}
          className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="college_id">Official College ID Card</option>
          <option value="aadhar">Aadhar Card</option>
          <option value="passport">Passport</option>
          <option value="other">College Admission Slip / Fee Receipt</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
          <span>Upload Document Photo or PDF *</span>
          {idUploaded && (
            <span className="text-emerald-700 bg-emerald-100 text-[10px] px-2 py-0.5 rounded-full font-bold">
              ✓ Document Attached
            </span>
          )}
        </label>

        {/* Selected File or Existing Preview Display */}
        {isPdf ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📄</span>
              <div>
                <p className="text-xs font-bold text-gray-900">
                  {idCardFile ? idCardFile.name : 'College_ID_Document.pdf'}
                </p>
                <p className="text-[11px] text-gray-500">
                  PDF Document Verified {idCardFile ? `• ${(idCardFile.size / 1024).toFixed(1)} KB` : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Change PDF
            </button>
          </div>
        ) : idCardPreview ? (
          <div className="relative border border-gray-200 rounded-2xl p-2 bg-gray-50 flex flex-col items-center">
            <img
              src={idCardPreview}
              alt="ID Card Preview"
              className="w-full max-h-56 object-contain rounded-xl"
            />
            <div className="flex items-center justify-between w-full px-2 pt-2 text-xs">
              <span className="text-gray-500 font-medium truncate max-w-[200px]">
                {idCardFile ? idCardFile.name : 'Verified College ID'}
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 font-bold hover:underline"
              >
                Change Image
              </button>
            </div>
          </div>
        ) : null}

        {/* Upload Trigger Dropzone */}
        {(!idCardPreview && !isPdf) && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl p-8 text-center transition-all bg-gray-50/50 hover:bg-blue-50/30 flex flex-col items-center justify-center gap-2"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl">
              📷
            </div>
            <p className="text-xs font-bold text-gray-800">
              Click to browse your College ID photo or PDF
            </p>
            <p className="text-[11px] text-gray-400">
              Supports JPG, PNG, WEBP, and PDF (Max 10MB)
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.pdf"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
        <span>🔒</span>
        <span>
          Your document is securely encrypted and used only to verify your student status. It is never displayed publicly.
        </span>
      </div>
    </div>
  );
}

function StepReview({
  form,
  idCardPreview,
  isPdf,
  faceDataUrl,
  idUploaded,
  faceUploaded,
  completeness,
  onFinish,
}: any) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
        {faceDataUrl ? (
          <img
            src={faceDataUrl}
            alt="face"
            className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold">
            {(form.fullName || 'S')[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <p className="font-extrabold text-gray-900 text-base">{form.fullName || 'Student'}</p>
            {idUploaded && faceUploaded && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                ✓ Verified
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {form.collegeName} • {form.course}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <ReviewItem label="Roll Number" value={form.rollNumber} />
        <ReviewItem label="Year of Study" value={form.yearOfStudy} />
        <ReviewItem label="City" value={form.city} />
        <ReviewItem label="Phone" value={form.phone} />
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <StatusBadge label="College ID Card" done={idUploaded} />
        <StatusBadge label="Photo & Liveness Check" done={faceUploaded} />
        <StatusBadge label={`Profile Score: ${completeness}%`} done={completeness >= 60} />
      </div>

      {idUploaded && faceUploaded ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl shrink-0 font-bold">
            ✓
          </div>
          <div>
            <p className="font-bold text-emerald-900 text-xs">100% Student Verified!</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Your profile has earned the TrustBridge Verified Student badge. You can now apply for government internships and access free IBM, Infosys, and Swayam certifications.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800">
          ⚠️ Complete both ID card upload and photo verification to unlock the Verified Student badge.
        </div>
      )}

      <button
        onClick={onFinish}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md text-xs mt-2"
      >
        Complete Onboarding & Go to Dashboard →
      </button>
    </div>
  );
}

// ─── Shared UI Helpers ────────────────────────────────────────────────────────

function Field({ label, name, value, onChange, required, type = 'text', placeholder }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-gray-800">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium placeholder:text-gray-400 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
      <p className="text-[10px] uppercase font-bold text-gray-400">{label}</p>
      <p className="font-semibold text-gray-800 mt-0.5 truncate">{value || '—'}</p>
    </div>
  );
}

function StatusBadge({ label, done }: { label: string; done: boolean }) {
  return (
    <span
      className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
        done ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
      }`}
    >
      <span>{done ? '✓' : '○'}</span>
      <span>{label}</span>
    </span>
  );
}
