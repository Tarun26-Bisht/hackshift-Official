import TrustBadge from './TrustBadge';

interface AuditResultProps {
  job: any;
}

export default function AuditResult({ job }: AuditResultProps) {
  const approved = job.status === 'approved';

  return (
    <div className={`rounded-2xl border p-6 ${approved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg text-gray-900">AI Audit Result</h2>
        <TrustBadge score={job.trustScore} />
      </div>

      <p className={`font-semibold text-sm mb-6 ${approved ? 'text-green-700' : 'text-red-700'}`}>
        {approved ? '✅ Listing Approved — now live on the platform!' : `🚫 Listing Blocked — ${job.blockReason || 'does not meet trust standards.'}`}
      </p>

      {/* Pipeline Steps */}
      <div className="flex flex-col gap-4">

        {/* Step 1 — Blocklist */}
        <PipelineStep
          step="1"
          label="Keyword Blocklist"
          status={job.blocklistMatches?.length > 0 ? 'fail' : 'pass'}
          detail={job.blocklistMatches?.length > 0
            ? `Flagged: ${job.blocklistMatches.join(', ')}`
            : 'No scam keywords detected'}
        />

        {/* Step 2 — AWS Comprehend */}
        <PipelineStep
          step="2"
          label="AWS Comprehend — Text Analysis"
          status={job.comprehendResult?.comprehendUsed
            ? (job.comprehendResult.signals?.length > 0 ? 'warn' : 'pass')
            : 'skip'}
          detail={
            !job.comprehendResult?.comprehendUsed
              ? 'Skipped (AWS not configured)'
              : job.comprehendResult.signals?.length > 0
                ? `Signals: ${job.comprehendResult.signals.join(', ')} · Penalty: -${job.comprehendResult.penalty}pts`
                : `Tone: ${job.comprehendResult.sentiment || 'POSITIVE'} · No predatory language or PII found ✓`
          }
        />

        {/* Step 3 — Gemini AI */}
        <PipelineStep
          step="3"
          label="Gemini AI — Deep Analysis"
          status={job.aiResult?.isLikelyScam ? 'fail' : job.aiResult?.scamMarkers?.length > 0 ? 'warn' : 'pass'}
          detail={`Professionalism: ${job.aiResult?.professionalismScore || 8}/10 · Scam markers: ${job.aiResult?.scamMarkers?.length || 0}`}
        >
          <div className="flex flex-wrap gap-2 mt-2">
            {job.aiResult?.skills?.length > 0 && (
              <TagGroup label="Skills" items={job.aiResult.skills} color="blue" />
            )}
            {job.aiResult?.scamMarkers?.length > 0 && (
              <TagGroup label="Scam Markers" items={job.aiResult.scamMarkers} color="red" />
            )}
            {job.aiResult?.missingFields?.length > 0 && (
              <TagGroup label="Missing Fields" items={job.aiResult.missingFields} color="yellow" />
            )}
          </div>
        </PipelineStep>

        {/* Step 4 — Link Validation */}
        <PipelineStep
          step="4"
          label="Link Validation"
          status={job.linkResult?.isValid ? 'pass' : 'fail'}
          detail={job.linkResult?.isValid ? 'Link is reachable ✓' : `Link failed: ${job.linkResult?.reason}`}
        />

        {/* Step 5 — TrustScore */}
        <PipelineStep
          step="5"
          label="TrustScore Calculation"
          status={job.trustScore >= 75 ? 'pass' : job.trustScore >= 40 ? 'warn' : 'fail'}
          detail={`Final score: ${job.trustScore}/100 · Threshold: 40 to approve`}
        />
      </div>

      {/* Job completeness */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          Job completeness: <span className="font-semibold text-gray-600">{job.jobCompleteness}%</span>
          {job.auditCount > 1 && ` · Audit #${job.auditCount}`}
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PipelineStep({ step, label, status, detail, children }: {
  step: string; label: string; status: 'pass' | 'fail' | 'warn' | 'skip';
  detail: string; children?: React.ReactNode;
}) {
  const styles = {
    pass: { dot: 'bg-green-500', border: 'border-green-100', bg: 'bg-green-50', icon: '✓', text: 'text-green-700' },
    fail: { dot: 'bg-red-500', border: 'border-red-100', bg: 'bg-red-50', icon: '✗', text: 'text-red-700' },
    warn: { dot: 'bg-yellow-400', border: 'border-yellow-100', bg: 'bg-yellow-50', icon: '⚠', text: 'text-yellow-700' },
    skip: { dot: 'bg-gray-300', border: 'border-gray-100', bg: 'bg-gray-50', icon: '—', text: 'text-gray-400' },
  }[status];

  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} p-4`}>
      <div className="flex items-start gap-3">
        <div className={`w-6 h-6 rounded-full ${styles.dot} flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5`}>
          {styles.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400">STEP {step}</span>
            <span className="text-sm font-semibold text-gray-800">{label}</span>
          </div>
          <p className={`text-xs mt-0.5 ${styles.text}`}>{detail}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

function TagGroup({ label, items, color }: { label: string; items: string[]; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <div className="w-full">
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item: string) => (
          <span key={item} className={`text-xs px-2 py-0.5 rounded-full ${colors[color]}`}>{item}</span>
        ))}
      </div>
    </div>
  );
}
