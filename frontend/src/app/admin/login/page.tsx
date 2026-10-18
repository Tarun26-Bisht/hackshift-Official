"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';

export default function AdminLoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      router.replace('/admin/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        return setError(data.error || 'Authentication failed');
      }

      if (data.user?.role !== 'admin') {
        return setError('Access Denied: This portal is strictly for platform administrators.');
      }

      login(data.token, data.user);
    } catch {
      setError('Could not connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const autofillDemo = () => {
    setForm({
      email: 'admin@trustbridge.com',
      password: 'Admin@123456',
    });
  };

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            🛡️ Platform Administration
          </div>
          <h1 className="text-3xl font-extrabold text-white">TrustBridge Control</h1>
          <p className="text-slate-400 mt-1 text-sm">Security clearance & system governance</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="admin@trustbridge.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-xs">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                'Authenticate as Admin'
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-6 pt-5 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <span>Hackathon Demo Admin:</span>
            <button
              type="button"
              onClick={autofillDemo}
              className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2"
            >
              Fill Credentials
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">
              ← Return to TrustBridge Public Site
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
