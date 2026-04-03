'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    setUser(rawUser ? JSON.parse(rawUser) : null);
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    if (pathname.startsWith('/patient') || pathname.startsWith('/doctor') || pathname.startsWith('/admin')) {
      router.push('/');
    }
  };

  const isDashboardRoute = pathname.startsWith('/patient') || pathname.startsWith('/doctor') || pathname.startsWith('/admin');

  // Only show header on non-dashboard routes
  if (isDashboardRoute) return null;

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/40 shadow-sm w-full">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center">
            <span className="text-white font-bold text-xl">+</span>
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">HealthSync AI</span>
        </div>
        <nav className="flex gap-4">
          {loading ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : user ? (
            <>
              <span className="text-sm font-medium text-slate-600 py-2">Welcome, {user.name}</span>
              <button 
                onClick={handleLogout}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 py-2"
              >
                Logout
              </button>
              <a 
                href={`/${user.role}`} 
                className="text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-full transition-all shadow-md shadow-teal-500/20"
              >
                Dashboard
              </a>
            </>
          ) : (
            <>
              <a href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 py-2">Log In</a>
              <a href="/register" className="text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-full transition-all shadow-md shadow-teal-500/20">Sign Up</a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
