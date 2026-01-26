'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowLeft, Loader2, ShieldCheck, GraduationCap } from 'lucide-react';

export default function LoginClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const role = searchParams.get('role'); // admin / teacher
  const isTeacher = role !== 'admin'; // Default to admin logic if needed, or strict check

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Trigger animation on mount
  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); // Prevent reload on Enter key
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success(`Welcome back, ${role === 'admin' ? 'Admin' : 'Teacher'}!`);

    // Small delay to show success state before redirecting
    setTimeout(() => {
      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/teacher/dashboard');
      }
    }, 500);
  }

  // UI Config based on Role
  const themeColor = isTeacher ? 'text-cyan-400' : 'text-purple-400';
  const buttonGradient = isTeacher 
    ? 'from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500' 
    : 'from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500';
  const glowColor = isTeacher ? 'shadow-cyan-500/20' : 'shadow-purple-500/20';

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black px-4 sm:px-6">

      {/* --- BACKGROUND BLUR (Consistent with Home Page) --- */}
      <div className={`absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse-slow ${isTeacher ? 'bg-cyan-900/20' : 'bg-purple-900/20'}`} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[120px] animate-pulse-slow delay-1000" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>

      {/* --- CARD CONTAINER --- */}
      <div className={`
        relative z-10 w-full max-w-md 
        bg-zinc-900/40 backdrop-blur-xl border border-white/10 
        rounded-3xl p-8 md:p-10 shadow-2xl ${glowColor}
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        transition-all duration-700 ease-out
      `}>
        
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="absolute top-6 left-6 text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 mb-4 ring-1 ring-white/5 shadow-lg ${themeColor}`}>
            {isTeacher ? <GraduationCap className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isTeacher ? 'Teacher Portal' : 'Admin Portal'}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Enter your credentials to access
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                placeholder="name@school.com"
                className="w-full bg-black/40 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:border-white/30 focus:ring-1 focus:ring-white/30 outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider ml-1">Password</label>
            <div className="relative group">
              <div className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-white transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-black/40 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:border-white/30 focus:ring-1 focus:ring-white/30 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-3.5 rounded-xl text-white font-semibold text-sm tracking-wide shadow-lg
              bg-gradient-to-r ${buttonGradient}
              transform transition-all duration-200
              hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
              disabled:opacity-70 disabled:cursor-not-allowed
              flex items-center justify-center gap-2 mt-2
            `}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

        </form>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-600 mt-8">
          Forgot password? Contact IT Support.
        </p>

      </div>
    </div>
  );
}