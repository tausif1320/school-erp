'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

// --- HELPERS ---
function getISTDateString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function getMonthOptions() {
  const options = [];
  const today = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const value = d.toISOString().slice(0, 7); // "2026-01"
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  return options;
}

type AttendanceRecord = {
  id: string;
  date: string;
  check_in_ist: string;
  check_out_ist: string;
  status: string;
  raw_check_out: string | null;
};

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  
  // Data State
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, workingDays: 0 });
  
  // Filter State (Default to current month "YYYY-MM")
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    initDashboard();
  }, [selectedMonth]); // Reload when month changes

  async function initDashboard() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Get Teacher ID
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!teacher) return;
    setTeacherId(teacher.id);

    // 2. Fetch Today's Status
    const todayIST = getISTDateString();
    const { data: todayData } = await supabase
      .from('view_teacher_attendance_ist')
      .select('*')
      .eq('teacher_id', teacher.id)
      .eq('date', todayIST)
      .maybeSingle();

    setTodayRecord(todayData);

    // 3. Fetch Monthly History & Calculate Stats
    await fetchMonthlyHistory(teacher.id, selectedMonth);
    
    setLoading(false);
  }

  async function fetchMonthlyHistory(tid: string, monthStr: string) {
    // monthStr is "2026-01"
    const startObj = new Date(monthStr + "-01");
    const endObj = new Date(startObj.getFullYear(), startObj.getMonth() + 1, 0); // Last day of month

    const startDate = startObj.toISOString().slice(0, 10);
    const endDate = endObj.toISOString().slice(0, 10);

    const { data } = await supabase
      .from('view_teacher_attendance_ist')
      .select('*')
      .eq('teacher_id', tid)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    const records = data || [];
    setHistory(records);

    // Calculate Stats
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    
    setStats({
      present,
      absent,
      workingDays: present + absent
    });
  }

  async function handleCheckout() {
    if (!todayRecord) return;

    const { error } = await supabase
      .from('teacher_attendance')
      .update({ check_out: new Date().toISOString() }) // Write UTC
      .eq('id', todayRecord.id);

    if (error) {
      toast.error('Checkout failed');
    } else {
      toast.success('Checked out!');
      initDashboard(); // Refresh UI
    }
  }

  if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      
      {/* HEADER & TODAY'S ACTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Welcome back, here is your summary.</p>
        </div>
        
        {/* Today's Quick Action Card */}
        <div className="bg-white border p-4 rounded-xl shadow-sm flex items-center gap-4 w-full md:w-auto">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Today's Status</p>
            <p className="font-mono font-semibold text-lg">
              {todayRecord ? (todayRecord.raw_check_out ? '✅ Completed' : '🕒 In Progress') : '❌ Not Checked In'}
            </p>
          </div>
          {todayRecord && !todayRecord.raw_check_out && (
            <button onClick={handleCheckout} className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">
              Check Out
            </button>
          )}
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <p className="text-blue-600 font-medium">Total Present</p>
          <p className="text-3xl font-bold text-blue-900">{stats.present}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
          <p className="text-red-600 font-medium">Total Absent</p>
          <p className="text-3xl font-bold text-red-900">{stats.absent}</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
          <p className="text-purple-600 font-medium">Working Days</p>
          <p className="text-3xl font-bold text-purple-900">{stats.workingDays}</p>
          <p className="text-xs text-purple-400 mt-1">(Present + Absent)</p>
        </div>
      </div>

      {/* MONTHLY HISTORY TABLE */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-semibold text-gray-700">Attendance History</h2>
          
          {/* Month Filter Selector */}
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border-gray-300 border rounded-md text-sm p-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {getMonthOptions().map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-100 text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Check In</th>
                <th className="px-6 py-3">Check Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    No records found for this month.
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{record.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        record.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {record.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{record.check_in_ist || '-'}</td>
                    <td className="px-6 py-4 font-mono text-xs">{record.check_out_ist || '-'}</td>
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