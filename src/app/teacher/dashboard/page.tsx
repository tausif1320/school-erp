'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { 
  CheckCircle, XCircle, Clock, Calendar, 
  LogOut, Briefcase, ChevronDown, Loader2, 
  BarChart3, AlertCircle, ChevronLeft, ChevronRight,
  CalendarDays
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

// Get today's date in YYYY-MM-DD (IST)
function getISTDateString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
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
  
  // Filter State (Default to current month YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

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
    // Calculate start and end of the selected month
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
    setCurrentPage(1); // Reset to page 1 on new data

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
      .update({ check_out: new Date().toISOString() }) // View handles timezone conv
      .eq('id', todayRecord.id);

    if (error) toast.error('Error checking out');
    else {
      toast.success('Checked out successfully');
      initDashboard();
    }
  }

  // --- PAGINATION HELPERS ---
  const getPaginatedData = (data: AttendanceRecord[]) => {
    const start = (currentPage - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  };

  const totalPages = (totalItems: number) => Math.ceil(totalItems / rowsPerPage);

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

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Custom Month Picker */}
          <div className="relative group w-full md:w-auto">
            <div className="absolute left-3 top-2.5 text-zinc-500 pointer-events-none z-10"><CalendarDays className="w-4 h-4" /></div>
            <input 
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full md:w-48 bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-indigo-500 outline-none cursor-pointer hover:bg-zinc-800 transition-colors [color-scheme:dark] font-medium"
            />
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
        <div className="p-0 flex-1 bg-zinc-950/30 flex flex-col">
          
          {/* VIEW: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="p-6 space-y-8 animate-fade-in">
              {/* Today's Status Box */}
              <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-2xl p-8 relative overflow-hidden group hover:border-white/20 transition-all">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  
                  {/* Status Circle */}
                  <div className={`
                    p-6 rounded-3xl flex items-center justify-center shadow-2xl
                    ${todayRecord 
                      ? (todayRecord.raw_check_out 
                        ? 'bg-emerald-500/10 text-emerald-400 shadow-emerald-500/10' 
                        : 'bg-amber-500/10 text-amber-400 shadow-amber-500/10') 
                      : 'bg-zinc-800 text-zinc-500 shadow-black/50'}
                  `}>
                    {todayRecord ? (todayRecord.raw_check_out ? <CheckCircle className="w-12 h-12" /> : <Clock className="w-12 h-12 animate-pulse" />) : <XCircle className="w-12 h-12" />}
                  </div>

                  {/* Text Details */}
                  <div className="text-center md:text-left">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Today's Status</h3>
                    <p className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
                      {todayRecord ? (todayRecord.raw_check_out ? 'Shift Completed' : 'Checked In') : 'Not Checked In'}
                    </p>
                    <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                       <Clock className="w-4 h-4 text-zinc-400" />
                       <span className="text-zinc-300 font-mono text-sm">
                         {todayRecord 
                           ? `IN: ${todayRecord.check_in_ist || '--:--'}  •  OUT: ${todayRecord.check_out_ist || '--:--'}`
                           : 'Waiting for check-in...'}
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: DAILY LOGS (Paginated) */}
          {activeTab === 'logs' && (
            <div className="flex flex-col h-full animate-fade-in">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase text-zinc-400 font-semibold border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Check In (IST)</th>
                      <th className="px-6 py-4">Check Out (IST)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {getPaginatedData(history).map((record) => (
                      <tr key={record.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 font-mono text-zinc-300 group-hover:text-white transition-colors">{record.date}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={record.status} />
                        </td>
                        <td className="px-6 py-4 text-zinc-400 font-mono">
                          {record.check_in_ist ? <span className="text-emerald-400">{record.check_in_ist}</span> : '-'}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 font-mono">
                          {record.check_out_ist ? <span className="text-amber-400">{record.check_out_ist}</span> : '-'}
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-500">No records found for this period.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Footer */}
              {history.length > 0 && (
                <div className="p-4 border-t border-white/5 bg-black/20 flex justify-between items-center">
                  <p className="text-xs text-zinc-500">
                    Showing {Math.min((currentPage - 1) * rowsPerPage + 1, history.length)} - {Math.min(currentPage * rowsPerPage, history.length)} of {history.length}
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-zinc-400" />
                    </button>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages(history.length), p + 1))}
                      disabled={currentPage === totalPages(history.length)}
                      className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: ABSENT REPORT (Paginated) */}
          {activeTab === 'absent' && (
            <div className="flex flex-col h-full animate-fade-in">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm">
                  <thead className="bg-red-500/5 text-xs uppercase text-red-400 font-semibold border-b border-red-500/10">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {getPaginatedData(history.filter(r => r.status === 'absent')).map((record) => (
                      <tr key={record.id} className="hover:bg-red-500/5 transition-colors">
                        <td className="px-6 py-4 font-mono text-zinc-300">{record.date}</td>
                        <td className="px-6 py-4"><StatusBadge status="absent" /></td>
                      </tr>
                    ))}
                    {history.filter(r => r.status === 'absent').length === 0 && (
                      <tr><td colSpan={2} className="px-6 py-12 text-center text-zinc-500">
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle className="w-8 h-8 text-emerald-500/50" />
                          <span>Perfect Attendance! No absences.</span>
                        </div>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
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
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:shadow-indigo-500/10',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:shadow-emerald-500/10',
    red: 'bg-red-500/10 text-red-400 border-red-500/20 hover:shadow-red-500/10',
    zinc: 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:shadow-white/5',
  };

  return (
    <div className={`
      p-5 rounded-2xl border ${colors[color]} 
      flex flex-col justify-between h-28 
      transition-all duration-300 hover:scale-[1.03] hover:shadow-lg
      cursor-default
    `}>
      <div className="flex justify-between items-start">
        <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">{label}</p>
        <div className={`p-1.5 rounded-lg bg-white/5`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold font-mono tracking-tight">{value}</p>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: any) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
        ${active 
          ? 'bg-zinc-800 text-white shadow-lg border border-white/5' 
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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle className="w-3 h-3" /> Present
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
      <XCircle className="w-3 h-3" /> Absent
    </span>
  );
}