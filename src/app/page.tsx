'use client';

import { useRouter } from 'next/navigation';
import { ShieldCheck, GraduationCap, ChevronRight } from 'lucide-react';

export default function RoleSelect() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-black selection:bg-indigo-500/30 px-4 sm:px-6">
      
      {/* --- BACKGROUND EFFECTS --- */}
      {/* Mobile: Smaller, softer blobs. Desktop: Large blobs */}
      <div className="absolute top-[-10%] left-[-20%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full bg-purple-900/20 blur-[80px] md:blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-blue-900/20 blur-[80px] md:blur-[120px] animate-pulse-slow delay-1000" />
      
      {/* Noise Texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        
        {/* Header Text (Fade In Animation) */}
        <div className="text-center mb-10 md:mb-16 space-y-3 md:space-y-4 animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tight">
            Welcome Portal
          </h1>
          <p className="text-zinc-400 text-base md:text-xl font-light tracking-wide max-w-md mx-auto">
            Select your role to continue
          </p>
        </div>

        {/* Card Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12 w-full max-w-sm md:max-w-4xl">
          
          {/* Admin Card */}
          <RoleCard 
            title="Administrator" 
            description="Manage settings & users."
            icon={<ShieldCheck className="w-8 h-8 md:w-12 md:h-12 text-purple-400" />}
            gradient="group-hover:from-purple-500/20 group-hover:to-blue-500/5"
            borderColor="group-hover:border-purple-500/50"
            delay="delay-100" // Staggered animation
            onClick={() => router.push('/auth/login?role=admin')}
          />

          {/* Teacher Card */}
          <RoleCard 
            title="Teacher" 
            description="Mark attendance & profile."
            icon={<GraduationCap className="w-8 h-8 md:w-12 md:h-12 text-cyan-400" />}
            gradient="group-hover:from-cyan-500/20 group-hover:to-blue-500/5"
            borderColor="group-hover:border-cyan-500/50"
            delay="delay-200" // Staggered animation
            onClick={() => router.push('/auth/login?role=teacher')}
          />

        </div>
        
        {/* Footer */}
        <div className="mt-12 md:mt-16 animate-fade-in delay-300">
            <p className="text-center text-zinc-700 text-xs md:text-sm font-mono">
                Secure ERP System v1.0
            </p>
        </div>

      </div>
    </div>
  );
}

/* --- REUSABLE COMPONENT --- */

function RoleCard({ title, description, icon, onClick, gradient, borderColor, delay }: any) {
  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full text-left
        bg-zinc-900/40 backdrop-blur-xl 
        border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 
        transition-all duration-300 ease-out
        
        /* Desktop Hover Effects */
        hover:scale-[1.02] hover:-translate-y-1 
        hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]
        
        /* Mobile Touch Feedback (Ripple/Press) */
        active:scale-95 active:bg-zinc-800/60
        
        /* Fade In Animation */
        animate-fade-in-up ${delay} fill-mode-forwards opacity-0
        
        ${borderColor}
        overflow-hidden
      `}
    >
      {/* Hover Gradient Background (Hidden on touch, visible on hover) */}
      <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-transparent opacity-0 transition-opacity duration-500 ${gradient} group-hover:opacity-100`} />
      
      {/* Content */}
      <div className="relative z-10 flex items-center md:items-start md:flex-col h-full gap-4 md:gap-0 justify-between">
        
        {/* Icon & Text Wrapper */}
        <div className="flex items-center md:block gap-4">
            <div className="p-2 md:p-3 w-fit rounded-xl md:rounded-2xl bg-white/5 border border-white/5 md:mb-6 group-hover:bg-white/10 transition-colors shrink-0">
                {icon}
            </div>
            
            <div>
                <h2 className="text-xl md:text-3xl font-semibold text-white mb-1 md:mb-2 tracking-tight group-hover:text-white transition-colors">
                    {title}
                </h2>
                
                <p className="text-zinc-400 text-sm md:text-base font-light leading-snug group-hover:text-zinc-300 transition-colors">
                    {description}
                </p>
            </div>
        </div>

        {/* Arrow (Visible on Mobile too now) */}
        <div className="md:mt-8 flex items-center text-sm font-medium text-zinc-600 md:text-zinc-500 group-hover:text-white transition-colors shrink-0">
          <ChevronRight className="w-5 h-5 md:w-4 md:h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
}