'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, QrCode, UserCircle, 
  LogOut, Menu, X, Bell, Search
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

/* =========================
   TEACHER NAVIGATION
========================= */
const NAV_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/teacher/dashboard' },
  { name: 'Scan QR', icon: QrCode, href: '/teacher/scan' },
  { name: 'Profile', icon: UserCircle, href: '/teacher/profile' },
];

/* =========================
   LAYOUT COMPONENT
========================= */
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /* --- AUTH CHECK --- */
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please login first');
        router.replace('/auth/login');
        return;
      }
      setLoading(false);
    }
    checkSession();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800" />
        <span className="text-zinc-500 text-sm font-medium tracking-wide">Loading Session...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans flex selection:bg-indigo-500/30">
      
      {/* MOBILE OVERLAY */}
      <div 
        className={`fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* SIDEBAR */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        h-screen bg-zinc-900/40 backdrop-blur-xl border-r border-white/5
        transition-all duration-300 ease-spring
        ${isMobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0'}
        ${sidebarOpen ? 'lg:w-[280px]' : 'lg:w-[80px]'}
        flex flex-col shadow-2xl shadow-black/50
      `}>
        {/* LOGO HEADER */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20 shrink-0">
               T
             </div>
             <div className={`flex flex-col transition-opacity duration-300 ${!sidebarOpen && 'lg:opacity-0 lg:w-0'}`}>
               <span className="font-bold text-white tracking-tight leading-none">Project Aalu</span>
               <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-1">Faculty Portal</span>
             </div>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 custom-scrollbar">
          {NAV_ITEMS.map((item, idx) => (
             <SidebarItem 
               key={idx} 
               item={item} 
               expanded={sidebarOpen || isMobileOpen} 
             />
          ))}
        </div>

        {/* USER FOOTER */}
        <div className="p-4 border-t border-white/5 bg-zinc-900/30">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'lg:justify-center'}`}>
            <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
              <UserCircle className="w-5 h-5 text-zinc-400" />
            </div>
            <div className={`flex flex-col overflow-hidden transition-all duration-300 ${!sidebarOpen && 'lg:w-0 lg:opacity-0'}`}>
              <span className="text-sm font-medium text-white truncate">Teacher</span>
              <span className="text-xs text-zinc-500 truncate">Faculty Account</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 bg-black/20">
        
        {/* TOPBAR */}
        <header className="h-20 sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 lg:px-8">
          
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileOpen(true)} className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5">
              <Menu className="w-6 h-6" />
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative group hidden md:block">
               <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-200"></div>
               <button 
                 onClick={() => router.push('/teacher/scan')}
                 className="relative flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-lg text-sm font-medium text-white border border-white/10 hover:bg-zinc-800 transition-all"
               >
                 <QrCode className="w-4 h-4 text-emerald-400" />
                 <span>Scan ID</span>
               </button>
             </div>

             <div className="w-px h-6 bg-white/10 mx-1"></div>
             <LogoutButton />
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="p-4 lg:p-8 flex-1 overflow-x-hidden animate-fade-in-up">
          {children}
        </div>

      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function SidebarItem({ item, expanded }: any) {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link 
      href={item.href} 
      className={`
        group flex items-center px-3.5 py-3 rounded-xl transition-all duration-200 mb-1 mx-1
        ${isActive 
          ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' 
          : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent'}
      `}
    >
      <item.icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
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
    router.replace('/auth/login');
  };
  return (
    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white/5 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 border border-white/5 transition-all">
      <LogOut className="w-3.5 h-3.5" />
      <span className="hidden md:inline">Sign Out</span>
    </button>
  );
}