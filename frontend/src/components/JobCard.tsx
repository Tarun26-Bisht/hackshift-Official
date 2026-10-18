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
}

export default function JobCard({ job }: { job: Job }) {
  const company = job.companyName || job.company || 'Verified Employer';
  const skillsList = (job.skills && job.skills.length > 0)
    ? job.skills
    : (job.aiResult?.skills || []);

  const isGov = Boolean(job.isGovernment || job.jobType?.toLowerCase().includes('government'));
  const badgeText = job.verifiedBadge ? job.verifiedBadge : (isGov ? '🇮🇳 Central Govt Scheme' : '');

  return (
    <div
      className={`rounded-2xl border p-6 flex flex-col justify-between h-full transition-all duration-200 relative overflow-hidden group hover:shadow-md ${
        isGov
          ? 'bg-gradient-to-b from-orange-50/30 via-white to-white border-orange-200/80 hover:border-orange-300'
          : 'bg-white border-gray-200 hover:border-gray-300 shadow-2xs'
      }`}
    >
      <div>
        {/* Top Header Tag Banner */}
        {isGov && (
          <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-orange-100">
            <span className="text-[11px] font-bold text-orange-900 bg-orange-100/90 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              {badgeText}
            </span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
              {job.applicationFee || '₹0 Fee (Free)'}
            </span>
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
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isGov
                ? 'text-orange-800 bg-orange-100/70'
                : 'text-emerald-800 bg-emerald-100/70'
            }`}
          >
            {isGov ? '🇮🇳 Govt Portal' : 'AI Verified ✓'}
          </span>
        </div>
      )}
    </div>
  );
}
