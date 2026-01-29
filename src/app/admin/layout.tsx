'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, QrCode, UserCircle, 
  TrendingUp, Wallet, Package, Shirt, BookOpen, 
  ChevronDown, ChevronRight, Search, LogOut, Menu, X, Bell, ShieldCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  {
    name: 'Teachers',
    icon: Users,
    href: '#',
    submenu: [
      { name: 'All Teachers', href: '/admin/teachers' },
      { name: 'Add Teacher', href: '/admin/teachers/add' },
    ]
  },
  { 
    name: 'Students', 
    icon: UserCircle, 
    href: '#', 
    submenu: [
      { name: 'All Students', href: '/admin/students' },
      { name: 'Add Student', href: '/admin/students/add' },
    ]
  },
  { name: 'Promote', icon: TrendingUp, href: '/admin/promote' },
  { name: 'QR Settings', icon: QrCode, href: '/admin/qr' },
  { 
    name: 'Fees', 
    icon: Wallet, 
    href: '#', 
    submenu: [
      { name: 'Collect Fees', href: '/admin/fees' },
      { name: 'Fee Structure', href: '/admin/fees/classes' },
    ]
  },
  { 
    name: 'Inventory', 
    icon: Package, 
    href: '#', 
    submenu: [
      { 
        name: 'Notebooks', 
        icon: BookOpen, 
        subItems: [
          { name: 'Issue Items', href: '/admin/inventory/notebooks/issues' },
          { name: 'Stock Status', href: '/admin/inventory/notebooks/stock' }
        ]
      },
      { 
        name: 'Uniforms', 
        icon: Shirt, 
        subItems: [
          { name: 'Issue Items', href: '/admin/inventory/uniforms/issues' },
          { name: 'Stock Status', href: '/admin/inventory/uniforms/stock' }
        ]
      }
    ]
  },
  { name: 'Profile', icon: UserCircle, href: '/admin/profile' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  // --- SECURITY CHECK (Unchanged) ---
  useEffect(() => {
    async function verifyAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace('/auth/login?role=admin');

      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (teacher) {
        toast.error('Restricted Area: Redirecting to Teacher Dashboard');
        router.replace('/teacher/dashboard');
      } else {
        setChecking(false);
      }
    }
    verifyAdmin();
  }, []);

  const closeMobileMenu = () => setIsMobileOpen(false);

  if (checking) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-indigo-500 rounded-full animate-spin"></div>
        <span className="text-zinc-500 text-xs font-mono uppercase tracking-widest">Verifying Privileges...</span>
      </div>
    </div>
  );

  return (
    // FIX: h-screen and overflow-hidden prevent the body from scrolling
    <div className="h-screen w-full bg-black text-zinc-200 font-sans flex overflow-hidden selection:bg-indigo-500/30">
      
      {/* MOBILE OVERLAY */}
      <div 
        className={`fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* SIDEBAR (Fixed Height, Independent Scroll) */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        h-full bg-[#09090b] border-r border-white/5
        transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
        ${isMobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0'}
        ${sidebarOpen ? 'lg:w-[280px]' : 'lg:w-[80px]'}
        flex flex-col shadow-2xl shadow-black/50 lg:shadow-none
      `}>
        {/* LOGO AREA */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20 shrink-0">
               <ShieldCheck className="w-6 h-6" />
             </div>
             <div className={`flex flex-col transition-all duration-300 ${!sidebarOpen && 'lg:opacity-0 lg:w-0'}`}>
               <span className="font-bold text-white tracking-tight leading-none text-lg">Project Aalu</span>
               <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Admin Console</span>
             </div>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden text-zinc-400 hover:text-white transition-transform active:scale-95">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* NAVIGATION AREA (Scrollable) */}
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

        {/* USER FOOTER (Pinned to Bottom) */}
        <div className="p-4 border-t border-white/5 bg-zinc-900/20 shrink-0">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'lg:justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
              <UserCircle className="w-5 h-5 text-zinc-400" />
            </div>
            <div className={`flex flex-col overflow-hidden transition-all duration-300 ${!sidebarOpen && 'lg:w-0 lg:opacity-0'}`}>
              <span className="text-sm font-bold text-white truncate">Administrator</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider truncate">System Root</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER (Flex Column) */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-black relative">
        
        {/* TOPBAR (Sticky) */}
        <header className="h-20 shrink-0 sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileOpen(true)} className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Search Bar */}
            <div className="hidden md:flex items-center bg-zinc-900/50 border border-white/5 rounded-full px-4 py-2.5 w-80 focus-within:border-indigo-500/50 focus-within:bg-zinc-900 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all group">
               <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 mr-3 transition-colors" />
               <input className="bg-transparent border-none outline-none text-sm text-zinc-200 w-full placeholder:text-zinc-600 font-medium" placeholder="Type / to search..." />
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button className="relative p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
               <Bell className="w-5 h-5" />
               <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-black"></span>
             </button>
             <div className="w-px h-8 bg-white/10 mx-2 hidden sm:block"></div>
             <LogoutButton />
          </div>
        </header>

        {/* SCROLLABLE PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar scroll-smooth">
          <div className="max-w-7xl mx-auto animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// --- REUSABLE SIDEBAR COMPONENTS ---

function SidebarItem({ item, expanded, onNavigate }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  // Check if active or if any child is active
  const isActive = pathname === item.href || (item.submenu && item.submenu.some((sub: any) => pathname.startsWith(sub.href)));
  const hasSub = !!item.submenu;

  return (
    <div className="mb-1">
      <Link 
        href={hasSub ? '#' : item.href} 
        onClick={(e) => {
          if (hasSub) {
            e.preventDefault();
            setIsOpen(!isOpen);
          } else {
            onNavigate(); 
          }
        }}
        className={`
          group relative flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-200 cursor-pointer mx-2
          ${isActive 
            ? 'bg-indigo-500/10 text-white' 
            : 'text-zinc-400 hover:bg-white/5 hover:text-white'}
        `}
      >
        {/* Active Indicator Strip */}
        {isActive && <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>}

        <div className="flex items-center gap-3.5 pl-2">
          <item.icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
          <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${!expanded && 'lg:opacity-0 lg:w-0 overflow-hidden'}`}>
            {item.name}
          </span>
        </div>
        {expanded && hasSub && (
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} opacity-50`} />
        )}
      </Link>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded && isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="ml-6 pl-4 border-l border-white/10 space-y-1 mt-1 mb-2">
          {item.submenu?.map((sub: any, idx: number) => (
            sub.subItems ? <NestedItem key={idx} item={sub} onNavigate={onNavigate} pathname={pathname} /> :
            <Link 
              key={idx} 
              href={sub.href} 
              onClick={onNavigate} 
              className={`block px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${pathname === sub.href ? 'text-indigo-400 bg-indigo-500/5 font-medium' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              {sub.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function NestedItem({ item, onNavigate, pathname }: any) {
  const [open, setOpen] = useState(false);
  const isActive = item.subItems.some((sub: any) => pathname === sub.href);
  
  return (
    <div>
      <button onClick={() => setOpen(!open)} className={`w-full flex items-center justify-between px-4 py-2 text-sm rounded-lg transition-colors ${isActive ? 'text-indigo-300' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
        <span className="flex items-center gap-2">{item.icon && <item.icon className="w-3.5 h-3.5 opacity-70" />}{item.name}</span>
        <ChevronRight className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="ml-3 mt-1 border-l border-white/10 pl-3 space-y-1">
          {item.subItems.map((sub: any, i: number) => (
             <Link 
               key={i} 
               href={sub.href} 
               onClick={onNavigate}
               className={`block px-3 py-1.5 text-xs rounded-md transition-colors ${pathname === sub.href ? 'text-indigo-400 font-bold bg-white/5' : 'text-zinc-500 hover:text-indigo-300'}`}
             >
               {sub.name}
             </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function LogoutButton() {
  const router = useRouter();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };
  return (
    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]">
      <LogOut className="w-3.5 h-3.5" /> <span className="hidden md:inline">Sign Out</span>
    </button>
  );
}