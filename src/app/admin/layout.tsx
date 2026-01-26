'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, QrCode, UserCircle, 
  TrendingUp, Wallet, Package, Shirt, BookOpen, 
  ChevronDown, ChevronRight, Search, LogOut, Menu, X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { name: 'Teachers', icon: Users, href: '/admin/teachers' },
  { name: 'Students', icon: UserCircle, href: '/admin/students' },
  { name: 'Promote', icon: TrendingUp, href: '/admin/promote' },
  { name: 'QR Settings', icon: QrCode, href: '/admin/qr' },
  { name: 'Fees', icon: Wallet, href: '#', submenu: [
      { name: 'Collect Fees', href: '/admin/fees/collect' },
      { name: 'Classes', href: '/admin/fees/classes' },
  ]},
  { name: 'Inventory', icon: Package, href: '#', submenu: [
      { name: 'Notebooks', icon: BookOpen, subItems: [
          { name: 'Issue', href: '/admin/inventory/notebooks/issues' },
          { name: 'Stock', href: '/admin/inventory/notebooks/stock' }
      ]},
      { name: 'Uniforms', icon: Shirt, subItems: [
          { name: 'Issue', href: '/admin/inventory/uniforms/issues' },
          { name: 'Stock', href: '/admin/inventory/uniforms/stock' }
      ]}
  ]},
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
      if (!user) {
        return router.replace('/auth/login?role=admin');
      }

      // Check if this user is actually a TEACHER
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (teacher) {
        // If they are a teacher, KICK THEM OUT of Admin Panel
        toast.error('Restricted Area: Redirecting to Teacher Dashboard');
        router.replace('/teacher/dashboard');
      } else {
        // If NOT a teacher, assume Admin
        setChecking(false);
      }
    }
    verifyAdmin();
  }, []);

  if (checking) return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">Verifying Admin Access...</div>;

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans flex selection:bg-indigo-500/30">
      
      {/* Mobile Overlay */}
      {isMobileOpen && <div className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        h-full bg-zinc-900/50 backdrop-blur-xl border-r border-white/5
        transition-all duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
        ${sidebarOpen ? 'lg:w-64' : 'lg:w-20'}
        flex flex-col
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-white/5">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">A</div>
             <span className={`font-semibold tracking-tight transition-opacity duration-300 ${!sidebarOpen && 'lg:hidden'}`}>Project Aalu</span>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="absolute right-4 text-zinc-500 lg:hidden"><X className="w-5 h-5" /></button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {NAV_ITEMS.map((item, idx) => <SidebarItem key={idx} item={item} expanded={sidebarOpen || isMobileOpen} />)}
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0 bg-black">
        {/* Header */}
        <header className="h-16 sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileOpen(true)} className="lg:hidden p-2 text-zinc-400 hover:text-white"><Menu className="w-6 h-6" /></button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block p-2 text-zinc-400 hover:text-white rounded-lg transition"><Menu className="w-5 h-5" /></button>
            <div className="hidden md:flex items-center bg-white/5 border border-white/5 rounded-full px-4 py-1.5 w-64 focus-within:border-zinc-700 transition">
               <Search className="w-4 h-4 text-zinc-500 mr-2" />
               <input className="bg-transparent border-none outline-none text-sm text-zinc-300 w-full placeholder:text-zinc-600" placeholder="Search..." />
            </div>
          </div>
          <LogoutButton />
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8 flex-1 overflow-x-hidden animate-fade-in-up">
          {children}
        </div>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function SidebarItem({ item, expanded }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const hasSub = !!item.submenu;

  return (
    <div>
      <Link 
        href={hasSub ? '#' : item.href} onClick={() => hasSub && setIsOpen(!isOpen)}
        className={`group flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer mb-1 ${isActive ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
      >
        <div className="flex items-center gap-3">
          <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
          <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${!expanded && 'lg:hidden'}`}>{item.name}</span>
        </div>
        {expanded && hasSub && <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </Link>
      {expanded && hasSub && (
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="ml-5 pl-3 border-l border-white/10 space-y-1 mt-1">
            {item.submenu.map((sub: any, idx: number) => (
              sub.subItems ? <NestedItem key={idx} item={sub} /> :
              <Link key={idx} href={sub.href} className="block px-3 py-2 text-xs text-zinc-500 hover:text-indigo-400 hover:bg-white/5 rounded-md transition">{sub.name}</Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NestedItem({ item }: any) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition">
        <span className="flex items-center gap-2">{item.icon && <item.icon className="w-3 h-3" />}{item.name}</span>
        <ChevronRight className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && <div className="ml-3 mt-1 border-l border-white/10 pl-2 space-y-1">{item.subItems.map((sub: any, i: number) => <Link key={i} href={sub.href} className="block px-3 py-1.5 text-[11px] text-zinc-500 hover:text-indigo-400 rounded-md transition">{sub.name}</Link>)}</div>}
    </div>
  );
}

function LogoutButton() {
  const router = useRouter();
  const handleLogout = async () => { await supabase.auth.signOut(); toast.success('Logged out'); router.push('/'); };
  return <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition border border-red-500/20"><LogOut className="w-3 h-3" /><span className="hidden md:inline">Logout</span></button>;
}