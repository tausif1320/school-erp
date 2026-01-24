'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

type Attendance = {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
};

export default function TeacherDashboard() {
  const [today, setToday] = useState<Attendance | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', auth.user.id)
      .single();

    if (!teacher) {
      toast.error('Teacher profile not found');
      return;
    }

    const todayDate = new Date().toISOString().slice(0, 10);

    const { data: todayRow } = await supabase
      .from('teacher_attendance')
      .select('*')
      .eq('teacher_id', teacher.id)
      .eq('date', todayDate)
      .maybeSingle();

    setToday(todayRow ?? null);

    const { data: rows } = await supabase
      .from('teacher_attendance')
      .select('*')
      .eq('teacher_id', teacher.id)
      .order('date', { ascending: false });

    setHistory(rows ?? []);
  }

  async function checkout() {
    if (!today) return;

    const { error } = await supabase
      .from('teacher_attendance')
      .update({ check_out: new Date().toISOString() })
      .eq('id', today.id);

    if (error) {
      toast.error('Failed to check out');
      return;
    }

    toast.success('Checked out');
    loadData();
  }

  return (
    <div>
      <h1 className="text-2xl mb-4">Teacher Dashboard</h1>

      <div className="bg-zinc-900 p-4 rounded-xl mb-6">
        <p className="mb-1">Today</p>
        <p>Check-in: {today?.check_in ?? '-'}</p>
        <p>Check-out: {today?.check_out ?? '-'}</p>

        {today?.check_in && !today?.check_out && (
          <button
            onClick={checkout}
            className="mt-3 bg-red-600 px-4 py-2 rounded"
          >
            Check Out
          </button>
        )}
      </div>

      <table className="w-full bg-zinc-900 rounded-xl text-sm">
        <thead className="bg-zinc-800">
          <tr>
            <th className="p-2">Date</th>
            <th>Check In</th>
            <th>Check Out</th>
          </tr>
        </thead>
        <tbody>
          {history.map((r) => (
            <tr key={r.id}>
              <td className="p-2">{r.date}</td>
              <td>{r.check_in ?? '-'}</td>
              <td>{r.check_out ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
