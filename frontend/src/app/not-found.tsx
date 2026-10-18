import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="text-6xl font-black text-blue-600 mb-2">404</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-sm text-gray-600 mb-6">
          The page you are looking for doesn't exist or has been moved to a new destination.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
        >
          Return to Platform
        </Link>
      </div>
    </main>
  );
}
