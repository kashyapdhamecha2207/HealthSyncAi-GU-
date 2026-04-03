'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Home, Calendar, Pill, Stethoscope, FileText, AlertTriangle, Settings, Users } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
      router.push('/login');
    } else {
      setUser(JSON.parse(rawUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="w-64 glass-dark text-white border-r border-white/10 flex flex-col fixed h-full z-40">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white font-bold text-xl">+</div>
            <span className="font-bold text-lg">HealthSync Role: <span className="capitalize text-teal-300">{user.role}</span></span>
          </div>

          <nav className="space-y-2">
            <a href={`/${user.role}`} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
              <Home size={20} className="text-teal-400" /> Dashboard
            </a>
            {user.role === 'patient' && (
              <>
                <a href="/patient/appointments" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all">
                  <Calendar size={20} className="text-blue-400" /> Book Appointment
                </a>
                <a href="/patient/medications" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all">
                  <Pill size={20} className="text-emerald-400" /> Medications
                </a>
                <a href="/patient/opd-history" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all">
                  <FileText size={20} className="text-purple-400" /> OPD History
                </a>
              </>
            )}
            {user.role === 'doctor' && (
              <>
                <a href="/opd" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all">
                  <Stethoscope size={20} className="text-purple-400" /> OPD Management
                </a>
                <a href="/emergency" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all">
                  <AlertTriangle size={20} className="text-red-400" /> Emergency
                </a>
              </>
            )}
            {user.role === 'admin' && (
              <>
                <a href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all">
                  <Settings size={20} className="text-purple-400" /> Admin Dashboard
                </a>
                <a href="/emergency" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all">
                  <AlertTriangle size={20} className="text-red-400" /> Emergency
                </a>
              </>
            )}
            {user.role === 'caregiver' && (
              <>
                <a href="/caregiver" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all">
                  <Users size={20} className="text-purple-400" /> Caregiver
                </a>
              </>
            )}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 uppercase">
              {user.name.substring(0, 2)}
            </div>
            <div>
              <div className="text-sm font-bold truncate w-32">{user.name}</div>
              <div className="text-xs text-slate-400 truncate w-32">{user.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors w-full p-2">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
