export default function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-3 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-gray-200 rounded-md w-3/4" />
          <div className="h-3.5 bg-gray-100 rounded-md w-1/3" />
        </div>
        <div className="h-6 w-24 bg-gray-200 rounded-full shrink-0" />
      </div>

      <div className="space-y-2 my-2">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>

      <div className="flex gap-2">
        <div className="h-6 w-16 bg-gray-100 rounded-md" />
        <div className="h-6 w-20 bg-gray-100 rounded-md" />
        <div className="h-6 w-14 bg-gray-100 rounded-md" />
      </div>

      <div className="flex gap-1.5 mt-1">
        <div className="h-5 w-12 bg-blue-50 rounded-full" />
        <div className="h-5 w-16 bg-blue-50 rounded-full" />
        <div className="h-5 w-10 bg-blue-50 rounded-full" />
      </div>

      <div className="mt-4 pt-2 border-t border-gray-50 flex justify-between items-center">
        <div className="h-4 w-24 bg-blue-100 rounded" />
      </div>
    </div>
  );
}
