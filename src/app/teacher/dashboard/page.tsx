'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { 
  CheckCircle, XCircle, Clock, Calendar, 
  LogOut, Briefcase, ChevronDown, Loader2, 
  BarChart3, Filter, AlertCircle, ArrowUpRight 
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

function getMonthOptions() {
  const options = [];
  const today = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const value = d.toISOString().slice(0, 7); 
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  return options;
}

/* =========================
   COMPONENT
========================= */
export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'absent'>('overview');
  
  // Data State
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, workingDays: 0, attendanceRate: 0 });
  
  // Filter State
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    initDashboard();
  }, [selectedMonth]);

  async function initDashboard() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).single();
    if (!teacher) return;

    // 1. Today's Status
    const todayIST = getISTDateString();
    const { data: todayData } = await supabase
      .from('view_teacher_attendance_ist')
      .select('*')
      .eq('teacher_id', teacher.id)
      .eq('date', todayIST)
      .maybeSingle();

    setTodayRecord(todayData);

    // 2. Fetch History for Selected Month
    await fetchHistory(teacher.id, selectedMonth);
    setLoading(false);
  }

  async function fetchHistory(tid: string, monthStr: string) {
    const startObj = new Date(monthStr + "-01");
    const endObj = new Date(startObj.getFullYear(), startObj.getMonth() + 1, 0);

    const { data } = await supabase
      .from('view_teacher_attendance_ist')
      .select('*')
      .eq('teacher_id', tid)
      .gte('date', startObj.toISOString().slice(0, 10))
      .lte('date', endObj.toISOString().slice(0, 10))
      .order('date', { ascending: false });

    const records = data || [];
    setHistory(records);

    // Calculate Stats
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const total = present + absent;
    setStats({ 
      present, 
      absent, 
      workingDays: total,
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0
    });
  }

  async function handleCheckout() {
    if (!todayRecord) return;
    const { error } = await supabase
      .from('teacher_attendance')
      .update({ check_out: new Date().toISOString() })
      .eq('id', todayRecord.id);

    if (error) toast.error('Error checking out');
    else {
      toast.success('Checked out successfully');
      initDashboard();
    }
  }

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-zinc-800 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-zinc-500 text-sm font-medium animate-pulse">Syncing Dashboard...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in-up pb-24 md:pb-10 max-w-7xl mx-auto">
      
      {/* --- HEADER & CONTROLS --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Teacher Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage your attendance and activity logs.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Selector */}
          <div className="relative group">
            <div className="absolute left-3 top-2.5 text-zinc-500 pointer-events-none"><Calendar className="w-4 h-4" /></div>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-8 text-sm text-white focus:border-indigo-500 outline-none appearance-none cursor-pointer hover:bg-zinc-800 transition-colors"
            >
              {getMonthOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-600 pointer-events-none" />
          </div>

          {/* Checkout Button (If Active) */}
          {todayRecord && !todayRecord.raw_check_out && (
            <button 
              onClick={handleCheckout} 
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:shadow-red-900/20"
            >
              <LogOut className="w-4 h-4" /> End Shift
            </button>
          )}
        </div>
      </div>

      {/* --- STATS OVERVIEW CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Attendance Rate" value={`${stats.attendanceRate}%`} icon={<BarChart3 className="w-5 h-5" />} color="indigo" />
        <StatCard label="Days Present" value={stats.present} icon={<CheckCircle className="w-5 h-5" />} color="emerald" />
        <StatCard label="Days Absent" value={stats.absent} icon={<XCircle className="w-5 h-5" />} color="red" />
        <StatCard label="Working Days" value={stats.workingDays} icon={<Briefcase className="w-5 h-5" />} color="zinc" />
      </div>

      {/* --- MAIN CONTENT TABS --- */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl min-h-[500px] flex flex-col">
        
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 border-b border-white/5 bg-white/5 overflow-x-auto">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Overview" icon={<BarChart3 className="w-4 h-4" />} />
          <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} label="Daily Logs" icon={<Clock className="w-4 h-4" />} />
          <TabButton active={activeTab === 'absent'} onClick={() => setActiveTab('absent')} label="Absent Report" icon={<AlertCircle className="w-4 h-4" />} />
        </div>

        {/* Tab Content */}
        <div className="p-0 flex-1 bg-zinc-950/30">
          
          {/* VIEW: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="p-6 space-y-8">
              {/* Today's Status Box */}
              <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="relative z-10">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Today's Status</h3>
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${todayRecord ? (todayRecord.raw_check_out ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400') : 'bg-zinc-800 text-zinc-500'}`}>
                      {todayRecord ? (todayRecord.raw_check_out ? <CheckCircle className="w-8 h-8" /> : <Clock className="w-8 h-8 animate-pulse" />) : <XCircle className="w-8 h-8" />}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {todayRecord ? (todayRecord.raw_check_out ? 'Shift Completed' : 'Checked In') : 'Not Checked In'}
                      </p>
                      <p className="text-zinc-500 text-sm mt-1">
                        {todayRecord 
                          ? `In: ${todayRecord.check_in_ist} ${todayRecord.check_out_ist ? `• Out: ${todayRecord.check_out_ist}` : ''}`
                          : 'Please scan your QR code at the entrance.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Graph (Visual Representation) */}
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Monthly Activity</h3>
                <div className="flex flex-wrap gap-2">
                  {history.map((rec, i) => (
                    <div 
                      key={i} 
                      className={`w-3 h-10 rounded-sm transition-all hover:scale-110 cursor-help ${
                        rec.status === 'present' ? 'bg-emerald-500' : 'bg-red-500/20'
                      }`}
                      title={`${rec.date}: ${rec.status}`}
                    />
                  ))}
                  {history.length === 0 && <p className="text-zinc-600 text-sm italic">No data available for this period.</p>}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: DAILY LOGS */}
          {activeTab === 'logs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase text-zinc-400 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Check In</th>
                    <th className="px-6 py-4">Check Out</th>
                    <th className="px-6 py-4 text-right">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-zinc-300">{record.date}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="px-6 py-4 text-zinc-400">{record.check_in_ist || '-'}</td>
                      <td className="px-6 py-4 text-zinc-400">{record.check_out_ist || '-'}</td>
                      <td className="px-6 py-4 text-right text-zinc-500 font-mono">
                        {/* Placeholder for duration calculation if needed */}
                        {record.check_in_ist && record.check_out_ist ? '8h 0m' : '-'}
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW: ABSENT REPORT */}
          {activeTab === 'absent' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-red-500/5 text-xs uppercase text-red-400 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.filter(r => r.status === 'absent').map((record) => (
                    <tr key={record.id} className="hover:bg-red-500/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-zinc-300">{record.date}</td>
                      <td className="px-6 py-4"><StatusBadge status="absent" /></td>
                      <td className="px-6 py-4 text-zinc-500 italic">No remarks</td>
                    </tr>
                  ))}
                  {history.filter(r => r.status === 'absent').length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-12 text-center text-zinc-500">Perfect attendance! No absences found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* =========================
   SUB-COMPONENTS
========================= */

function StatCard({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: string }) {
  const colors: any = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    zinc: 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50',
  };

  return (
    <div className={`p-5 rounded-2xl border ${colors[color]} flex flex-col justify-between h-28`}>
      <div className="flex justify-between items-start">
        <p className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</p>
        <div className={`p-1.5 rounded-lg bg-white/5`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold font-mono">{value}</p>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: any) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
        ${active 
          ? 'bg-zinc-800 text-white shadow-lg' 
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}
      `}
    >
      {icon} {label}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'present') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle className="w-3 h-3" /> Present
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
      <XCircle className="w-3 h-3" /> Absent
    </span>
  );
}