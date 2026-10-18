"use client";
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CourseCard from '@/components/CourseCard';
import { TrendsSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';
import { API_URL } from '@/lib/api';

export default function TrendsPage() {
  const [trends, setTrends] = useState<{ skill: string; count: number }[]>([]);
  const [recommendations, setRecommendations] = useState<{ skill: string; courses: any[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/jobs/trends`).then(r => r.json()),
      fetch(`${API_URL}/api/jobs/recommendations`).then(r => r.json()),
    ]).then(([trendsData, recsData]) => {
      setTrends(trendsData?.topSkills || []);
      setRecommendations(recsData?.recommendations || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const maxCount = trends[0]?.count || 1;

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        {loading ? (
          <TrendsSkeleton />
        ) : (
          <div className="max-w-6xl mx-auto px-4 py-12">
            <header className="mb-12">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                Skill <span className="text-blue-600">Trends</span>
              </h1>
              <p className="text-gray-500">Top skills demanded by verified listings in the last 14 days.</p>
            </header>
          <>
            {/* Skill Trends Bar Chart */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-12">
              <h2 className="font-bold text-gray-800 text-lg mb-6">Top 10 In-Demand Skills</h2>
              {trends.length === 0 ? (
                <p className="text-gray-400 text-sm">No data yet. Approve some listings first.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {trends.map(({ skill, count }) => (
                    <div key={skill} className="flex items-center gap-4">
                      <span className="w-24 sm:w-28 text-xs sm:text-sm font-medium text-gray-700 capitalize shrink-0 truncate" title={skill}>{skill}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Course Recommendations */}
            <section>
              <h2 className="font-bold text-gray-800 text-2xl mb-2">Recommended Courses</h2>
              <p className="text-gray-500 text-sm mb-8">Based on the top trending skills — free and paid options.</p>
              {recommendations.length === 0 ? (
                <p className="text-gray-400 text-sm">No recommendations yet.</p>
              ) : (
                <div className="flex flex-col gap-10">
                  {recommendations.map(({ skill, courses }) => (
                    <div key={skill}>
                      <h3 className="text-lg font-semibold text-gray-800 capitalize mb-3">
                        🔥 {skill}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {courses.map((course: any) => (
                          <CourseCard key={course.id} course={course} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        </div>
      )}
      </main>
    </ErrorBoundary>
  );
}
