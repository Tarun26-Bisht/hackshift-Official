import React from 'react';
import TrustBadge from './TrustBadge';

interface Job {
  _id?: string;
  id?: string | number;
  title: string;
  company?: string;
  companyName?: string;
  description: string;
  salary?: string;
  duration?: string;
  jobType?: string;
  location?: string;
  link?: string;
  trustScore: number;
  skills?: string[];
  aiResult?: { skills?: string[] };
  isGovernment?: boolean;
  verifiedBadge?: string;
  portalName?: string;
  eligibility?: string;
  applicationFee?: string;
  deadline?: string | Date;
  daysLeft?: number | null;
  isClosingSoon?: boolean;
  isExpired?: boolean;
}

export default function JobCard({ job }: { job: Job }) {
  const company = job.companyName || job.company || 'Verified Employer';
  const skillsList = (job.skills && job.skills.length > 0)
    ? job.skills
    : (job.aiResult?.skills || []);

  const isGov = Boolean(job.isGovernment || job.jobType?.toLowerCase().includes('government'));
  const badgeText = job.verifiedBadge ? job.verifiedBadge : (isGov ? '🇮🇳 Central Govt Scheme' : '');

  // Check if deadline is a rolling text description
  const isRollingText = typeof job.deadline === 'string' && (
    job.deadline.toLowerCase().includes('rolling') ||
    job.deadline.toLowerCase().includes('cycle') ||
    job.deadline.toLowerCase().includes('cohort') ||
    job.deadline.toLowerCase().includes('ongoing') ||
    job.deadline.toLowerCase().includes('open all year') ||
    job.deadline.toLowerCase().includes('active') ||
    job.deadline.toLowerCase().includes('calendar month')
  );

  // Calculate daysLeft fallback if not provided by backend
  let daysLeft = job.daysLeft;
  let isExpired = Boolean(job.isExpired);

  if (!isRollingText && daysLeft === undefined && job.deadline) {
    const d = new Date(job.deadline);
    if (!isNaN(d.getTime())) {
      const diffMs = d.getTime() - Date.now();
      daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      isExpired = daysLeft < 0;
    }
  }

  // Render countdown badge
  let countdownBadge = null;
  if (isRollingText) {
    countdownBadge = (
      <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
        🏛️ {job.deadline}
      </span>
    );
  } else if (isExpired || (typeof daysLeft === 'number' && daysLeft < 0)) {
    countdownBadge = (
      <span className="text-[11px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
        🚫 Closed
      </span>
    );
  } else if (typeof daysLeft === 'number' && daysLeft <= 1) {
    countdownBadge = (
      <span className="text-[11px] font-extrabold text-red-700 bg-red-100 border border-red-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse shadow-2xs">
        🔥 Closing in 24h!
      </span>
    );
  } else if (typeof daysLeft === 'number' && daysLeft <= 5) {
    countdownBadge = (
      <span className="text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
        ⏳ {daysLeft} Days Left for Closing
      </span>
    );
  } else if (typeof daysLeft === 'number' && daysLeft > 5 && job.deadline) {
    const d = new Date(job.deadline);
    const dateFormatted = !isNaN(d.getTime())
      ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : String(job.deadline);
    countdownBadge = (
      <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
        📅 Closes {dateFormatted}
      </span>
    );
  } else if (job.deadline && typeof job.deadline === 'string') {
    countdownBadge = (
      <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
        📅 {job.deadline}
      </span>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-6 flex flex-col justify-between h-full transition-all duration-200 relative overflow-hidden group hover:shadow-md ${
        isGov
          ? 'bg-gradient-to-b from-orange-50/30 via-white to-white border-orange-200/80 hover:border-orange-300'
          : isExpired
            ? 'bg-gray-50/80 border-gray-200 opacity-75'
            : typeof daysLeft === 'number' && daysLeft <= 1
              ? 'bg-gradient-to-b from-red-50/40 via-white to-white border-red-200 hover:border-red-300 shadow-2xs'
              : typeof daysLeft === 'number' && daysLeft <= 5
                ? 'bg-gradient-to-b from-amber-50/30 via-white to-white border-amber-200 hover:border-amber-300 shadow-2xs'
                : 'bg-white border-gray-200 hover:border-gray-300 shadow-2xs'
      }`}
    >
      <div>
        {/* Top Header Tag Banner */}
        {(isGov || countdownBadge) && (
          <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isGov && (
                <span className="text-[11px] font-bold text-orange-900 bg-orange-100/90 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  {badgeText}
                </span>
              )}
              {countdownBadge}
            </div>
            {isGov ? (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                {job.applicationFee || '₹0 Fee (Free)'}
              </span>
            ) : (
              job.location && (
                <span className="text-[11px] font-medium text-gray-500">
                  📍 {job.location}
                </span>
              )
            )}
          </div>
        )}

        {/* Title and Trust Badge */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-lg leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
              {job.title}
            </h2>
            <p className="text-xs font-semibold text-gray-500 mt-1 flex items-center gap-1.5 truncate">
              {isGov && <span>🏛️</span>}
              <span className="truncate">{company}</span>
            </p>
          </div>
          <TrustBadge score={job.trustScore || (isGov ? 100 : 75)} />
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed mt-2.5 mb-3.5">
          {job.description}
        </p>

        {/* Eligibility (for Govt or Specialized roles) */}
        {job.eligibility && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 mb-3.5 leading-relaxed">
            <span className="font-bold text-slate-900 block mb-0.5">Eligibility Criteria:</span>
            {job.eligibility}
          </div>
        )}

        {/* Key Metadata Badges */}
        <div className="flex flex-wrap gap-1.5 text-xs font-medium text-gray-700 mb-3">
          {job.salary && (
            <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
              💰 {job.salary}
            </span>
          )}
          {job.duration && (
            <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
              ⏱ {job.duration}
            </span>
          )}
          {job.jobType && (
            <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
              💼 {job.jobType}
            </span>
          )}
          {job.location && (
            <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
              📍 {job.location}
            </span>
          )}
        </div>

        {/* Skills */}
        {skillsList.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {skillsList.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="bg-blue-50 text-blue-700 text-[11px] px-2.5 py-0.5 rounded-full font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      {job.link && (
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-auto">
          {isExpired ? (
            <span className="text-sm font-semibold text-gray-400 flex items-center gap-1 cursor-not-allowed">
              <span>Applications Closed</span>
            </span>
          ) : (
            <a
              href={job.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm font-bold flex items-center gap-1.5 transition-colors ${
                isGov
                  ? 'text-orange-700 hover:text-orange-800'
                  : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              <span>{isGov ? 'Apply on Official Portal' : 'View Verified Listing'}</span>
              <span className="text-xs">↗</span>
            </a>
          )}
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isExpired
                ? 'text-gray-500 bg-gray-100'
                : isGov
                  ? 'text-orange-800 bg-orange-100/70'
                  : 'text-emerald-800 bg-emerald-100/70'
            }`}
          >
            {isExpired ? 'Closed' : isGov ? '🇮🇳 Govt Portal' : 'AI Verified ✓'}
          </span>
        </div>
      )}
    </div>
  );
}
