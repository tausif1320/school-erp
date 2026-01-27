'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, QrCode, UserCircle, 
  TrendingUp, Wallet, Package, Shirt, BookOpen, 
  ChevronDown, ChevronRight, Search, LogOut, Menu, X, Bell
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

  // --- SECURITY CHECK ---
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

  // Helper to close menu on mobile click
  const closeMobileMenu = () => setIsMobileOpen(false);

  if (checking) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800" />
        <span className="text-zinc-500 text-sm font-medium tracking-wide">Verifying Access...</span>
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
             <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20 shrink-0">
               A
             </div>
             <div className={`flex flex-col transition-opacity duration-300 ${!sidebarOpen && 'lg:opacity-0 lg:w-0'}`}>
               <span className="font-bold text-white tracking-tight leading-none">Project Aalu</span>
               <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-1">Admin Suite</span>
             </div>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION SCROLL AREA */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 custom-scrollbar">
          {NAV_ITEMS.map((item, idx) => (
             <SidebarItem 
               key={idx} 
               item={item} 
               expanded={sidebarOpen || isMobileOpen}
               onNavigate={closeMobileMenu} // Pass the close handler
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
              <span className="text-sm font-medium text-white truncate">Administrator</span>
              <span className="text-xs text-zinc-500 truncate">admin@school.com</span>
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
            <div className="hidden md:flex items-center bg-zinc-900/50 border border-white/5 rounded-full px-4 py-2 w-72 focus-within:border-zinc-700 focus-within:bg-zinc-900 transition-all group">
               <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-zinc-300 mr-3" />
               <input className="bg-transparent border-none outline-none text-sm text-zinc-200 w-full placeholder:text-zinc-600" placeholder="Search..." />
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button className="relative p-2 text-zinc-400 hover:text-white transition-colors"><Bell className="w-5 h-5" /></button>
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

function SidebarItem({ item, expanded, onNavigate }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isActive = pathname === item.href || (item.submenu && item.submenu.some((sub: any) => pathname.startsWith(sub.href)));
  const hasSub = !!item.submenu;

  return (
    <div>
      <Link 
        href={hasSub ? '#' : item.href} 
        onClick={(e) => {
          if (hasSub) {
            e.preventDefault();
            setIsOpen(!isOpen);
          } else {
            onNavigate(); // Close menu on click
          }
        }}
        className={`
          group flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-200 cursor-pointer mb-1 mx-1
          ${isActive ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent'}
        `}
      >
        <div className="flex items-center gap-3.5">
          <item.icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
          <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${!expanded && 'lg:opacity-0 lg:w-0 overflow-hidden'}`}>
            {item.name}
          </span>
        </div>
        {expanded && hasSub && (
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} opacity-60`} />
        )}
      </Link>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded && isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="ml-5 pl-4 border-l border-white/10 space-y-1 mt-1 mb-2">
          {item.submenu?.map((sub: any, idx: number) => (
            sub.subItems ? <NestedItem key={idx} item={sub} onNavigate={onNavigate} /> :
            <Link 
              key={idx} 
              href={sub.href} 
              onClick={onNavigate} // Close menu on submenu click
              className={`block px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${pathname === sub.href ? 'text-indigo-400 bg-white/5' : 'text-zinc-500 hover:text-indigo-400 hover:bg-white/5'}`}
            >
              {sub.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function NestedItem({ item, onNavigate }: any) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
        <span className="flex items-center gap-2">{item.icon && <item.icon className="w-3.5 h-3.5" />}{item.name}</span>
        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="ml-3 mt-1 border-l border-white/10 pl-2 space-y-0.5">
          {item.subItems.map((sub: any, i: number) => (
             <Link 
               key={i} 
               href={sub.href} 
               onClick={onNavigate} // Close menu on deep nested click
               className={`block px-3 py-1.5 text-[13px] rounded-md transition-colors ${pathname === sub.href ? 'text-indigo-400 font-medium' : 'text-zinc-500 hover:text-indigo-400'}`}
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
    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white/5 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 border border-white/5 transition-all">
      <LogOut className="w-3.5 h-3.5" /> <span className="hidden md:inline">Sign Out</span>
    </button>
  );
}