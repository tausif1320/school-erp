'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { 
  CheckCircle, XCircle, Clock, Calendar, 
  LogOut, Briefcase, ChevronDown, Loader2, BarChart3 
} from 'lucide-react';

/* =========================
   LOGIC HELPERS (UNCHANGED)
========================= */
function getISTDateString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function getMonthOptions() {
  const options = [];
  const today = new Date();
  for (let i = 0; i < 6; i++) {
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
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, workingDays: 0 });
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

    // 2. History
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

    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    setStats({ present, absent, workingDays: present + absent });
  }

  async function handleCheckout() {
    if (!todayRecord) return;
    const { error } = await supabase
      .from('teacher_attendance')
      .update({ check_out: new Date().toISOString() })
      .eq('id', todayRecord.id);

    if (error) toast.error('Error');
    else {
      toast.success('Checked out!');
      initDashboard();
    }
  }

  /* =========================
     UI RENDER
  ========================= */
  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-zinc-500 text-sm animate-pulse font-medium">Syncing Dashboard...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in-up pb-24 md:pb-10 max-w-6xl mx-auto">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">Overview of your daily activity and attendance.</p>
        </div>

        {/* TODAY STATUS CARD */}
        <div className="w-full md:w-auto bg-zinc-900/60 backdrop-blur-md border border-white/5 p-1.5 rounded-2xl flex items-center shadow-xl">
          <div className="px-5 py-3 flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${todayRecord ? (todayRecord.raw_check_out ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400') : 'bg-red-500/10 text-red-400'}`}>
              {todayRecord ? (todayRecord.raw_check_out ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />) : <XCircle className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Today's Status</p>
              <p className={`font-bold text-sm ${todayRecord ? (todayRecord.raw_check_out ? 'text-emerald-400' : 'text-amber-400') : 'text-red-400'}`}>
                {todayRecord ? (todayRecord.raw_check_out ? 'Shift Completed' : 'Checked In') : 'Not Present'}
              </p>
            </div>
          </div>
          
          {/* Checkout Button */}
          {todayRecord && !todayRecord.raw_check_out && (
            <button 
              onClick={handleCheckout} 
              className="ml-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border-l border-white/5 px-6 py-4 rounded-r-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 h-full"
            >
              <LogOut className="w-4 h-4" /> Check Out
            </button>
          )}
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Present" 
          value={stats.present} 
          icon={<CheckCircle className="w-5 h-5" />}
          style="emerald"
        />
        <StatCard 
          label="Total Absent" 
          value={stats.absent} 
          icon={<XCircle className="w-5 h-5" />}
          style="red"
        />
        <StatCard 
          label="Working Days" 
          value={stats.workingDays} 
          icon={<Briefcase className="w-5 h-5" />}
          style="indigo"
        />
      </div>

      {/* --- HISTORY TABLE --- */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-xl min-h-[400px] flex flex-col">
        
        {/* Table Header & Filter */}
        <div className="p-6 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><Calendar className="w-5 h-5" /></div>
            Attendance Log
          </h2>
          
          <div className="relative group w-full sm:w-64">
            <div className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-white transition-colors pointer-events-none">
              <BarChart3 className="w-4 h-4" />
            </div>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-8 text-sm text-white focus:border-indigo-500 focus:bg-black/60 outline-none appearance-none cursor-pointer transition-all font-medium"
            >
              {getMonthOptions().map(opt => (
                <option key={opt.value} value={opt.value} className="bg-zinc-900">{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-600 pointer-events-none" />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="text-xs text-zinc-400 uppercase bg-black/20 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Date</th>
                <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold tracking-wider">Check In</th>
                <th className="px-6 py-4 font-bold tracking-wider">Check Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-500">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-3">
                        <Calendar className="w-8 h-8 opacity-50" />
                      </div>
                      <p className="text-sm font-medium">No records found for this month.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record.id} className="group hover:bg-white/5 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <span className="text-white font-medium font-mono text-sm">
                        {new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${
                        record.status === 'present' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {record.status === 'present' && <CheckCircle className="w-3 h-3" />}
                        {record.status === 'absent' && <XCircle className="w-3 h-3" />}
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {record.check_in_ist ? (
                        <span className="text-zinc-300 font-mono text-sm bg-white/5 px-2 py-1 rounded border border-white/5">
                          {record.check_in_ist}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {record.check_out_ist ? (
                        <span className="text-zinc-300 font-mono text-sm bg-white/5 px-2 py-1 rounded border border-white/5">
                          {record.check_out_ist}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs italic">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

/* =========================
   UI COMPONENT: STAT CARD
========================= */
function StatCard({ label, value, icon, style }: { label: string, value: number, icon: React.ReactNode, style: 'emerald' | 'red' | 'indigo' }) {
  const styles = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  };

  return (
    <div className={`relative overflow-hidden p-6 rounded-3xl border ${styles[style]} flex flex-col justify-between group transition-all hover:scale-[1.02]`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className={`p-3 rounded-2xl bg-white/5 border border-white/5 ${styles[style].split(' ')[1]}`}>
          {icon}
        </span>
      </div>
      
      <div className="relative z-10">
        <p className="text-4xl font-bold text-white mb-1 font-mono tracking-tight">{value}</p>
        <p className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</p>
      </div>
    </div>
  );
}