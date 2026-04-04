'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      // Route based on role
      router.push(`/${data.role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4 py-20">
      <div className="w-full max-w-md glass p-8 rounded-3xl shadow-xl">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">Welcome Back</h2>
        
        {error && <div className="p-3 mb-6 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all bg-white/50"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all bg-white/50"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          
          <button type="submit" disabled={loading} className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/30 transition-all disabled:opacity-50">
            {loading ? 'Signing In...' : 'Sign In to HealthSync'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-slate-600 text-sm">
          Don't have an account? <a href="/register" className="text-teal-600 font-semibold">Sign Up</a>
        </p>
      </div>
    </div>
  );
}
