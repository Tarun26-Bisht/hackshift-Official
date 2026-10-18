"use client";
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import JobCard from '@/components/JobCard';
import JobCardSkeleton from '@/components/JobCardSkeleton';
import ErrorBoundary from '@/components/ErrorBoundary';
import { API_URL } from '@/lib/api';

export default function Home() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalListings, setTotalListings] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [minTrustScore, setMinTrustScore] = useState<number | ''>('');

  const popularSkills = ['React', 'Python', 'Node.js', 'TypeScript', 'AI/ML', 'Next.js', 'Tailwind', 'SQL'];
  const jobTypes = ['Government Internship', 'Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'];

  const fetchListings = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '9',
    });
    if (search) params.append('search', search);
    if (selectedSkill) params.append('skill', selectedSkill);
    if (selectedType) params.append('jobType', selectedType);
    if (selectedLocation) params.append('location', selectedLocation);
    if (minTrustScore) params.append('minScore', String(minTrustScore));

    fetch(`${API_URL}/api/jobs/listings?${params}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setJobs(data);
          setTotalListings(data.length);
          setTotalPages(1);
        } else {
          setJobs(data.jobs || []);
          setTotalListings(data.total || 0);
          setTotalPages(data.pages || 1);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchListings();
  }, [page, selectedSkill, selectedType, selectedLocation, minTrustScore]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchListings();
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedSkill('');
    setSelectedType('');
    setSelectedLocation('');
    setMinTrustScore('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || selectedSkill || selectedType || selectedLocation || minTrustScore);

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-50/50 to-gray-50 border-b border-gray-100 py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100/80 text-blue-700 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                🛡️ AI-Audited & Verified Opportunities
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">
                Trusted Careers for <span className="text-blue-600">Future Leaders</span>
              </h1>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Zero fake jobs. Zero unpaid bait-and-switch scams. Verified central government schemes (PMIS, AICTE, MeitY) and recruiter-vetted industry jobs with transparent stipends.
              </p>
            </div>

            {/* Quick Category Badges */}
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={() => { setSelectedType(''); setPage(1); }}
                className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all ${
                  !selectedType ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                🔥 All Opportunities
              </button>
              <button
                onClick={() => { setSelectedType('Government Internship'); setPage(1); }}
                className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 ${
                  selectedType === 'Government Internship'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100'
                }`}
              >
                <span>🇮🇳</span> Central Govt Free Internships (PMIS / AICTE)
              </button>
              <button
                onClick={() => { setSelectedType('Internship'); setPage(1); }}
                className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all ${
                  selectedType === 'Internship' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                💼 Industry Internships
              </button>
              <button
                onClick={() => { setSelectedLocation('Remote'); setPage(1); }}
                className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all ${
                  selectedLocation === 'Remote' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                🌐 Remote Only
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="mt-5 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by job title, ministry, keyword, or company..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm shrink-0"
                >
                  Search Listings
                </button>
              </form>

              {/* Filter Row */}
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Job Type Filter */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Opportunity Type</label>
                  <select
                    value={selectedType}
                    onChange={e => { setSelectedType(e.target.value); setPage(1); }}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  >
                    <option value="">All Types</option>
                    {jobTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Location</label>
                  <select
                    value={selectedLocation}
                    onChange={e => { setSelectedLocation(e.target.value); setPage(1); }}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  >
                    <option value="">Any Location</option>
                    <option value="Pan-India">Pan-India (Govt)</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>

                {/* Skill Filter */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Skill</label>
                  <select
                    value={selectedSkill}
                    onChange={e => { setSelectedSkill(e.target.value); setPage(1); }}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  >
                    <option value="">All Skills</option>
                    {popularSkills.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Trust Score Filter */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">TrustScore</label>
                  <select
                    value={minTrustScore}
                    onChange={e => { setMinTrustScore(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  >
                    <option value="">All Approved (40+)</option>
                    <option value="75">75+ Highly Trusted</option>
                    <option value="85">85+ Premium Trust</option>
                    <option value="100">100 (Govt Certified)</option>
                  </select>
                </div>
              </div>

              {/* Active Pills & Reset */}
              {hasActiveFilters && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-gray-400 font-medium">Active filters:</span>
                    {search && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        "{search}"
                      </span>
                    )}
                    {selectedType && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {selectedType}
                      </span>
                    )}
                    {selectedLocation && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {selectedLocation}
                      </span>
                    )}
                    {selectedSkill && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {selectedSkill}
                      </span>
                    )}
                    {minTrustScore && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        Score ≥ {minTrustScore}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={resetFilters}
                    className="text-xs text-red-600 hover:text-red-700 font-medium underline"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Listings Section */}
        <section className="max-w-6xl mx-auto px-4 py-10 flex-1 w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Verified Openings
              <span className="ml-2 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                {totalListings} available
              </span>
            </h2>
            {totalPages > 1 && (
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
            )}
          </div>

          {loading ? (
            /* Loading Skeletons */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : jobs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job: any) => (
                  <JobCard key={job._id || job.id} job={job} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white transition-colors"
                  >
                    ← Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          page === p
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 p-8">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-base font-bold text-gray-800">No verified listings match your criteria</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                Try adjusting your search terms or clearing some filters to explore more opportunities.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-8 text-center text-xs text-gray-500 mt-auto">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} TrustBridge — Protecting students against scam listings with Gemini AI.</p>
            <div className="flex items-center gap-4 text-gray-400">
              <span>Security Shield Active</span>
              <span>·</span>
              <span>MongoDB Atlas</span>
              <span>·</span>
              <span>AWS Rekognition</span>
            </div>
          </div>
        </footer>
      </main>
    </ErrorBoundary>
  );
}
