"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';

type Role = 'student' | 'recruiter';

export default function SignupPage() {
  const { login } = useAuth();
  const [role, setRole] = useState<Role>('student');
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    companyName: '', companyWebsite: '', companyType: '',
    collegeName: '', course: '', yearOfStudy: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Signup failed');
      login(data.token, data.user, true); // isNew = true → go to onboarding
    } catch {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const googleSignup = () => {
    window.location.href = `${API_URL}/api/auth/google?role=${role}`;
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-extrabold text-blue-600">TrustBridge</Link>
          <p className="text-gray-500 mt-1 text-sm">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Role Toggle */}
          <div className="flex rounded-lg border border-gray-200 p-1 mb-6">
            {(['student', 'recruiter'] as Role[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors capitalize ${role === r ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {r === 'student' ? '🎓 Student' : '💼 Recruiter'}
              </button>
            ))}
          </div>

          {/* Google Signup */}
          <button onClick={googleSignup} className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-6">
            <GoogleIcon />
            Sign up with Google as {role === 'student' ? 'Student' : 'Recruiter'}
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Full Name *" name="name" value={form.name} onChange={set} required />
            <Field label="Email *" name="email" type="email" value={form.email} onChange={set} required />
            <Field label="Password *" name="password" type="password" value={form.password} onChange={set} required placeholder="Min 8 characters" />

            {role === 'recruiter' && (
              <>
                <Field label="Company Name *" name="companyName" value={form.companyName} onChange={set} required />
                <Field label="Company Website" name="companyWebsite" type="url" value={form.companyWebsite} onChange={set} placeholder="https://company.com" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-800">Company Type</label>
                  <select name="companyType" value={form.companyType} onChange={set} className="border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 font-medium bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Select type</option>
                    <option value="startup">Startup</option>
                    <option value="mnc">MNC</option>
                    <option value="agency">Agency</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </>
            )}

            {role === 'student' && (
              <>
                <Field label="College Name" name="collegeName" value={form.collegeName} onChange={set} placeholder="e.g. IIT Delhi" />
                <Field label="Course" name="course" value={form.course} onChange={set} placeholder="e.g. B.Tech CSE" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-800">Year of Study</label>
                  <select name="yearOfStudy" value={form.yearOfStudy} onChange={set} className="border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 font-medium bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Select year</option>
                    {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function Field({ label, name, value, onChange, required, type = 'text', placeholder }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-800">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
        className="border border-gray-300 rounded-lg px-3.5 py-2 text-sm text-gray-900 font-medium placeholder:text-gray-400 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.8 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
    </svg>
  );
}
