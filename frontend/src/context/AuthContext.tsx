"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'recruiter' | 'admin';
  avatar?: string;
  companyName?: string;
  collegeName?: string;
  isVerified: boolean;
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User, isNew?: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('tb_token');
      const storedUser = localStorage.getItem('tb_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.warn('Failed to parse cached user:', e);
      localStorage.removeItem('tb_token');
      localStorage.removeItem('tb_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (newToken: string, newUser: User, isNew = false) => {
    localStorage.setItem('tb_token', newToken);
    localStorage.setItem('tb_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    const role = (newUser?.role || 'student').toLowerCase();
    const destination =
      role === 'admin'
        ? '/admin/dashboard'
        : role === 'recruiter'
        ? (isNew ? '/recruiter/onboarding' : '/recruiter/dashboard')
        : (isNew ? '/student/onboarding' : '/student/dashboard');

    if (typeof window !== 'undefined') {
      window.location.href = destination;
    } else {
      router.push(destination);
    }
  };

  const logout = () => {
    localStorage.removeItem('tb_token');
    localStorage.removeItem('tb_user');
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    } else {
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
