'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, GraduationCap, ArrowRight, Sparkles, Layers } from 'lucide-react';

export default function RoleSelect() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-zinc-950 selection:bg-indigo-500/30 perspective-1000">
      
      {/* --- PREMIUM BACKGROUND SYSTEM --- */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:30px_30px] md:bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <div className="absolute top-[-10%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-indigo-500/20 blur-[80px] md:blur-[100px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-emerald-500/10 blur-[80px] md:blur-[100px] animate-pulse-slow delay-1000 pointer-events-none" />
      
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 w-full max-w-6xl px-4 flex flex-col items-center py-10 md:py-0">
        
        {/* Animated Badge */}
        <div className="mb-6 md:mb-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
            <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-indigo-400" />
            <span className="text-[10px] md:text-xs font-bold tracking-widest text-zinc-300 uppercase">Project Aalu v2.0</span>
          </div>
        </div>

        {/* Hero Typography */}
        <div className="text-center mb-10 md:mb-16 space-y-3 md:space-y-4 animate-fade-in-up delay-100">
          <h1 className="text-4xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 tracking-tighter drop-shadow-sm">
            Who are you?
          </h1>
          <p className="text-zinc-400 text-sm md:text-xl font-medium tracking-wide max-w-xs md:max-w-lg mx-auto leading-relaxed">
            Choose your portal to enter the ecosystem.
          </p>
        </div>

        {/* 3D CARDS CONTAINER */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-12 w-full max-w-[320px] md:max-w-4xl justify-center items-stretch perspective-container">
          
          {/* Admin Portal */}
          <TiltCard 
            title="Administrator" 
            role="System Architect"
            desc="Full control over users, fees & settings."
            icon={<ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-white" />}
            color="indigo"
            onClick={() => router.push('/auth/login?role=admin')}
            delay="delay-200"
          />

          {/* Teacher Portal */}
          <TiltCard 
            title="Faculty" 
            role="Academic Staff"
            desc="Manage attendance, profiles & logs."
            icon={<GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-white" />}
            color="emerald"
            onClick={() => router.push('/auth/login?role=teacher')}
            delay="delay-300"
          />

        </div>
        
        {/* Minimal Footer */}
        <div className="mt-12 md:mt-20 opacity-40 hover:opacity-100 transition-opacity duration-500 animate-fade-in delay-500">
            <div className="flex items-center gap-2 text-[10px] md:text-xs font-mono text-zinc-500">
                <Layers className="w-3 h-3" />
                <span>Secure ERP Environment</span>
            </div>
        </div>

      </div>
      
      <style jsx global>{`
        .perspective-container {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}

/* =========================================
   MOBILE-OPTIMIZED TILT CARD
========================================= */

function TiltCard({ title, role, desc, icon, color, onClick, delay }: any) {
  const themes: any = {
    indigo: {
      bg: 'from-indigo-500/20 to-violet-500/5',
      border: 'group-hover:border-indigo-500/50',
      glow: 'bg-indigo-500',
      text: 'text-indigo-300'
    },
    emerald: {
      bg: 'from-emerald-500/20 to-teal-500/5',
      border: 'group-hover:border-emerald-500/50',
      glow: 'bg-emerald-500',
      text: 'text-emerald-300'
    }
  };
  const theme = themes[color];

  const ref = useRef<HTMLButtonElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    // Disable tilt on mobile touch to prevent scrolling issues/confusion
    if (window.innerWidth < 768) return; 

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    const x = yPct * -15; 
    const y = xPct * 15; 

    setRotation({ x, y });
    setOpacity(1); 
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setOpacity(0);
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
      }}
      className={`
        group relative w-full 
        h-[200px] md:h-[320px] /* Much smaller on mobile */
        rounded-2xl md:rounded-3xl
        bg-zinc-900/40 backdrop-blur-xl border border-white/10
        flex flex-col items-start justify-between 
        p-5 md:p-8 /* Reduced padding on mobile */
        text-left
        transition-all duration-200 ease-out ${delay} animate-fade-in-up
        hover:shadow-2xl hover:shadow-black/50
        active:scale-95 /* Mobile touch feedback */
        ${theme.border}
      `}
    >
      <div 
        className="pointer-events-none absolute -inset-px rounded-2xl md:rounded-3xl opacity-0 transition-opacity duration-300 hidden md:block"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${rotation.y * 10 + 50}% ${rotation.x * -10 + 50}%, rgba(255,255,255,0.1), transparent 40%)`
        }}
      />
      
      <div className={`absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br ${theme.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="relative z-10 w-full transform transition-transform duration-200 md:translate-z-50">
        
        {/* Header Icon */}
        <div className={`
          w-10 h-10 md:w-14 md:h-14 /* Smaller icon on mobile */
          rounded-xl md:rounded-2xl 
          ${theme.glow}/20 flex items-center justify-center border border-white/5 
          mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300
        `}>
          {icon}
        </div>

        {/* Text Info */}
        <div>
          <h3 className={`text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1 md:mb-2 ${theme.text}`}>
            {role}
          </h3>
          <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight mb-1 md:mb-2">
            {title}
          </h2>
          <p className="text-zinc-400 text-xs md:text-sm font-medium leading-relaxed max-w-[90%]">
            {desc}
          </p>
        </div>
      </div>

      {/* Footer Action */}
      <div className="relative z-10 w-full flex items-center justify-between border-t border-white/5 pt-4 md:pt-6 mt-2 md:mt-4 group-hover:border-white/20 transition-colors">
        <span className="text-xs md:text-sm font-medium text-white">Enter Portal</span>
        <div className="bg-white/10 p-1.5 md:p-2 rounded-full group-hover:bg-white text-black transition-all duration-300">
           <ArrowRight className="w-3 h-3 md:w-4 md:h-4 text-white group-hover:text-black" />
        </div>
      </div>

    </button>
  );
}