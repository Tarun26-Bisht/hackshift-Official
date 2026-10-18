"use client";
import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Captured by global error boundary:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
          ⚠️
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-600 mb-6">
          An unexpected error occurred while processing your request. The TrustBridge team has been alerted.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
