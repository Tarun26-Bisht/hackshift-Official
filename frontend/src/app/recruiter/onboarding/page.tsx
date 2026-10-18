"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FormSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';
import { API_URL } from '@/lib/api';

const STEPS = ['Company Identity', 'Online Presence', 'Legal & Address', 'HR Contact & Docs'];

const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Education', 'E-commerce', 'Manufacturing', 'Media', 'Consulting', 'Real Estate', 'Other'];

export default function OnboardingPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [completeness, setCompleteness] = useState(0);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    // Step 1
    legalName: '', brandName: '', companyType: '', industry: '',
    foundedYear: '', companySize: '', description: '',
    // Step 2
    website: '', linkedIn: '', twitter: '', github: '',
    // Step 3
    country: '', registrationNumber: '', gstOrTaxId: '',
    address: { street: '', city: '', state: '', pincode: '' },
    // Step 4
    hrName: '', hrDesignation: '', hrPhone: '', hrEmail: '',
  });

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
    fetch(`${API_URL}/api/company/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(data => {
      if (data.profile) {
        const p = data.profile;
        setCompleteness(p.completenessScore || 0);
        setForm(prev => ({
          ...prev,
          legalName: p.legalName || '', brandName: p.brandName || '',
          companyType: p.companyType || '', industry: p.industry || '',
          foundedYear: p.foundedYear || '', companySize: p.companySize || '',
          description: p.description || '', website: p.website || '',
          linkedIn: p.linkedIn || '', twitter: p.twitter || '',
          github: p.github || '', country: p.country || '',
          registrationNumber: p.registrationNumber || '', gstOrTaxId: p.gstOrTaxId || '',
          address: p.address || { street: '', city: '', state: '', pincode: '' },
          hrName: p.hrName || '', hrDesignation: p.hrDesignation || '',
          hrPhone: p.hrPhone || '', hrEmail: p.hrEmail || '',
        }));
        if (p.logoUrl) setLogoPreview(`${API_URL}${p.logoUrl}`);
      }
    });
  }, [token]);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const setAddr = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, address: { ...prev.address, [e.target.name]: e.target.value } }));
  };

  const saveStep = async (andNext = true) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/company/step`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Save failed'); return; }
      setCompleteness(data.completenessScore);
      if (andNext) {
        if (step < 3) setStep(s => s + 1);
        else await handleFileUploads();
      }
    } catch { setError('Could not connect to server.'); }
    finally { setSaving(false); }
  };

  const handleFileUploads = async () => {
    if (logoFile) {
      const fd = new FormData();
      fd.append('logo', logoFile);
      await fetch(`${API_URL}/api/company/upload/logo`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
    }
    if (docFile) {
      const fd = new FormData();
      fd.append('document', docFile);
      await fetch(`${API_URL}/api/company/upload/document`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
    }
    router.push('/recruiter/dashboard');
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
  };

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <FormSkeleton />
      </main>
    );
  }

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gray-50">
        {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-extrabold text-blue-600">TrustBridge</span>
        <div className="flex items-center gap-4">
          <CompletenessBar score={completeness} />
          <button onClick={() => router.push('/recruiter/dashboard')} className="text-sm text-gray-400 hover:text-gray-600">
            Skip for now →
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => setStep(i)}
                className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center transition-colors ${
                  i === step ? 'bg-blue-600 text-white' :
                  i < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </button>
              <span className={`text-xs hidden sm:block ${i === step ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>{s}</span>
              {i < 3 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{STEPS[step]}</h2>
          <p className="text-sm text-gray-400 mb-8">
            {['Tell us about your company.', 'Where can people find you online?', 'Legal registration details.', 'Who handles hiring?'][step]}
          </p>

          {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>}

          {step === 0 && <StepOne form={form} set={set} />}
          {step === 1 && <StepTwo form={form} set={set} />}
          {step === 2 && <StepThree form={form} set={set} setAddr={setAddr} />}
          {step === 3 && (
            <StepFour
              form={form} set={set}
              logoPreview={logoPreview} onLogoChange={handleLogoChange}
              docFile={docFile} onDocChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocFile(e.target.files?.[0] || null)}
            />
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="text-sm text-gray-500 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30"
            >
              ← Back
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => saveStep(false)}
                disabled={saving}
                className="text-sm text-blue-600 px-4 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => saveStep(true)}
                disabled={saving}
                className="bg-blue-600 text-white text-sm font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : step === 3 ? 'Finish & Go to Dashboard' : 'Save & Continue →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </ErrorBoundary>
);
}

// ─── Step Components ──────────────────────────────────────────────────────────

function StepOne({ form, set }: any) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Legal Company Name *" name="legalName" value={form.legalName} onChange={set} required />
        <Field label="Brand / Trade Name" name="brandName" value={form.brandName} onChange={set} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Company Type *" name="companyType" value={form.companyType} onChange={set}
          options={['startup', 'mnc', 'agency', 'ngo', 'other']} />
        <SelectField label="Industry *" name="industry" value={form.industry} onChange={set}
          options={INDUSTRIES} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Founded Year" name="foundedYear" value={form.foundedYear} onChange={set} placeholder="e.g. 2018" />
        <SelectField label="Company Size" name="companySize" value={form.companySize} onChange={set}
          options={['1-10', '11-50', '51-200', '201-500', '500+']} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Company Description *</label>
        <textarea name="description" value={form.description} onChange={set} rows={4}
          placeholder="What does your company do? What's your mission?"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        <p className="text-xs text-gray-400">{form.description.length}/500 characters</p>
      </div>
    </div>
  );
}

function StepTwo({ form, set }: any) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Official Website *" name="website" value={form.website} onChange={set} type="url" placeholder="https://company.com" />
      <Field label="LinkedIn Company Page *" name="linkedIn" value={form.linkedIn} onChange={set} type="url" placeholder="https://linkedin.com/company/..." />
      <Field label="Twitter / X Handle" name="twitter" value={form.twitter} onChange={set} placeholder="@company" />
      <Field label="GitHub Organization" name="github" value={form.github} onChange={set} type="url" placeholder="https://github.com/company" />
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-600">
        💡 Adding your website and LinkedIn increases your trust score significantly and helps students verify your company.
      </div>
    </div>
  );
}

function StepThree({ form, set, setAddr }: any) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Country of Incorporation *" name="country" value={form.country} onChange={set} placeholder="e.g. India" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Company Registration No. (CIN)" name="registrationNumber" value={form.registrationNumber} onChange={set} placeholder="e.g. U72900MH2018..." />
        <Field label="GST / Tax ID" name="gstOrTaxId" value={form.gstOrTaxId} onChange={set} placeholder="e.g. 27AAPFU0939F1ZV" />
      </div>
      <p className="text-sm font-semibold text-gray-700 -mb-2">Registered Address</p>
      <Field label="Street Address" name="street" value={form.address.street} onChange={setAddr} placeholder="123 MG Road" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="City" name="city" value={form.address.city} onChange={setAddr} placeholder="Mumbai" />
        <Field label="State" name="state" value={form.address.state} onChange={setAddr} placeholder="Maharashtra" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Pincode / ZIP" name="pincode" value={form.address.pincode} onChange={setAddr} placeholder="400001" />
      </div>
    </div>
  );
}

function StepFour({ form, set, logoPreview, onLogoChange, docFile, onDocChange }: any) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="HR Contact Name *" name="hrName" value={form.hrName} onChange={set} placeholder="e.g. Priya Sharma" />
        <Field label="HR Designation" name="hrDesignation" value={form.hrDesignation} onChange={set} placeholder="e.g. Talent Acquisition Lead" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="HR Phone *" name="hrPhone" value={form.hrPhone} onChange={set} type="tel" placeholder="+91 98765 43210" />
        <Field label="HR Official Email *" name="hrEmail" value={form.hrEmail} onChange={set} type="email" placeholder="hr@company.com" />
      </div>

      {/* Logo Upload */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Company Logo</label>
        <div className="flex items-center gap-4">
          {logoPreview && <img src={logoPreview} alt="logo" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />}
          <label className="cursor-pointer border-2 border-dashed border-gray-200 rounded-xl px-6 py-4 text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
            {logoPreview ? 'Change Logo' : '📷 Upload Logo (PNG/JPG, max 5MB)'}
            <input type="file" accept="image/*" onChange={onLogoChange} className="hidden" />
          </label>
        </div>
      </div>

      {/* Document Upload */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Certificate of Incorporation</label>
        <label className="cursor-pointer border-2 border-dashed border-gray-200 rounded-xl px-6 py-4 text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
          {docFile ? `✅ ${docFile.name}` : '📄 Upload Certificate (PDF/JPG, max 5MB)'}
          <input type="file" accept=".pdf,image/*" onChange={onDocChange} className="hidden" />
        </label>
        <p className="text-xs text-gray-400">Accepted: Certificate of Incorporation, DPIIT / Startup India certificate</p>
      </div>

      <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-xs text-green-700">
        🔒 Your documents are stored securely and only used for platform verification purposes.
      </div>
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function CompletenessBar({ score }: { score: number }) {
  const color = score >= 60 ? 'bg-green-500' : score >= 30 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">Profile: {score}%</span>
      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, required, type = 'text', placeholder }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select name={name} value={value} onChange={onChange}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">Select...</option>
        {options.map((o: string) => <option key={o} value={o.toLowerCase()}>{o}</option>)}
      </select>
    </div>
  );
}
