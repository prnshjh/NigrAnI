import { useState } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) setError(err.message);
      else setError('Account created! You can now sign in.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 to-slate-950">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">SentinelAI</span>
        </div>

        <div>
          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Intelligent<br />Security<br />Intelligence
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md">
            AI-powered CCTV monitoring platform. Real-time threat detection, zone analytics, and intelligent alert management.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { label: 'Cameras Monitored', value: '500+' },
              { label: 'Events Processed', value: '2M+' },
              { label: 'Detection Accuracy', value: '98.7%' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-slate-400 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-sm">&copy; 2026 SentinelAI. All rights reserved.</p>
      </div>

      <div className="w-full lg:w-[480px] flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-900 font-bold text-base">SentinelAI</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            {mode === 'login' ? 'Sign in to your security dashboard' : 'Get started with SentinelAI'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className={`px-4 py-3 rounded-lg text-sm border ${error.includes('created') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@company.com"
                  className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-2">Demo credentials</p>
            <p className="text-xs text-gray-500 font-mono">admin@sentinel.ai</p>
            <p className="text-xs text-gray-500 font-mono">sentinel2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
