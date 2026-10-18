"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function AdminNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Overview', href: '/admin/dashboard', icon: '📊' },
    { label: 'Recruiters', href: '/admin/recruiters', icon: '🏢' },
    { label: 'Students', href: '/admin/students', icon: '🎓' },
    { label: 'Job Listings & Audit', href: '/admin/jobs', icon: '💼' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                TrustBridge
              </span>
              <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full">
                ADMIN
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-slate-800 text-blue-400 border border-slate-700/80 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <span>View Public Platform</span>
              <span>↗</span>
            </Link>

            <div className="h-4 w-px bg-slate-800" />

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">
                  {user?.name?.[0] || 'A'}
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-slate-200">{user?.name || 'Administrator'}</p>
                  <p className="text-[11px] text-slate-400">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={logout}
                className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive(link.href) ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-slate-400 hover:text-white py-1"
            >
              View Public Platform ↗
            </Link>
            <button
              onClick={logout}
              className="text-left text-xs text-rose-400 py-1"
            >
              Sign Out ({user?.name})
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
