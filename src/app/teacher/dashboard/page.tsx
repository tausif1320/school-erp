'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { 
  CheckCircle, XCircle, Clock, CalendarDays, 
  LogOut, Briefcase, ChevronLeft, ChevronRight,
  ArrowRight, Sparkles, Coffee, BarChart3, Timer
} from 'lucide-react';

/* =========================
   TYPES & HELPERS
========================= */
type AttendanceRecord = {
  id: string;
  date: string;
  status: 'present' | 'absent';
  check_in_ist: string | null;
  check_out_ist: string | null;
};

function getISTDateString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { 
    day: '2-digit', month: 'short', year: 'numeric' 
  });
}

const formatTimeOnly = (dateString: string | null) => {
  if (!dateString) return '--:--';
  const parts = dateString.split(' ');
  if (parts.length >= 3) {
     return `${parts[1].slice(0, 5)} ${parts[2]}`;
  }
  if (dateString.includes('T')) {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  return dateString;
};

/* =========================
   ADAPTIVE PREMIUM STAT CARD
========================= */
function PremiumStatCard({ label, value, icon, color, subText }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotation({ x: y * -10, y: x * 10 });
  };

  const colors: any = {
    indigo: { 
      bg: 'from-indigo-500/10 to-violet-600/5', 
      border: 'border-indigo-100 dark:border-indigo-500/20', 
      icon: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-white/5',
      text: 'text-indigo-900 dark:text-white'
    },
    emerald: { 
      bg: 'from-emerald-500/10 to-teal-600/5', 
      border: 'border-emerald-100 dark:border-emerald-500/20', 
      icon: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-white/5',
      text: 'text-emerald-900 dark:text-white'
    },
    rose: { 
      bg: 'from-rose-500/10 to-red-600/5', 
      border: 'border-rose-100 dark:border-rose-500/20', 
      icon: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-white/5',
      text: 'text-rose-900 dark:text-white'
    },
    amber: { 
      bg: 'from-amber-500/10 to-orange-600/5', 
      border: 'border-amber-100 dark:border-amber-500/20', 
      icon: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-white/5',
      text: 'text-amber-900 dark:text-white'
    },
  };
  const theme = colors[color] || colors.indigo;

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setRotation({ x: 0, y: 0 })}
      style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`, transformStyle: 'preserve-3d' }}
      className={`
        relative group overflow-hidden rounded-3xl p-6 h-32 md:h-36
        bg-zinc-900/40 backdrop-blur-xl border border-white/5
        shadow-xl shadow-black/20
        transition-all duration-300 ease-out
        hover:shadow-2xl hover:scale-[1.02]
        active:scale-[0.98] cursor-pointer touch-manipulation
      `}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg} opacity-100 dark:opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300`} />
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg} opacity-0 dark:opacity-100 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300`} />
      
      <div className="relative z-10 h-full flex flex-col justify-between transform transition-transform duration-200" style={{ transform: "translateZ(20px)" }}>
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-zinc-400 transition-colors">{label}</span>
            <span className="text-zinc-600 text-[10px] font-medium mt-0.5">{subText}</span>
          </div>
          <div className={`p-2 rounded-2xl border border-transparent dark:border-white/5 ${theme.icon} group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
        </div>
        <div className="flex items-end gap-2">
           <span className={`text-3xl md:text-4xl font-bold tracking-tighter text-white`}>{value}</span>
        </div>
      </div>
    </div>
  );
}

/* =========================
   MAIN COMPONENT
========================= */
export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'absent'>('overview');
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, workingDays: 0, attendanceRate: 0 });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => { initDashboard(); }, 1000);
    return () => clearTimeout(timer);
  }, [selectedMonth]);

  async function initDashboard() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: teacher } = await supabase.from('teachers').select('id, full_name').eq('user_id', user.id).single();
    if (!teacher) return;

    const todayIST = getISTDateString();
    const { data: todayData } = await supabase.from('view_teacher_attendance_ist').select('*').eq('teacher_id', teacher.id).eq('date', todayIST).maybeSingle();
    setTodayRecord(todayData);
    await fetchHistory(teacher.id, selectedMonth);
    setLoading(false);
  }

  async function fetchHistory(tid: string, monthStr: string) {
    const startObj = new Date(monthStr + "-01");
    const endObj = new Date(startObj.getFullYear(), startObj.getMonth() + 1, 0);
    const { data } = await supabase.from('view_teacher_attendance_ist').select('*').eq('teacher_id', tid).gte('date', startObj.toISOString().slice(0, 10)).lte('date', endObj.toISOString().slice(0, 10)).order('date', { ascending: false });
    const records = data || [];
    setHistory(records);
    setCurrentPage(1); 
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const total = present + absent;
    setStats({ present, absent, workingDays: total, attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0 });
  }

  async function handleCheckout() {
    if (!todayRecord) return;
    const { error } = await supabase.from('teacher_attendance').update({ check_out: new Date().toISOString() }).eq('id', todayRecord.id);
    if (error) toast.error('Check-out failed');
    else { toast.success('Shift ended successfully'); initDashboard(); }
  }

  const getPaginatedData = (data: AttendanceRecord[]) => {
    const start = (currentPage - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  };
  const totalPages = (totalItems: number) => Math.ceil(totalItems / rowsPerPage);

  if (loading) return (
    <div className="h-[90vh] flex flex-col items-center justify-center bg-zinc-950 relative overflow-hidden">
        {/* --- LOADING BACKGROUND --- */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-zinc-500 text-xs font-mono uppercase tracking-widest animate-pulse">Syncing Workspace...</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 pb-20 selection:bg-indigo-500/30 relative">
      
      {/* --- PREMIUM BACKGROUND SYSTEM --- */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:30px_30px] md:bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-[100px] animate-pulse-slow pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[100px] animate-pulse-slow delay-1000 pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay z-0"></div>

      <div className="relative z-10 max-w-[1400px] mx-auto p-4 md:p-8 space-y-6 md:space-y-10 animate-fade-in-up">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Workspace Active</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tighter">Faculty Dashboard</h1>
            <p className="text-zinc-500 text-xs md:text-sm mt-1 font-medium">Welcome back. Here is your daily overview.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative group w-full md:w-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
              <div className="relative flex items-center bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 shadow-sm w-full md:w-auto">
                 <CalendarDays className="w-4 h-4 text-zinc-400 mr-3" />
                 <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent border-none outline-none text-sm text-zinc-200 w-full md:w-auto cursor-pointer font-medium" />
              </div>
            </div>
            {todayRecord && !todayRecord.raw_check_out && (
              <button onClick={handleCheckout} className="group relative px-6 py-2.5 rounded-xl font-bold text-sm text-white overflow-hidden shadow-lg shadow-rose-500/20 w-full md:w-auto active:scale-95 transition-transform">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-orange-600 transition-all duration-300 group-hover:scale-105"></div>
                <div className="relative flex items-center justify-center gap-2"><LogOut className="w-4 h-4" /> End Shift</div>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <PremiumStatCard label="Attendance" subText="Monthly Rate" value={`${stats.attendanceRate}%`} icon={<BarChart3 className="w-5 h-5" />} color="indigo" />
          <PremiumStatCard label="Present" subText="Days Active" value={stats.present} icon={<CheckCircle className="w-5 h-5" />} color="emerald" />
          <PremiumStatCard label="Absent" subText="Leaves Taken" value={stats.absent} icon={<XCircle className="w-5 h-5" />} color="rose" />
          <PremiumStatCard label="Working Days" subText="This Month" value={stats.workingDays} icon={<Briefcase className="w-5 h-5" />} color="amber" />
        </div>

        {/* Main Interface */}
        <div className={`bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-[32px] overflow-hidden shadow-2xl min-h-[500px] flex flex-col relative`}>
          <div className="flex items-center gap-2 p-2 md:p-3 border-b border-white/5 overflow-x-auto no-scrollbar">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Overview" />
            <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} label="History Logs" />
            <TabButton active={activeTab === 'absent'} onClick={() => setActiveTab('absent')} label="Absence Report" />
          </div>

          <div className="flex-1 p-0 relative">
            {activeTab === 'overview' && (
              <div className="p-4 md:p-8 h-full flex items-center justify-center animate-fade-in">
                <div className="w-full relative overflow-hidden rounded-2xl md:rounded-[2rem] border border-white/10 bg-zinc-950/50 shadow-2xl group">
                  <div className="absolute inset-0">
                    <div className={`absolute inset-0 bg-gradient-to-br ${todayRecord?.raw_check_out ? 'from-emerald-500/10 to-teal-500/5' : 'from-indigo-500/10 to-purple-500/5'} opacity-100`}></div>
                  </div>
                  
                  <div className="relative z-10 p-6 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 text-center md:text-left">
                    {/* Left: Status Circle */}
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                       <div className="relative">
                          <div className={`absolute inset-0 rounded-full blur-xl opacity-30 ${todayRecord ? (todayRecord.raw_check_out ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-zinc-500'}`}></div>
                          <div className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center bg-zinc-900 border border-white/10 backdrop-blur-md shadow-2xl`}>
                            {todayRecord ? (todayRecord.raw_check_out ? <CheckCircle className="w-10 h-10 text-emerald-400" /> : <Clock className="w-10 h-10 text-amber-400 animate-pulse" />) : <Coffee className="w-10 h-10 text-zinc-500" />}
                          </div>
                       </div>
                       <div>
                         <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                           <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                           <span className="text-[10px] md:text-xs font-bold text-amber-300 uppercase tracking-widest">{todayRecord ? (todayRecord.raw_check_out ? 'Shift Complete' : 'Active Shift') : 'Ready to Start'}</span>
                         </div>
                         <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tighter mb-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long' })}</h2>
                         <p className="text-zinc-400 font-medium text-sm md:text-base">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                       </div>
                    </div>

                    {/* Right: Time Boxes */}
                    {todayRecord ? (
                      <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch gap-3">
                        <DigitalTimeBox label="Check In" time={formatTimeOnly(todayRecord.check_in_ist)} type="in" />
                        
                        <div className="hidden md:flex items-center justify-center text-zinc-700">
                           <ArrowRight className="w-5 h-5 opacity-20" />
                        </div>
                        
                        <DigitalTimeBox label="Check Out" time={todayRecord.check_out_ist ? formatTimeOnly(todayRecord.check_out_ist) : '--:--'} type="out" />
                      </div>
                    ) : (
                      <div className="px-8 py-6 rounded-2xl bg-white/5 border border-white/5 text-zinc-400 text-sm font-medium w-full text-center md:w-auto flex flex-col items-center gap-2">
                        <div className="p-2 bg-white/5 rounded-lg mb-1"><CalendarDays className="w-5 h-5 text-zinc-500" /></div>
                        Scan your QR code to clock in.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Logs & Absent Views (Same logic, styling applied via global container) */}
            {activeTab === 'logs' && (
              <div className="flex flex-col h-full animate-fade-in">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest bg-white/5 border-b border-white/5">
                      <tr><th className="px-6 md:px-8 py-4">Date</th><th className="px-6 md:px-8 py-4">Status</th><th className="px-6 md:px-8 py-4">In Time</th><th className="px-6 md:px-8 py-4">Out Time</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {getPaginatedData(history).map((record) => (
                        <tr key={record.id} className="group hover:bg-white/5 transition-colors">
                          <td className="px-6 md:px-8 py-4 text-sm font-medium text-zinc-300 group-hover:text-white">{formatDisplayDate(record.date)}</td>
                          <td className="px-6 md:px-8 py-4"><StatusBadge status={record.status} /></td>
                          <td className="px-6 md:px-8 py-4 text-sm font-mono text-zinc-400">{record.check_in_ist ? <span className="text-emerald-400">{formatTimeOnly(record.check_in_ist)}</span> : '-'}</td>
                          <td className="px-6 md:px-8 py-4 text-sm font-mono text-zinc-400">{record.check_out_ist ? <span className="text-amber-400">{formatTimeOnly(record.check_out_ist)}</span> : '-'}</td>
                        </tr>
                      ))}
                      {history.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-zinc-500">No logs found.</td></tr>}
                    </tbody>
                  </table>
                </div>
                <PaginationFooter currentPage={currentPage} totalPages={totalPages(history.length)} onPageChange={setCurrentPage} />
              </div>
            )}
            {activeTab === 'absent' && (
              <div className="flex flex-col h-full animate-fade-in">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[500px]">
                    <thead className="text-[10px] font-bold uppercase text-red-400/70 tracking-widest bg-red-500/5 border-b border-red-500/10">
                      <tr><th className="px-6 md:px-8 py-4">Date Missed</th><th className="px-6 md:px-8 py-4">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {getPaginatedData(history.filter(r => r.status === 'absent')).map((record) => (
                        <tr key={record.id} className="hover:bg-red-500/5 transition-colors">
                          <td className="px-6 md:px-8 py-4 text-sm font-medium text-zinc-300">{formatDisplayDate(record.date)}</td>
                          <td className="px-6 md:px-8 py-4"><StatusBadge status="absent" /></td>
                        </tr>
                      ))}
                      {history.filter(r => r.status === 'absent').length === 0 && <tr><td colSpan={2} className="p-20 text-center text-zinc-500 flex flex-col items-center gap-3"><CheckCircle className="w-8 h-8 text-emerald-500/50" /><span>Perfect Attendance Record.</span></td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx global>{` .perspective-1000 { perspective: 1000px; } .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } `}</style>
    </div>
  );
}

/* =========================
   NEW: DIGITAL TIME BOX 
========================= */
function DigitalTimeBox({ label, time, type }: any) {
  const isOut = type === 'out';
  return (
    <div className={`
      relative overflow-hidden rounded-2xl p-4 w-full md:min-w-[140px]
      bg-zinc-900 border border-white/5 shadow-inner
      flex flex-col items-center justify-center gap-1
    `}>
      {/* Top Accent Line */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${isOut ? 'bg-amber-500' : 'bg-emerald-500'}`} />
      
      <div className="flex items-center gap-1.5 mb-1">
        {isOut ? <LogOut className="w-3 h-3 text-zinc-500" /> : <Timer className="w-3 h-3 text-zinc-500" />}
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
      </div>
      
      <div className={`text-xl md:text-2xl font-mono font-bold tracking-tight ${isOut ? 'text-amber-400' : 'text-emerald-400'}`}>
        {time}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: any) {
  return (
    <button onClick={onClick} className={`px-4 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all duration-300 whitespace-nowrap ${active ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>{label}</button>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'present') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>Present</span>;
  return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-rose-500/10 text-rose-400 border border-rose-500/20"><div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>Absent</span>;
}

function PaginationFooter({ currentPage, totalPages, onPageChange }: any) {
  return (
    <div className="p-4 border-t border-white/5 flex justify-end items-center gap-2">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30"><ChevronLeft className="w-4 h-4 text-zinc-400" /></button>
      <span className="text-xs font-mono text-zinc-500 px-2">{currentPage} / {totalPages || 1}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30"><ChevronRight className="w-4 h-4 text-zinc-400" /></button>
    </div>
  );
}