"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import ErrorBoundary from '@/components/ErrorBoundary';
import { API_URL } from '@/lib/api';

interface Course {
  id: string;
  title: string;
  platform: string;
  provider: string;
  category: string;
  discipline?: string;
  duration: string;
  price: string;
  certificateAvailable: boolean;
  certificateType: string;
  level: string;
  skills: string[];
  description: string;
  enrollUrl: string;
  badge: string;
  rating: number;
  learnersCount: string;
}

interface LearningPhase {
  phase: string;
  goal: string;
  duration: string;
}

interface AiRecommendation {
  field: string;
  discipline?: string;
  trendingSkills: string[];
  recommendedCourseIds: string[];
  learningRoadmap: LearningPhase[];
  aiRationale: string;
  courses: Course[];
}

const PRESET_FIELDS = [
  { label: '💻 MERN Stack Dev', value: 'MERN Stack Developer' },
  { label: '💼 MBA & Business', value: 'MBA & Business Strategy' },
  { label: '🤖 AI & Data Science', value: 'Artificial Intelligence & Data Science' },
  { label: '🛡️ Cybersecurity', value: 'Cybersecurity Analyst' },
];

export default function StudentCoursesPage() {
  const { user, token, loading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  // AI Recommendation State
  const [recommendation, setRecommendation] = useState<AiRecommendation | null>(null);
  const [recommending, setRecommending] = useState(false);
  const [selectedField, setSelectedField] = useState('MERN Stack Developer');
  const [customFieldInput, setCustomFieldInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPlatform, setSelectedPlatform] = useState('All');

  // Load Catalog
  useEffect(() => {
    if (!token) return;
    setFetching(true);
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (selectedDiscipline && selectedDiscipline !== 'All') params.append('discipline', selectedDiscipline);
    if (selectedCategory && selectedCategory !== 'All') params.append('category', selectedCategory);
    if (selectedPlatform && selectedPlatform !== 'All') params.append('platform', selectedPlatform);

    fetch(`${API_URL}/api/student/courses?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.status === 403) throw new Error('Exclusive to Students. Access restricted.');
        if (!res.ok) throw new Error('Failed to fetch courses');
        return res.json();
      })
      .then(data => {
        setCourses(data.courses || []);
        if (data.categories) setCategories(data.categories);
        if (data.platforms) setPlatforms(data.platforms);
        if (data.disciplines) setDisciplines(data.disciplines);
        setFetching(false);
      })
      .catch(err => {
        setError(err.message);
        setFetching(false);
      });
  }, [token, search, selectedDiscipline, selectedCategory, selectedPlatform]);

  // Load AI Recommendation
  const fetchAiRecommendations = async (fieldToUse: string) => {
    if (!token) return;
    setRecommending(true);
    try {
      const res = await fetch(
        `${API_URL}/api/student/courses/ai-recommendations?field=${encodeURIComponent(fieldToUse)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.recommendations) {
          setRecommendation(data.recommendations);
        }
      }
    } catch (err) {
      console.error('Error fetching AI recommendations:', err);
    } finally {
      setRecommending(false);
    }
  };

  useEffect(() => {
    if (token && user?.role === 'student') {
      fetchAiRecommendations(selectedField);
    }
  }, [token, user]);

  const handleFieldChange = (field: string) => {
    setSelectedField(field);
    setShowCustomInput(false);
    fetchAiRecommendations(field);
  };

  const handleCustomFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFieldInput.trim()) return;
    setSelectedField(customFieldInput.trim());
    fetchAiRecommendations(customFieldInput.trim());
  };

  // If user not authenticated or not a student
  if (!loading && (!user || user.role !== 'student')) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center flex-1 flex flex-col justify-center items-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm">
            🎓
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full mb-3">
            Student Exclusive Portal
          </span>
          <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
            Free Enterprise & Govt. Certifications
          </h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
            Access 100% free verified certifications from <strong className="text-gray-800">IBM SkillsBuild</strong>,{' '}
            <strong className="text-gray-800">Infosys Springboard</strong>,{' '}
            <strong className="text-gray-800">Swayam / NPTEL (Govt. of India)</strong>, and Harvard CS50.
            Sign in with a student account to unlock the full catalog and Gemini AI skill recommendations.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow transition-all hover:shadow-md"
            >
              Sign In as Student →
            </Link>
            <Link
              href="/"
              className="px-5 py-3 bg-white border border-gray-300 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors"
            >
              Browse Internships
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        {/* Hero Header */}
        <section className="bg-gradient-to-b from-blue-50/70 via-indigo-50/20 to-gray-50 border-b border-gray-100 py-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                  <span>🎓</span> Student-Exclusive Learning Hub
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                  Free Certified Courses & <span className="text-blue-600">AI Career Advisor</span>
                </h1>
                <p className="text-gray-600 mt-2 text-sm sm:text-base max-w-3xl">
                  Curated free certifications from <strong>IBM SkillsBuild</strong>, <strong>Infosys Springboard</strong>,{' '}
                  <strong>Swayam / NPTEL</strong>, and <strong>Harvard CS50</strong>. Personalized by Gemini AI based on your field and trending skills.
                </p>
              </div>

              <Link
                href="/student/dashboard"
                className="text-sm font-semibold text-gray-600 hover:text-blue-600 bg-white border border-gray-200 px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                ← Back to Dashboard
              </Link>
            </div>

            {/* ─── GEMINI AI RECOMMENDATION BOX ───────────────────────────────── */}
            <div className="mt-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                {/* AI Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-xl shadow-lg shadow-indigo-500/30">
                      ✨
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                          Gemini AI Course & Roadmap Recommender
                        </h2>
                        <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                          Live AI 2026
                        </span>
                      </div>
                      <p className="text-xs text-indigo-200/80 mt-0.5">
                        Tailored specifically to your academic field & trending industry demands
                      </p>
                    </div>
                  </div>

                  {/* Discipline / Field Pill */}
                  <div className="text-xs font-semibold px-3 py-1 bg-white/10 rounded-full text-indigo-200 border border-white/10">
                    Field: <span className="text-white font-bold">{selectedField}</span>
                  </div>
                </div>

                {/* Field Selector Tabs */}
                <div className="pt-5 pb-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">
                    Select Your Academic Field or Specialization:
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {PRESET_FIELDS.map(f => (
                      <button
                        key={f.value}
                        onClick={() => handleFieldChange(f.value)}
                        className={`text-xs px-3.5 py-2 rounded-xl font-bold transition-all ${
                          selectedField === f.value && !showCustomInput
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-102 ring-2 ring-blue-400'
                            : 'bg-white/10 text-gray-200 hover:bg-white/20'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}

                    <button
                      onClick={() => setShowCustomInput(!showCustomInput)}
                      className={`text-xs px-3.5 py-2 rounded-xl font-bold transition-all ${
                        showCustomInput
                          ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                          : 'bg-white/10 text-gray-200 hover:bg-white/20'
                      }`}
                    >
                      ✏️ Custom Specialization
                    </button>
                  </div>

                  {/* Custom Field Input Form */}
                  {showCustomInput && (
                    <form onSubmit={handleCustomFieldSubmit} className="mt-3 flex gap-2 max-w-md">
                      <input
                        type="text"
                        value={customFieldInput}
                        onChange={e => setCustomFieldInput(e.target.value)}
                        placeholder="e.g. MBA Finance, Blockchain, UI/UX Design..."
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow"
                      >
                        Ask AI 🪄
                      </button>
                    </form>
                  )}
                </div>

                {/* AI Content Area */}
                {recommending ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs text-indigo-200 font-medium">
                      Gemini AI is analyzing market trends & course competencies for {selectedField}...
                    </p>
                  </div>
                ) : recommendation ? (
                  <div className="space-y-6 pt-2">
                    {/* Trending Skills in 2026 */}
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="text-amber-400 text-sm">🔥</span>
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                          Top Trending Industry Skills in 2026:
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recommendation.trendingSkills.map(skill => (
                          <span
                            key={skill}
                            className="text-xs font-bold px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-200 border border-indigo-400/30"
                          >
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* AI Placement Strategy / Rationale */}
                    <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-400/20 flex items-start gap-3">
                      <span className="text-xl">💡</span>
                      <div>
                        <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-1">
                          AI Placement Strategy:
                        </h4>
                        <p className="text-xs text-gray-200 leading-relaxed">
                          {recommendation.aiRationale}
                        </p>
                      </div>
                    </div>

                    {/* 3-Phase Roadmap */}
                    {recommendation.learningRoadmap && recommendation.learningRoadmap.length > 0 && (
                      <div>
                        <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-300 mb-3 flex items-center gap-1.5">
                          <span>🗺️</span> 3-Phase Recommended Roadmap:
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {recommendation.learningRoadmap.map((step, idx) => (
                            <div
                              key={idx}
                              className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300 mb-1">
                                  <span>{step.phase}</span>
                                  <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-gray-300">
                                    {step.duration}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-300 leading-relaxed mt-1">
                                  {step.goal}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Recommended Courses List */}
                    {recommendation.courses && recommendation.courses.length > 0 && (
                      <div>
                        <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 mb-3 flex items-center gap-1.5">
                          <span>🎯</span> Top AI-Recommended Free Courses:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {recommendation.courses.map(rc => (
                            <div
                              key={rc.id}
                              className="bg-white text-gray-900 rounded-2xl p-5 border border-white/20 shadow-md flex flex-col justify-between hover:shadow-lg transition-all"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-2">
                                  <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                                    {rc.platform}
                                  </span>
                                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    {rc.badge}
                                  </span>
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm leading-snug mb-1">
                                  {rc.title}
                                </h4>
                                <p className="text-[11px] font-semibold text-gray-500 mb-2">
                                  Provider: {rc.provider}
                                </p>
                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-3">
                                  {rc.description}
                                </p>
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {rc.skills.slice(0, 3).map(sk => (
                                    <span key={sk} className="text-[10px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                      {sk}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-emerald-700">100% Free</span>
                                <a
                                  href={rc.enrollUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  Enroll Free →
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Catalog Filter Controls */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm mt-8">
              <div className="relative mb-4">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search full catalog by skill, course title, or provider (e.g., MERN, IBM, Python, Agile, Swayam)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>

              {/* Discipline Pills */}
              {disciplines.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 mb-3">
                  <span className="text-xs font-bold text-gray-700 mr-1">Discipline:</span>
                  {disciplines.map(d => (
                    <button
                      key={d}
                      onClick={() => setSelectedDiscipline(d)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                        selectedDiscipline === d
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}

              {/* Platform Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 mb-3">
                <span className="text-xs font-bold text-gray-700 mr-1">Platform:</span>
                {platforms.map(plat => (
                  <button
                    key={plat}
                    onClick={() => setSelectedPlatform(plat)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      selectedPlatform === plat
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {plat}
                  </button>
                ))}
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-700 mr-1">Category:</span>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Catalog Grid Area */}
        <section className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-gray-900 text-lg">
              Catalog: {courses.length} Free Course{courses.length === 1 ? '' : 's'}
            </h2>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
              ✓ 100% Free Certifications
            </span>
          </div>

          {fetching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse flex flex-col gap-3">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-16 bg-gray-100 rounded w-full" />
                  <div className="h-8 bg-gray-200 rounded w-full mt-auto" />
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-gray-800 font-bold text-base">No courses matched your filters</p>
              <p className="text-gray-500 text-sm mt-1">Try resetting the platform, category, or search filter.</p>
              <button
                onClick={() => {
                  setSelectedDiscipline('All');
                  setSelectedCategory('All');
                  setSelectedPlatform('All');
                  setSearch('');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  {/* Top Bar with Platform & Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                      {course.platform}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {course.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base leading-snug mb-1">
                    {course.title}
                  </h3>
                  <p className="text-xs font-medium text-gray-500 mb-3">
                    By {course.provider} {course.discipline ? `• ${course.discipline}` : ''}
                  </p>

                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4">
                    {course.description}
                  </p>

                  {/* Skills Pills */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {course.skills.map(skill => (
                      <span key={skill} className="bg-gray-100 text-gray-700 text-[11px] px-2 py-0.5 rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Meta details */}
                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600 mb-4">
                    <span>⏱ {course.duration}</span>
                    <span className="font-semibold text-emerald-700">{course.price}</span>
                    <span>🎓 {course.level}</span>
                  </div>

                  {/* Enroll button */}
                  <a
                    href={course.enrollUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span>Enroll on {course.platform.split(' ')[0]}</span>
                    <span>→</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </ErrorBoundary>
  );
}
