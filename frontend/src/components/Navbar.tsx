"use client";
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'recruiter') return '/recruiter/dashboard';
    return '/student/dashboard';
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <Link href="/" className="text-xl font-extrabold text-blue-600 flex items-center gap-2">
          <span>TrustBridge</span>
          {user?.role === 'admin' && (
            <span className="bg-slate-900 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Admin
            </span>
          )}
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-blue-600 transition-colors">Listings</Link>
          <Link href="/trends" className="hover:text-blue-600 transition-colors">Trends</Link>

          {user?.role === 'admin' && (
            <Link
              href="/admin/dashboard"
              className="px-2.5 py-1 bg-slate-900 text-blue-400 font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <span>🛡️</span> Admin Console
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href={getDashboardLink()}
                className="hover:text-blue-600 transition-colors flex items-center gap-2"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name || 'User'} className="w-7 h-7 rounded-full inline object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                    {(user.name || user.email || 'U')[0]?.toUpperCase()}
                  </div>
                )}
                <span>{(user.name || user.email || 'User').split(' ')[0]}</span>
              </Link>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-red-500 text-xs font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="hover:text-blue-600 transition-colors">Login</Link>
              <Link
                href="/post-job"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Post a Job
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            aria-label="Toggle Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-5 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-gray-700 py-1"
          >
            Listings
          </Link>
          <Link
            href="/trends"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-gray-700 py-1"
          >
            Trends
          </Link>

          {user?.role === 'admin' && (
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-blue-600 py-1"
            >
              🛡️ Admin Console
            </Link>
          )}

          {user ? (
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <Link
                href={getDashboardLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-gray-800"
              >
                Dashboard ({((user.name || user.email || 'User').split(' ')[0])})
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="text-xs text-red-500 font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-sm font-medium text-gray-700 py-2 border border-gray-200 rounded-lg"
              >
                Login
              </Link>
              <Link
                href="/post-job"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-sm font-medium text-white bg-blue-600 py-2 rounded-lg"
              >
                Post a Job
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
