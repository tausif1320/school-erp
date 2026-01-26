'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, QrCode, UserCircle, 
  TrendingUp, Wallet, Package, Shirt, BookOpen, 
  Plus, ChevronDown, ChevronRight, Search, Bell, LogOut 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

/* --- NAVIGATION CONFIG --- */
const NAV_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { name: 'Teacher', icon: Users, href: '/admin/teachers' }, // General teacher list
  { name: 'QR Settings', icon: QrCode, href: '/admin/qr' },
  { name: 'Profile', icon: UserCircle, href: '/admin/profile' },
  { name: 'Promote Student', icon: TrendingUp, href: '/admin/promote' },
  
  // FEES (Radio Style Submenu)
  {
    name: 'Fees',
    icon: Wallet,
    href: '#',
    submenu: [
      { name: 'Collect Fees', href: '/admin/fees' },
      { name: 'Classes', href: '/admin/fees/classes' },
    ]
  },

  // INVENTORY (Deep Nesting)
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
          { name: 'View Stock', href: '/admin/inventory/notebooks/stock' }
        ]
      },
      { 
        name: 'Uniforms', 
        icon: Shirt,
        subItems: [
          { name: 'Issue Items', href: '/admin/inventory/uniforms/issues' },
          { name: 'View Stock', href: '/admin/inventory/uniforms/stock' }
        ]
      }
    ]
  },

  // STUDENTS
  {
    name: 'Students',
    icon: Users,
    href: '#',
    submenu: [
      { name: 'Student Profiles', href: '/admin/students' }, // "ID"
    ]
  },

  // TEACHERS (Submenu)
  {
    name: 'Teachers Mgmt',
    icon: Users,
    href: '#',
    submenu: [
      { name: 'All Teachers', href: '/admin/teachers/[id]' },
      { name: 'Add Teacher', href: '/admin/teachers/add' },
    ]
  }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex font-sans selection:bg-teal-500/30">
      
      {/* SIDEBAR */}
      <aside className={`fixed z-20 h-full border-r border-slate-800 bg-[#1e293b] transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} overflow-y-auto custom-scrollbar`}>
        
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-400 to-blue-500 flex items-center justify-center font-bold text-white">
              E
            </div>
            {sidebarOpen && <span className="font-bold text-lg tracking-tight">EduDash</span>}
          </div>
        </div>

        {/* User Mini Profile */}
        <div className="p-4 border-b border-slate-700/50 mb-2">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-teal-500/30">
              <UserCircle className="w-full h-full text-slate-400" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Admin User</p>
                <p className="text-xs text-slate-400 truncate">Administrator</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <div className="p-3 space-y-1">
          {NAV_ITEMS.map((item, idx) => (
            <SidebarItem key={idx} item={item} expanded={sidebarOpen} />
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <main className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        
        {/* TOP NAVBAR */}
        <header className="h-16 bg-[#1e293b]/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-800 px-6 flex items-center justify-between">
          {/* Search */}
          <div className="relative w-64 md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-teal-500/50 transition-colors"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#1e293b]"></span>
            </button>
            <div className="w-px h-6 bg-slate-700"></div>
            <LogoutButton />
          </div>
        </header>

        {/* PAGE CONTENT INJECTION */}
        <div className="p-6">
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

  // Toggle for parent menus
  const handleClick = () => {
    if (hasSub) setIsOpen(!isOpen);
  };

  return (
    <div className="mb-1">
      <Link 
        href={hasSub ? '#' : item.href} 
        onClick={handleClick}
        className={`
          group flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer
          ${isActive ? 'bg-teal-500/10 text-teal-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}
        `}
      >
        <div className="flex items-center gap-3">
          <item.icon className={`w-5 h-5 ${isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
          {expanded && <span className="text-sm font-medium">{item.name}</span>}
        </div>
        {expanded && hasSub && (
          isOpen ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />
        )}
      </Link>

      {/* Level 1 Submenu */}
      {expanded && hasSub && isOpen && (
        <div className="mt-1 ml-4 pl-4 border-l border-slate-700 space-y-1">
          {item.submenu.map((sub: any, idx: number) => (
            sub.subItems ? (
               // Level 2 Submenu (Deep Nesting for Inventory)
               <NestedSidebarItem key={idx} item={sub} />
            ) : (
               // Standard Sub Item
               <Link 
                key={idx} 
                href={sub.href}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-teal-400 rounded-md hover:bg-slate-800/50 transition"
               >
                 {/* Radio Dot Indicator */}
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-teal-400"></div>
                 {sub.name}
               </Link>
            )
          ))}
        </div>
      )}
    </div>
  );
}

function NestedSidebarItem({ item }: any) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800/50 transition text-left"
      >
        <span className="flex items-center gap-2">
          {item.icon && <item.icon className="w-4 h-4" />}
          {item.name}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="ml-3 pl-3 mt-1 border-l border-slate-700 space-y-1">
          {item.subItems.map((sub: any, idx: number) => (
            <Link 
              key={idx} 
              href={sub.href}
              className="block px-3 py-1.5 text-xs text-slate-500 hover:text-teal-400 transition"
            >
              • {sub.name}
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
    toast.success('Logged out');
    router.push('/');
  };

  return (
    <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition">
      <LogOut className="w-4 h-4" />
      <span className="text-sm">Logout</span>
    </button>
  );
}