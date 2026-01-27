'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, UserCircle, Wallet, TrendingUp, Activity, 
  Plus, Calendar as CalendarIcon, CheckCircle2, 
  UserPlus, Clock, Package, AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

/* =========================
   3D TILT METRIC CARD
========================= */
function TiltMetric({ label, value, subLabel, icon, color }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotation({ x: y * -10, y: x * 10 });
  };

  const reset = () => setRotation({ x: 0, y: 0 });

  const colors: any = {
    indigo: { bg: 'from-indigo-500/10 to-violet-500/5', text: 'text-indigo-400', border: 'group-hover:border-indigo-500/30' },
    emerald: { bg: 'from-emerald-500/10 to-teal-500/5', text: 'text-emerald-400', border: 'group-hover:border-emerald-500/30' },
    rose: { bg: 'from-rose-500/10 to-red-500/5', text: 'text-rose-400', border: 'group-hover:border-rose-500/30' },
    amber: { bg: 'from-amber-500/10 to-orange-500/5', text: 'text-amber-400', border: 'group-hover:border-amber-500/30' },
    blue: { bg: 'from-blue-500/10 to-cyan-500/5', text: 'text-blue-400', border: 'group-hover:border-blue-500/30' },
    purple: { bg: 'from-purple-500/10 to-fuchsia-500/5', text: 'text-purple-400', border: 'group-hover:border-purple-500/30' },
  };
  const theme = colors[color];

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`, transformStyle: 'preserve-3d' }}
      className={`
        group relative overflow-hidden rounded-2xl p-5
        bg-zinc-900/40 backdrop-blur-md border border-white/5
        transition-all duration-200 ease-out
        hover:shadow-2xl hover:shadow-black/50 ${theme.border}
      `}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      <div className="relative z-10 transform translate-z-10">
        <div className="flex justify-between items-start mb-3">
          <div className={`p-2 rounded-xl bg-white/5 border border-white/5 ${theme.text}`}>
            {icon}
          </div>
          {subLabel && (
            <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-zinc-400">
              <TrendingUp className="w-3 h-3" /> {subLabel}
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-white tracking-tight mb-1">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 truncate">{label}</p>
      </div>
    </div>
  );
}

/* =========================
   SIMPLE CALENDAR WIDGET
========================= */
function CalendarWidget() {
  const [date, setDate] = useState(new Date());
  
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const startDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const today = new Date().getDate();
  const isCurrentMonth = new Date().getMonth() === date.getMonth();

  const changeMonth = (offset: number) => {
    setDate(new Date(date.getFullYear(), date.getMonth() + offset, 1));
  };

  return (
    <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white">{date.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
        <div className="flex gap-1">
          <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/10 rounded"><ChevronLeft className="w-4 h-4 text-zinc-400" /></button>
          <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white/10 rounded"><ChevronRight className="w-4 h-4 text-zinc-400" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-zinc-500 mb-2">
        {['S','M','T','W','T','F','S'].map(d => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          const isToday = isCurrentMonth && d === today;
          return (
            <div key={d} className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs font-bold ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50' : 'text-zinc-300 hover:bg-white/5'}`}>
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================
   MAIN DASHBOARD
========================= */
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    studentCount: 0,
    teacherCount: 0,
    presentToday: 0,
    totalRevenue: 0,
    inventoryCount: 0,
    lowStock: 0
  });
  
  const [recentAdmissions, setRecentAdmissions] = useState<any[]>([]);

  // IST Date Helper
  const getTodayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  useEffect(() => {
    async function fetchRealData() {
      try {
        const today = getTodayIST();

        // 1. Basic Counts
        const [studentsReq, teachersReq, attendanceReq] = await Promise.all([
          supabase.from('students').select('*', { count: 'exact', head: true }),
          supabase.from('teachers').select('*', { count: 'exact', head: true }),
          supabase.from('view_teacher_attendance_ist').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'present')
        ]);

        // 2. Fees & Inventory (Using 'maybeSingle' or handling errors gracefully if tables don't exist yet)
        // Note: I'm assuming 'fee_payments' and 'inventory_items' exist. If not, these return null/0.
        const { data: feeData } = await supabase.from('fee_payments').select('amount');
        const totalFees = feeData?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;

        const { data: invData } = await supabase.from('inventory_items').select('quantity, min_stock');
        const totalItems = invData?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
        const lowStockCount = invData?.filter(item => item.quantity <= item.min_stock).length || 0;

        // 3. Recent Activity
        const { data: latestStudents } = await supabase
          .from('students')
          .select('id, full_name, class, section, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          studentCount: studentsReq.count || 0,
          teacherCount: teachersReq.count || 0,
          presentToday: attendanceReq.count || 0,
          totalRevenue: totalFees,
          inventoryCount: totalItems,
          lowStock: lowStockCount
        });

        setRecentAdmissions(latestStudents || []);

      } catch (err) {
        console.error('Data fetch warning:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRealData();
  }, []);

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-zinc-500 text-sm font-medium animate-pulse">Loading Live Data...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in-up pb-20 perspective-1000">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Live System Status</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Command Center</h1>
          <p className="text-zinc-400 text-sm mt-1">Real-time overview of institution performance.</p>
        </div>
      </div>

      {/* --- 3D METRICS GRID (2 per row on mobile, 3/6 on desktop) --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        
        <TiltMetric 
          label="Total Students" 
          value={stats.studentCount} 
          subLabel="Enrolled"
          color="indigo"
          icon={<UserCircle className="w-5 h-5" />} 
        />
        
        <TiltMetric 
          label="Total Faculty" 
          value={stats.teacherCount} 
          subLabel="Staff"
          color="rose"
          icon={<Users className="w-5 h-5" />} 
        />

        <TiltMetric 
          label="Present Today" 
          value={stats.presentToday} 
          subLabel="Teachers"
          color="emerald"
          icon={<CheckCircle2 className="w-5 h-5" />} 
        />

        <TiltMetric 
          label="Fees Collected" 
          value={`₹${(stats.totalRevenue / 1000).toFixed(1)}k`} 
          subLabel="Revenue"
          color="amber"
          icon={<Wallet className="w-5 h-5" />} 
        />

        <TiltMetric 
          label="Inventory Items" 
          value={stats.inventoryCount} 
          subLabel="Stock"
          color="blue"
          icon={<Package className="w-5 h-5" />} 
        />

        <TiltMetric 
          label="Low Stock" 
          value={stats.lowStock} 
          subLabel="Alerts"
          color="purple"
          icon={<AlertTriangle className="w-5 h-5" />} 
        />
      </div>

      {/* --- MAIN LAYOUT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: ACTIVITY + CHARTS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-500" /> Recent Admissions
            </h2>
            <Link href="/admin/students" className="text-xs text-indigo-400 hover:text-indigo-300">View All</Link>
          </div>
          
          <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden p-1 min-h-[300px]">
            {recentAdmissions.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full py-12 text-zinc-500">
                 <p className="text-sm">No recent activity found.</p>
               </div>
            ) : (
              recentAdmissions.map((student) => (
                <ActivityItem 
                  key={student.id}
                  title={student.full_name}
                  desc={`Admitted to Class ${student.class} - ${student.section}`}
                  time={new Date(student.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  amount="New Student"
                  type="neutral"
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CALENDAR & ACTIONS */}
        <div className="space-y-6">
          
          {/* Calendar Widget */}
          <CalendarWidget />

          {/* Quick Actions */}
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-500" /> Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 gap-3">
            <QuickAction href="/admin/students/add" title="New Admission" desc="Register student" icon={<UserPlus className="w-4 h-4" />} />
            <QuickAction href="/admin/fees" title="Collect Fees" desc="Record payment" icon={<Wallet className="w-4 h-4" />} />
          </div>

        </div>

      </div>

      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .translate-z-10 { transform: translateZ(20px); }
      `}</style>
    </div>
  );
}

/* =========================
   SUB-COMPONENTS
========================= */

function ActivityItem({ title, desc, time, amount, type }: any) {
  return (
    <div className="group flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-colors cursor-default">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 bg-indigo-500/10 text-indigo-400`}>
          <UserPlus className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="text-xs text-zinc-500">{desc}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold font-mono text-emerald-400">{amount}</p>
        <p className="text-[10px] text-zinc-600">{time}</p>
      </div>
    </div>
  );
}

function QuickAction({ href, title, desc, icon }: any) {
  return (
    <Link href={href} className="group flex items-center justify-between p-4 rounded-2xl bg-zinc-900 border border-white/5 hover:border-indigo-500/30 hover:bg-zinc-800 transition-all active:scale-95">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-black/40 text-zinc-400 group-hover:text-white transition-colors">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-200 group-hover:text-white">{title}</p>
          <p className="text-xs text-zinc-500 group-hover:text-zinc-400">{desc}</p>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
        <Plus className="w-4 h-4" />
      </div>
    </Link>
  );
}