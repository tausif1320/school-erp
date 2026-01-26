'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowLeft, Loader2, ShieldCheck, GraduationCap } from 'lucide-react';

export default function LoginClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const role = searchParams.get('role'); // 'admin' or 'teacher'
  const isTeacher = role !== 'admin'; 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      // 1. AUTHENTICATE (Supabase Auth)
      // This checks if the email/password exists in Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        throw new Error('Invalid email or password');
      }

      // 2. AUTHORIZE (Check 'teachers' table)
      // We look up this user in the teachers table
      const { data: teacherProfile } = await supabase
        .from('teachers')
        .select('id, status')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      // --- ROLE SECURITY LOGIC ---
      if (isTeacher) {
        // CASE: Logging in as TEACHER
        if (!teacherProfile) {
          throw new Error('Access Denied: No Teacher profile found for this account.');
        }
        if (teacherProfile.status !== 'active') {
          throw new Error('Account is inactive. Contact Admin.');
        }
        toast.success('Welcome Teacher!');
        router.push('/teacher/dashboard');
      } 
      else {
        // CASE: Logging in as ADMIN
        
        // Security Check: If a teacher tries to log in here, STOP THEM.
        if (teacherProfile) {
          throw new Error('Unauthorized: You are a Teacher. Please use the Teacher login.');
        }
        
        // If they have a valid login but are NOT in the teachers table, 
        // they must be the Admin.
        toast.success('Welcome Admin!');
        router.push('/admin/dashboard');
      }

    } catch (err: any) {
      // If any check fails, log them out immediately so they can't access anything
      await supabase.auth.signOut();
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  // UI Theme Config
  const accentColor = isTeacher ? 'text-cyan-400' : 'text-indigo-400';
  const buttonClass = isTeacher 
    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:shadow-cyan-500/20' 
    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/20';

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-6 font-sans selection:bg-indigo-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
         <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-b ${isTeacher ? 'from-cyan-500/10' : 'from-indigo-500/10'} to-transparent blur-3xl opacity-40`} />
      </div>

      <div className={`
        relative z-10 w-full max-w-sm
        bg-zinc-900/60 backdrop-blur-xl border border-white/5 
        rounded-3xl p-8 shadow-2xl ring-1 ring-white/5
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        transition-all duration-700 ease-out
      `}>
        
        <button onClick={() => router.back()} className="absolute top-6 left-6 text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-8 mt-2">
          <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 mb-5 shadow-lg ${accentColor}`}>
            {isTeacher ? <GraduationCap className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
          </div>
          
          <h1 className="text-xl font-bold text-white tracking-tight">
            {isTeacher ? 'Teacher Portal' : 'Admin Console'}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Sign in to manage your {isTeacher ? 'classes' : 'school'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
              <input
                type="email"
                className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-700 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 outline-none transition-all"
                placeholder="user@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
              <input
                type="password"
                className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-700 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-3 rounded-xl font-semibold text-sm text-white shadow-lg 
              transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
              flex items-center justify-center gap-2 mt-4
              disabled:opacity-50 disabled:cursor-not-allowed
              ${buttonClass}
            `}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
          </button>

        </form>
      </div>
    </div>
  );
}