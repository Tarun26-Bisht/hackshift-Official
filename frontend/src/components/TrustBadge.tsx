export default function TrustBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? 'bg-green-100 text-green-700' :
    score >= 40 ? 'bg-yellow-100 text-yellow-700' :
    'bg-red-100 text-red-700';

  const label =
    score >= 75 ? '✅ Trusted' :
    score >= 40 ? '⚠️ Moderate' :
    '🚫 Risky';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
      {label} · {score}/100
    </span>
  );
}
