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
}

export default function JobCard({ job }: { job: Job }) {
  const company = job.companyName || job.company || 'Verified Employer';
  const skillsList = (job.skills && job.skills.length > 0)
    ? job.skills
    : (job.aiResult?.skills || []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-bold text-gray-900 text-lg leading-tight">{job.title}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{company}</p>
        </div>
        <TrustBadge score={job.trustScore || 0} />
      </div>

      <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{job.description}</p>

      <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
        {job.salary && <span className="bg-gray-100 px-2 py-1 rounded">💰 {job.salary}</span>}
        {job.duration && <span className="bg-gray-100 px-2 py-1 rounded">⏱ {job.duration}</span>}
        {job.jobType && <span className="bg-gray-100 px-2 py-1 rounded">💼 {job.jobType}</span>}
        {job.location && <span className="bg-gray-100 px-2 py-1 rounded">📍 {job.location}</span>}
      </div>

      {skillsList.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {skillsList.slice(0, 5).map((skill) => (
            <span key={skill} className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
              {skill}
            </span>
          ))}
        </div>
      )}

      {job.link && (
        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
          <a
            href={job.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1"
          >
            <span>View Verified Listing</span>
            <span>→</span>
          </a>
          <span className="text-[11px] text-emerald-600 font-medium">AI Verified ✓</span>
        </div>
      )}
    </div>
  );
}
