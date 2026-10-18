export function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-100 rounded w-36" />
          </div>
        </div>
        <div className="h-10 bg-gray-200 rounded-lg w-28" />
      </div>

      {/* Completeness Card Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-56" />
            <div className="h-4 bg-gray-100 rounded w-72" />
          </div>
          <div className="h-10 w-16 bg-gray-200 rounded-lg" />
        </div>
        <div className="h-3 bg-gray-100 rounded-full w-full mb-4" />
        <div className="flex gap-4">
          <div className="h-6 w-24 bg-gray-100 rounded-full" />
          <div className="h-6 w-24 bg-gray-100 rounded-full" />
          <div className="h-6 w-24 bg-gray-100 rounded-full" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-20" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>

      {/* Cards Skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-40 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              <div className="h-16 bg-gray-50 rounded" />
              <div className="h-8 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TrendsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse">
      <div className="mb-12 space-y-3">
        <div className="h-10 bg-gray-200 rounded-lg w-64" />
        <div className="h-4 bg-gray-100 rounded w-96" />
      </div>

      {/* Bar chart skeleton */}
      <div className="bg-white rounded-xl border border-gray-100 p-8 mb-12">
        <div className="h-6 bg-gray-200 rounded w-52 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-28 h-4 bg-gray-200 rounded" />
              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gray-300 h-4 rounded-full"
                  style={{ width: `${85 - i * 12}%` }}
                />
              </div>
              <div className="w-8 h-4 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Course cards skeleton */}
      <div>
        <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-80 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-4/5" />
              <div className="h-4 bg-gray-100 rounded w-2/5" />
              <div className="h-8 bg-blue-50 rounded-lg w-full mt-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-72 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-96 mb-8" />
      <div className="bg-white rounded-xl border border-gray-100 p-8 space-y-6">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-10 bg-gray-50 rounded-lg border border-gray-100" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-28" />
          <div className="h-24 bg-gray-50 rounded-lg border border-gray-100" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-gray-50 rounded-lg border border-gray-100" />
          <div className="h-10 bg-gray-50 rounded-lg border border-gray-100" />
        </div>
        <div className="h-12 bg-blue-100 rounded-lg" />
      </div>
    </div>
  );
}
