'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, QrCode, UserCircle, 
  TrendingUp, Wallet, Package, Shirt, BookOpen, 
  ChevronDown, ChevronRight, Search, Sun, Moon, LogOut, Menu
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

/* --- UPDATED NAVIGATION CONFIG --- */
const NAV_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { name: 'Teachers', icon: Users, href: '/admin/teachers' },
  { name: 'Students', icon: UserCircle, href: '/admin/students' },
  { name: 'Promote Students', icon: TrendingUp, href: '/admin/promote' }, // Restored
  { name: 'QR Settings', icon: QrCode, href: '/admin/qr' },
  { name: 'Fees', icon: Wallet, href: '#', submenu: [
      { name: 'Collect Fees', href: '/admin/fees' },
      { name: 'Fee Classes', href: '/admin/fees/classes' },
  ]},
  { name: 'Inventory', icon: Package, href: '#', submenu: [
      { name: 'Notebooks', icon: BookOpen, subItems: [
          { name: 'Issue', href: '/admin/inv/notebooks/issues' },
          { name: 'Stock', href: '/admin/inv/notebooks/stock' }
      ]},
      { name: 'Uniforms', icon: Shirt, subItems: [
          { name: 'Issue', href: '/admin/inv/uniforms/issues' },
          { name: 'Stock', href: '/admin/inv/uniforms/stock' }
      ]}
  ]},
  { name: 'Profile', icon: UserCircle, href: '/admin/profile' }, // Restored
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <div className={`min-h-screen font-sans selection:bg-purple-500/30 ${isDarkMode ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'} transition-colors duration-500`}>
      
      {/* --- GLOBAL BACKGROUND EFFECTS --- */}
      {isDarkMode && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-900/20 blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-900/20 blur-[120px] animate-pulse-slow delay-1000" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed z-30 h-full border-r transition-all duration-300 ease-out
        ${sidebarOpen ? 'w-72' : 'w-20'}
        ${isDarkMode ? 'border-white/10 bg-black/40 backdrop-blur-xl' : 'border-gray-200 bg-white'}
      `}>
        {/* Brand Logo */}
        <div className="h-20 flex items-center justify-center border-b border-white/5 mx-4">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <span className="font-bold text-white text-xl">A</span>
            </div>
            <span className={`font-bold text-xl tracking-tight transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
              Project Aalu
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <div className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-80px)] custom-scrollbar">
          {NAV_ITEMS.map((item, idx) => (
            <SidebarItem key={idx} item={item} expanded={sidebarOpen} isDark={isDarkMode} />
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <main className={`relative z-10 flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        
        {/* GLASS HEADER */}
        <header className={`
          h-20 sticky top-0 z-20 px-8 flex items-center justify-between
          border-b backdrop-blur-md transition-colors duration-300
          ${isDarkMode ? 'border-white/5 bg-black/20' : 'border-gray-200 bg-white/80'}
        `}>
          <div className="flex items-center gap-6">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition">
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden md:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className={`
                  w-64 rounded-full py-2.5 pl-10 pr-4 text-sm outline-none border transition-all
                  ${isDarkMode 
                    ? 'bg-white/5 border-white/10 text-white focus:border-purple-500/50 focus:bg-white/10' 
                    : 'bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-purple-100'}
                `}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-full border transition-all duration-300 ${isDarkMode ? 'border-white/10 bg-white/5 hover:bg-white/10 text-yellow-400' : 'border-gray-200 bg-gray-100 text-gray-600'}`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className={`h-8 w-[1px] ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
            <LogoutButton isDark={isDarkMode} />
          </div>
        </header>

        {/* PAGE CONTENT + SMOOTH TRANSITION KEY */}
        <div className="p-8 animate-fade-in-up">
          {children}
        </div>

      </main>
    </div>
  );
}

// --- SUB-COMPONENTS (Same as before) ---
function SidebarItem({ item, expanded, isDark }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const hasSub = !!item.submenu;

  return (
    <div>
      <Link 
        href={hasSub ? '#' : item.href} 
        onClick={() => hasSub && setIsOpen(!isOpen)}
        className={`
          group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200
          ${isActive 
            ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/10 border border-purple-500/30 text-white shadow-[0_0_20px_-5px_rgba(168,85,247,0.4)]' 
            : isDark ? 'text-zinc-400 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}
        `}
      >
        <div className="flex items-center gap-3">
          <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-purple-400' : 'group-hover:text-purple-400'}`} />
          <span className={`font-medium text-sm transition-all duration-300 ${expanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
            {item.name}
          </span>
        </div>
        {expanded && hasSub && (
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : 'text-zinc-600'}`} />
        )}
      </Link>
      {expanded && hasSub && (
        <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden ml-4 pl-4 border-l border-white/10 space-y-1">
            {item.submenu.map((sub: any, idx: number) => (
              sub.subItems ? (
                <NestedItem key={idx} item={sub} isDark={isDark} />
              ) : (
                <Link key={idx} href={sub.href} className={`block px-4 py-2.5 rounded-lg text-sm transition-colors ${isDark ? 'text-zinc-500 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-purple-600'}`}>{sub.name}</Link>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NestedItem({ item, isDark }: any) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className={`w-full flex items-center justify-between px-4 py-2 text-sm rounded-lg transition ${isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-600'}`}>
        <span className="flex items-center gap-2">{item.icon && <item.icon className="w-4 h-4" />}{item.name}</span>
        <ChevronRight className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-2">
          {item.subItems.map((sub: any, i: number) => (
             <Link key={i} href={sub.href} className={`block px-3 py-1.5 text-xs rounded transition ${isDark ? 'text-zinc-500 hover:text-purple-400' : 'text-gray-500'}`}>{sub.name}</Link>
          ))}
        </div>
      )}
    </div>
  );
}

function LogoutButton({ isDark }: any) {
  const router = useRouter();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out');
    router.push('/');
  };
  return <button onClick={handleLogout} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${isDark ? 'hover:bg-red-500/10 text-zinc-400 hover:text-red-400' : 'hover:bg-red-50'}`}><LogOut className="w-4 h-4" /><span>Logout</span></button>;
}