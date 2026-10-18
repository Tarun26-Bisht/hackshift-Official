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
    <header className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 text-white sticky top-0 z-50 transition-all">
      {/* Top subtle highlight line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-blue-500/40 via-indigo-500/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                <span className="text-white font-black text-sm">TB</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white group-hover:text-blue-400 transition-colors">
                  TrustBridge
                </span>
                <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full shadow-2xs">
                  ADMIN
                </span>
              </div>
            </Link>

            {/* Desktop Nav Tabs */}
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
              {navLinks.map(link => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-sm">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Actions & Status */}
          <div className="hidden md:flex items-center gap-3.5">
            {/* Live System Heartbeat Pill */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>AI Engine Live</span>
            </div>

            <Link
              href="/"
              target="_blank"
              className="text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5 font-medium shadow-2xs"
            >
              <span>Public Portal</span>
              <span className="text-slate-500 text-xs">↗</span>
            </Link>

            <div className="h-4 w-px bg-slate-800" />

            {/* User Profile & Sign Out */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1">
                <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-[11px] text-white">
                  {user?.name?.[0] || 'A'}
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-slate-200 leading-none">{user?.name || 'Administrator'}</p>
                  <p className="text-[10px] text-slate-400 leading-none mt-1 truncate max-w-[120px]">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={logout}
                className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 rounded-lg transition-colors font-semibold shadow-2xs"
                title="Sign out of Admin Session"
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
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive(link.href) ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-900'
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
              className="text-xs text-slate-400 hover:text-white py-1 flex items-center justify-between"
            >
              <span>View Public Platform</span>
              <span>↗</span>
            </Link>
            <button
              onClick={logout}
              className="text-left text-xs text-rose-400 py-1 font-semibold"
            >
              Sign Out ({user?.name})
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
