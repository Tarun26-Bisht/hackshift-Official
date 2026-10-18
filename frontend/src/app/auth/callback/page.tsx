"use client";
import { useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

import { API_URL } from '@/lib/api';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;

    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const roleParam = searchParams.get('role');

    if (!token) {
      window.location.href = '/login?error=no_token';
      return;
    }

    processedRef.current = true;

    // Fast path: User data was encoded directly in URL by backend
    if (userParam) {
      try {
        const decodedUser = JSON.parse(decodeURIComponent(userParam));
        if (decodedUser && decodedUser.role) {
          login(token, decodedUser);
          return;
        }
      } catch (err) {
        console.warn('Could not parse user query param, trying /api/auth/me', err);
      }
    }

    // Fallback: Fetch user info from /api/auth/me
    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          login(token, data.user);
        } else if (roleParam) {
          login(token, {
            _id: '',
            name: roleParam === 'student' ? 'Student' : 'Recruiter',
            email: '',
            role: roleParam as any,
            isVerified: false,
          });
        } else {
          window.location.href = '/login?error=invalid_token';
        }
      })
      .catch(() => {
        if (roleParam) {
          login(token, {
            _id: '',
            name: roleParam === 'student' ? 'Student' : 'Recruiter',
            email: '',
            role: roleParam as any,
            isVerified: false,
          });
        } else {
          window.location.href = '/login?error=fetch_failed';
        }
      });
  }, [searchParams, login]);

  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
      <p className="text-gray-500 text-sm">Completing sign in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Suspense fallback={
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      }>
        <AuthCallbackContent />
      </Suspense>
    </main>
  );
}
