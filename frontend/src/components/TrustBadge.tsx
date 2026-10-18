import React from 'react';

interface TrustBadgeProps {
  score: number;
  className?: string;
}

export default function TrustBadge({ score, className = '' }: TrustBadgeProps) {
  const isHighTrust = score >= 75;
  const isModerate = score >= 40 && score < 75;

  const bgBorderText = isHighTrust
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90 hover:bg-emerald-100/80'
    : isModerate
    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/80'
    : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/80';

  const dotColor = isHighTrust
    ? 'bg-emerald-500'
    : isModerate
    ? 'bg-amber-500'
    : 'bg-rose-500';

  const label = isHighTrust
    ? (score === 100 ? 'Verified' : 'Trusted')
    : isModerate
    ? 'Moderate'
    : 'Caution';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold shrink-0 whitespace-nowrap shadow-2xs transition-colors select-none ${bgBorderText} ${className}`}
      title={`AI Trust Score: ${score}/100. Based on verified company identity, salary transparency, and scam pattern checks.`}
    >
      <span className="flex items-center gap-1 font-bold tracking-tight">
        <ShieldIcon isHighTrust={isHighTrust} />
        <span>{score}/100</span>
      </span>
      <span className="opacity-40 font-normal">|</span>
      <span className="flex items-center gap-1 text-[11px] font-medium capitalize">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span>{label}</span>
      </span>
    </div>
  );
}

function ShieldIcon({ isHighTrust }: { isHighTrust: boolean }) {
  if (isHighTrust) {
    return (
      <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM13.707 8.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5 text-amber-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}
