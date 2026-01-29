'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, QrCode, UserCircle, 
  LogOut, Menu, X, Bell, GraduationCap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/teacher/dashboard' },
  { name: 'Scan QR', icon: QrCode, href: '/teacher/scan' },
  { name: 'Profile', icon: UserCircle, href: '/teacher/profile' },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/auth/login');
        return;
      }
      setLoading(false);
    }
    checkSession();
  }, []);

  const closeMobileMenu = () => setIsMobileOpen(false);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin"></div>
        <span className="text-zinc-500 text-xs font-mono uppercase tracking-widest">Loading Workspace...</span>
      </div>
    </div>
  );

  return (
    // FIX: h-screen and overflow-hidden for independent scrolling
    <div className="h-screen w-full bg-black text-zinc-200 font-sans flex overflow-hidden selection:bg-emerald-500/30">
      
      {/* MOBILE OVERLAY */}
      <div 
        className={`fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* SIDEBAR */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        h-full bg-[#09090b] border-r border-white/5
        transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
        ${isMobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0'}
        ${sidebarOpen ? 'lg:w-[280px]' : 'lg:w-[80px]'}
        flex flex-col shadow-2xl shadow-black/50 lg:shadow-none
      `}>
        {/* LOGO */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20 shrink-0">
               <GraduationCap className="w-6 h-6" />
             </div>
             <div className={`flex flex-col transition-all duration-300 ${!sidebarOpen && 'lg:opacity-0 lg:w-0'}`}>
               <span className="font-bold text-white tracking-tight leading-none text-lg">Project Aalu</span>
               <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Faculty Portal</span>
             </div>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden text-zinc-400 hover:text-white transition-transform active:scale-95"><X className="w-6 h-6" /></button>
        </div>

        {/* NAV ITEMS */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
          {NAV_ITEMS.map((item, idx) => (
             <SidebarItem 
               key={idx} 
               item={item} 
               expanded={sidebarOpen || isMobileOpen} 
               onNavigate={closeMobileMenu} 
             />
          ))}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/5 bg-zinc-900/20 shrink-0">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'lg:justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center shrink-0 shadow-inner"><UserCircle className="w-5 h-5 text-zinc-400" /></div>
            <div className={`flex flex-col overflow-hidden transition-all duration-300 ${!sidebarOpen && 'lg:w-0 lg:opacity-0'}`}>
              <span className="text-sm font-bold text-white truncate">Teacher</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider truncate">Faculty Account</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-black relative">
        <header className="h-20 shrink-0 sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileOpen(true)} className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5"><Menu className="w-6 h-6" /></button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"><Menu className="w-5 h-5" /></button>
          </div>
          <div className="flex items-center gap-4">
             <div className="relative group hidden md:block">
               <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
               <button onClick={() => { router.push('/teacher/scan'); closeMobileMenu(); }} className="relative flex items-center gap-2 px-5 py-2.5 bg-zinc-900 rounded-xl text-sm font-bold text-white border border-white/10 hover:bg-zinc-800 transition-all"><QrCode className="w-4 h-4 text-emerald-400" /><span>Scan ID</span></button>
             </div>
             <div className="w-px h-8 bg-white/10 mx-2 hidden sm:block"></div>
             <LogoutButton />
          </div>
        </header>
        
        {/* INDEPENDENT SCROLLING CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar scroll-smooth">
          <div className="max-w-7xl mx-auto animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ item, expanded, onNavigate }: any) {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link 
      href={item.href} 
      onClick={onNavigate} 
      className={`
        group relative flex items-center px-3.5 py-3 rounded-xl transition-all duration-200 mb-1 mx-2 cursor-pointer
        ${isActive 
          ? 'bg-emerald-500/10 text-white' 
          : 'text-zinc-400 hover:bg-white/5 hover:text-white'}
      `}
    >
      {/* Active Strip */}
      {isActive && <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>}

      <item.icon className={`w-5 h-5 shrink-0 transition-colors ml-2 ${isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
      <span className={`ml-3.5 text-sm font-medium whitespace-nowrap transition-all duration-300 ${!expanded && 'lg:opacity-0 lg:w-0 overflow-hidden'}`}>
        {item.name}
      </span>
    </Link>
  );
}

function LogoutButton() {
  const router = useRouter();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out securely');
    router.replace('/');
  };
  return (
    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/5 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 border border-white/5 transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]">
      <LogOut className="w-3.5 h-3.5" /> <span className="hidden md:inline">Sign Out</span>
    </button>
  );
}