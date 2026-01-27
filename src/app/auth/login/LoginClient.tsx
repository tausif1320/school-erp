'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { 
  Mail, Lock, ArrowRight, Loader2, Sparkles, 
  ShieldCheck, LayoutDashboard, ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'teacher'; // Default to teacher if not specified

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success(`Welcome back, ${role === 'admin' ? 'Administrator' : 'Faculty'}!`);
      
      // Delay redirect slightly for the toast to be seen and "feel" smooth
      setTimeout(() => {
        if (role === 'admin') router.push('/admin/dashboard');
        else router.push('/teacher/dashboard');
      }, 800);

    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials');
      setLoading(false);
    }
  }

  // Visual assets based on role
  const config = role === 'admin' ? {
    title: 'Administrator Access',
    subtitle: 'Manage the entire ecosystem.',
    gradient: 'from-indigo-600 to-violet-600',
    icon: <ShieldCheck className="w-6 h-6 text-indigo-300" />,
    bgClass: 'bg-indigo-950/30'
  } : {
    title: 'Faculty Portal',
    subtitle: 'Mark attendance & manage profile.',
    gradient: 'from-emerald-600 to-teal-600',
    icon: <LayoutDashboard className="w-6 h-6 text-emerald-300" />,
    bgClass: 'bg-emerald-950/30'
  };

  if (!isClient) return null; // Hydration fix

  return (
    <div className="min-h-screen w-full flex bg-black text-white selection:bg-indigo-500/30">
      
      {/* --- LEFT SIDE: VISUAL STORYTELLING (Desktop Only) --- */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-zinc-900 items-center justify-center">
        {/* Animated Gradient Mesh Background */}
        <div className="absolute inset-0 z-0">
          <div className={`absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-gradient-to-br ${config.gradient} opacity-20 blur-[120px] animate-pulse-slow`}></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-blue-600 opacity-20 blur-[120px] animate-pulse-slow delay-1000"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        </div>

        <div className="relative z-10 max-w-lg px-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-medium text-zinc-300">Project Aalu v2.0</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">
            Simplifying School Management.
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed">
            Experience a seamless, intelligent platform designed to automate attendance, streamline fees, and empower education.
          </p>

          {/* Testimonial / Credibility Indicator */}
          <div className="mt-12 flex items-center gap-4">
             <div className="flex -space-x-4">
               {[1,2,3].map(i => (
                 <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                   U{i}
                 </div>
               ))}
             </div>
             <div className="text-sm">
               <p className="font-bold text-white">Trusted by Staff</p>
               <p className="text-zinc-500">Secure & Reliable Platform</p>
             </div>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: LOGIN FORM --- */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 relative">
        
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Role Selection
        </Link>

        <div className="w-full max-w-[400px] animate-fade-in-up">
          
          {/* Header */}
          <div className="mb-8">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-2xl ${config.bgClass} border border-white/5`}>
              {config.icon}
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">{config.title}</h2>
            <p className="text-zinc-400">{config.subtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-white transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.com"
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:bg-zinc-900 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-white transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:bg-zinc-900 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
               <label className="flex items-center gap-2 cursor-pointer group">
                 <input type="checkbox" className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-offset-black focus:ring-indigo-500 transition-all" />
                 <span className="text-zinc-500 group-hover:text-zinc-400 transition-colors">Remember me</span>
               </label>
               <button type="button" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Forgot password?</button>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`
                w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98]
                flex items-center justify-center gap-2
                bg-gradient-to-r ${config.gradient} hover:shadow-indigo-500/20
                disabled:opacity-70 disabled:cursor-not-allowed
              `}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

          </form>

          {/* Footer */}
          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-zinc-500 text-sm">
              Don't have an account? <span className="text-zinc-300 font-medium cursor-not-allowed">Contact Admin</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense for Next.js 13+ searchParams support
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">Loading Interface...</div>}>
      <LoginContent />
    </Suspense>
  );
}