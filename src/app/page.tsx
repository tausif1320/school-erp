'use client';

import { useRouter } from 'next/navigation';
import { ShieldCheck, GraduationCap, ChevronRight } from 'lucide-react';

export default function RoleSelect() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black selection:bg-indigo-500/30">
      
      {/* --- BACKGROUND EFFECTS --- */}
      {/* Gradient Blob 1 */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-900/20 blur-[120px] animate-pulse-slow" />
      {/* Gradient Blob 2 */}
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/20 blur-[120px] animate-pulse-slow delay-1000" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 w-full max-w-5xl px-6">
        
        {/* Header Text */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tight">
            Welcome Portal
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl font-light tracking-wide">
            Select your role to continue to the dashboard
          </p>
        </div>

        {/* Card Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 w-full max-w-4xl mx-auto">
          
          {/* Admin Card */}
          <RoleCard 
            title="Administrator" 
            description="Manage settings, users, and school configurations."
            icon={<ShieldCheck className="w-12 h-12 mb-4 text-purple-400" />}
            gradient="group-hover:from-purple-500/20 group-hover:to-blue-500/5"
            borderColor="group-hover:border-purple-500/50"
            onClick={() => router.push('/auth/login?role=admin')}
          />

          {/* Teacher Card */}
          <RoleCard 
            title="Teacher" 
            description="Mark attendance, view stats, and manage profile."
            icon={<GraduationCap className="w-12 h-12 mb-4 text-cyan-400" />}
            gradient="group-hover:from-cyan-500/20 group-hover:to-blue-500/5"
            borderColor="group-hover:border-cyan-500/50"
            onClick={() => router.push('/auth/login?role=teacher')}
          />

        </div>
        
        {/* Footer */}
        <p className="text-center text-zinc-600 text-sm mt-16 font-mono">
          Secure ERP System v1.0
        </p>

      </div>
    </div>
  );
}

/* --- REUSABLE COMPONENT --- */

function RoleCard({ title, description, icon, onClick, gradient, borderColor }: any) {
  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full text-left
        bg-zinc-900/40 backdrop-blur-2xl 
        border border-white/10 rounded-3xl p-8 
        transition-all duration-500 ease-out
        hover:scale-[1.02] hover:-translate-y-1 
        hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]
        ${borderColor}
        overflow-hidden
      `}
    >
      {/* Hover Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-transparent opacity-0 transition-opacity duration-500 ${gradient} group-hover:opacity-100`} />
      
      {/* Shine Effect */}
      <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-0 group-hover:animate-shine" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="p-3 w-fit rounded-2xl bg-white/5 border border-white/5 mb-6 group-hover:bg-white/10 transition-colors">
            {icon}
          </div>
          
          <h2 className="text-3xl font-semibold text-white mb-2 tracking-tight group-hover:text-white transition-colors">
            {title}
          </h2>
          
          <p className="text-zinc-400 font-light leading-relaxed group-hover:text-zinc-300 transition-colors">
            {description}
          </p>
        </div>

        <div className="mt-8 flex items-center text-sm font-medium text-zinc-500 group-hover:text-white transition-colors gap-2">
          <span>Access Portal</span>
          <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
}