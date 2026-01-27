'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, UserCircle, Wallet, TrendingUp, Activity, 
  Plus, Calendar, CheckCircle2, UserPlus, Clock
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
  };
  const theme = colors[color];

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`, transformStyle: 'preserve-3d' }}
      className={`
        group relative overflow-hidden rounded-2xl p-6
        bg-zinc-900/40 backdrop-blur-md border border-white/5
        transition-all duration-200 ease-out
        hover:shadow-2xl hover:shadow-black/50 ${theme.border}
      `}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      <div className="relative z-10 transform translate-z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2.5 rounded-xl bg-white/5 border border-white/5 ${theme.text}`}>
            {icon}
          </div>
          {subLabel && (
            <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-zinc-400">
              <TrendingUp className="w-3 h-3" /> {subLabel}
            </div>
          )}
        </div>
        <p className="text-3xl font-bold text-white tracking-tight mb-1">{value}</p>
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      </div>
    </div>
  );
}

/* =========================
   MAIN COMPONENT
========================= */
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  
  // Real Data State
  const [stats, setStats] = useState({
    studentCount: 0,
    teacherCount: 0,
    presentToday: 0
  });
  
  const [recentAdmissions, setRecentAdmissions] = useState<any[]>([]);

  // IST Date Helper
  const getTodayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  useEffect(() => {
    async function fetchRealData() {
      try {
        const today = getTodayIST();

        // 1. Fetch Counts (Parallel)
        const [studentsReq, teachersReq, attendanceReq] = await Promise.all([
          supabase.from('students').select('*', { count: 'exact', head: true }),
          supabase.from('teachers').select('*', { count: 'exact', head: true }),
          supabase.from('view_teacher_attendance_ist')
            .select('*', { count: 'exact', head: true })
            .eq('date', today)
            .eq('status', 'present')
        ]);

        // 2. Fetch Recent Activity (Newest Students)
        const { data: latestStudents } = await supabase
          .from('students')
          .select('id, full_name, class, section, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          studentCount: studentsReq.count || 0,
          teacherCount: teachersReq.count || 0,
          presentToday: attendanceReq.count || 0
        });

        setRecentAdmissions(latestStudents || []);

      } catch (err) {
        console.error('Dashboard data fetch failed', err);
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

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-full text-xs text-zinc-400">
             <Calendar className="w-3.5 h-3.5" />
             <span>{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* --- 3D METRICS GRID (REAL DATA) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: STUDENTS */}
        <TiltMetric 
          label="Total Students" 
          value={stats.studentCount} 
          subLabel="Enrolled"
          color="indigo"
          icon={<UserCircle className="w-6 h-6" />} 
        />
        
        {/* CARD 2: TEACHERS */}
        <TiltMetric 
          label="Total Faculty" 
          value={stats.teacherCount} 
          subLabel="Staff"
          color="rose"
          icon={<Users className="w-6 h-6" />} 
        />

        {/* CARD 3: ATTENDANCE TODAY (Real Query) */}
        <TiltMetric 
          label="Teachers Present Today" 
          value={stats.presentToday} 
          subLabel={getTodayIST()}
          color="emerald"
          icon={<CheckCircle2 className="w-6 h-6" />} 
        />
      </div>

      {/* --- MAIN LAYOUT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: REAL RECENT ACTIVITY */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-500" /> Recent Admissions
            </h2>
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

        {/* RIGHT COLUMN: QUICK ACTIONS */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-500" /> Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 gap-3">
            <QuickAction href="/admin/students/add" title="New Admission" desc="Register student" icon={<UserPlus className="w-4 h-4" />} />
            <QuickAction href="/admin/fees" title="Collect Fees" desc="Record payment" icon={<Wallet className="w-4 h-4" />} />
            <QuickAction href="/admin/teachers/add" title="Add Faculty" desc="Onboard staff" icon={<Users className="w-4 h-4" />} />
          </div>

          {/* System Health Status */}
          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-indigo-900 to-violet-900 border border-white/10">
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white mb-1">Database Connected</h3>
              <p className="text-indigo-200 text-xs mb-4">Syncing with Supabase instance.</p>
              <div className="h-1 w-full bg-black/20 rounded-full overflow-hidden">
                <div className="h-full w-full bg-indigo-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500 blur-[50px] opacity-50 pointer-events-none"></div>
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