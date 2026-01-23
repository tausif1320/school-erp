'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type AttendanceRow = {
  date: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
};

export default function TeacherDashboard() {
  const [teacherId, setTeacherId] = useState<string | null>(null);

  const [today, setToday] = useState<AttendanceRow | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);

  const [month, setMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );

  const [summary, setSummary] = useState({
    present: 0,
    absent: 0,
    percentage: 0,
  });

  /* =========================
     LOAD TEACHER BY EMAIL
  ========================= */
  async function loadTeacher() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user?.email) return;

    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('mail', auth.user.email)
      .single();

    if (teacher) setTeacherId(teacher.id);
  }

  /* =========================
     LOAD TODAY ATTENDANCE
  ========================= */
  async function loadTodayAttendance(tid: string) {
    const todayDate = new Date().toISOString().slice(0, 10);

    const { data } = await supabase
      .from('teacher_attendance')
      .select('date, status, check_in, check_out')
      .eq('teacher_id', tid)
      .eq('date', todayDate)
      .maybeSingle();

    setToday(data ?? null);
  }

  /* =========================
     LOAD MONTHLY ATTENDANCE
  ========================= */
  async function loadAttendance(tid: string) {
    const start = `${month}-01`;
    const end = `${month}-31`;

    const { data } = await supabase
      .from('teacher_attendance')
      .select('date, status, check_in, check_out')
      .eq('teacher_id', tid)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false });

    setAttendance(data ?? []);

    const present = data?.filter(a => a.status === 'present').length ?? 0;
    const absent = data?.filter(a => a.status === 'absent').length ?? 0;
    const total = present + absent;

    setSummary({
      present,
      absent,
      percentage: total ? Math.round((present / total) * 100) : 0,
    });
  }

  /* =========================
     EFFECTS
  ========================= */
  useEffect(() => {
    loadTeacher();
  }, []);

  useEffect(() => {
    if (!teacherId) return;
    loadTodayAttendance(teacherId);
    loadAttendance(teacherId);
  }, [teacherId, month]);

  /* =========================
     UI
  ========================= */
  return (
    <div>
      <h1 className="text-2xl mb-6">Teacher Dashboard</h1>

      {/* TODAY SESSION */}
      <div className="bg-zinc-900 p-4 rounded-xl mb-6">
        <h2 className="text-lg mb-2">Today’s Session</h2>

        {today ? (
          <div className="text-sm space-y-1">
            <p>Status: {today.status.toUpperCase()}</p>
            <p>Check-in: {today.check_in ?? '—'}</p>
            <p>Check-out: {today.check_out ?? '—'}</p>
          </div>
        ) : (
          <p className="text-zinc-400 text-sm">
            No attendance marked today
          </p>
        )}
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Present" value={summary.present} />
        <StatCard label="Absent" value={summary.absent} />
        <StatCard label="Attendance %" value={`${summary.percentage}%`} />
      </div>

      {/* FILTER */}
      <div className="mb-4">
        <input
          type="month"
          className="p-2 bg-zinc-800 rounded"
          value={month}
          onChange={e => setMonth(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <table className="w-full bg-zinc-900 text-sm rounded-xl">
        <thead className="bg-zinc-800">
          <tr>
            <th className="p-3">Date</th>
            <th>Status</th>
            <th>Check-in</th>
            <th>Check-out</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map((a, i) => (
            <tr key={i} className="border-t border-zinc-800">
              <td className="p-3">{a.date}</td>
              <td>{a.status}</td>
              <td>{a.check_in ?? '—'}</td>
              <td>{a.check_out ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =========================
   SMALL CARD
========================= */
function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-zinc-900 p-4 rounded-xl">
      <p className="text-zinc-400 text-sm">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
