'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';

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

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-zinc-800">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-zinc-400 mt-1">Overview of your attendance and activity</p>
          </div>

          {/* TODAY STATUS CARD */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-6 w-full md:w-auto">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Today's Status</p>
              <div className="flex items-center gap-2 mt-1">
                {todayRecord ? (
                  todayRecord.raw_check_out ? (
                    <><CheckCircle className="text-green-500 w-5 h-5" /><span className="text-green-500 font-bold">Completed</span></>
                  ) : (
                    <><Clock className="text-yellow-500 w-5 h-5" /><span className="text-yellow-500 font-bold">Checked In</span></>
                  )
                ) : (
                  <><XCircle className="text-red-500 w-5 h-5" /><span className="text-red-500 font-bold">Not Present</span></>
                )}
              </div>
            </div>
            {todayRecord && !todayRecord.raw_check_out && (
              <button onClick={handleCheckout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-semibold transition">
                Check Out
              </button>
            )}
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Total Present" value={stats.present} color="text-green-400" bg="bg-green-500/10" border="border-green-500/20" />
          <StatCard label="Total Absent" value={stats.absent} color="text-red-400" bg="bg-red-500/10" border="border-red-500/20" />
          <StatCard label="Working Days" value={stats.workingDays} color="text-purple-400" bg="bg-purple-500/10" border="border-purple-500/20" />
        </div>

        {/* HISTORY TABLE */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-zinc-400" /> 
              Monthly Attendance
            </h2>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-black border border-zinc-700 text-zinc-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none cursor-pointer"
            >
              {getMonthOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-black text-xs uppercase font-semibold text-zinc-500">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Check In</th>
                  <th className="px-6 py-4">Check Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-600 italic">
                      No attendance records found for this month.
                    </td>
                  </tr>
                ) : (
                  history.map((record) => (
                    <tr key={record.id} className="hover:bg-zinc-800/50 transition">
                      <td className="px-6 py-4 text-zinc-200 font-medium">{record.date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${
                          record.status === 'present' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-zinc-300">{record.check_in_ist || '-'}</td>
                      <td className="px-6 py-4 font-mono text-zinc-300">{record.check_out_ist || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, color, bg, border }: any) {
  return (
    <div className={`${bg} ${border} border p-6 rounded-xl`}>
      <p className={`text-sm font-semibold uppercase tracking-wider mb-2 opacity-80 ${color}`}>{label}</p>
      <p className={`text-4xl font-bold ${color}`}>{value}</p>
    </div>
  );
}