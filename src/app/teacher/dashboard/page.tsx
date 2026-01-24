'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

type Attendance = {
  id: string;
  check_in: string | null;
  check_out: string | null;
};

export default function TeacherDashboard() {
  const [attendance, setAttendance] = useState<Attendance | null>(null);

  useEffect(() => {
    loadTodayAttendance();
  }, []);

  async function loadTodayAttendance() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!teacher) return;

    const today = new Date().toISOString().slice(0, 10);

    const { data } = await supabase
      .from('teacher_attendance')
      .select('*')
      .eq('teacher_id', teacher.id)
      .eq('date', today)
      .maybeSingle();

    setAttendance(data ?? null);
  }

  async function checkout() {
    if (!attendance) return;

    await supabase
      .from('teacher_attendance')
      .update({
        check_out: new Date().toISOString(),
      })
      .eq('id', attendance.id);

    toast.success('Checked out successfully');
    loadTodayAttendance();
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl mb-4">Teacher Dashboard</h1>

      {!attendance && (
        <p className="text-zinc-400">
          Not checked in yet. Scan QR to check in.
        </p>
      )}

      {attendance && (
        <div className="bg-zinc-900 p-4 rounded-xl space-y-3">
          <p>
            <strong>Check-in:</strong>{' '}
            {attendance.check_in
              ? new Date(attendance.check_in).toLocaleTimeString()
              : '-'}
          </p>

          <p>
            <strong>Check-out:</strong>{' '}
            {attendance.check_out
              ? new Date(attendance.check_out).toLocaleTimeString()
              : '-'}
          </p>

          {!attendance.check_out && (
            <button
              onClick={checkout}
              className="bg-red-600 px-4 py-2 rounded"
            >
              Check Out
            </button>
          )}

          {attendance.check_out && (
            <p className="text-green-500">
              Attendance completed for today
            </p>
          )}
        </div>
      )}
    </div>
  );
}
