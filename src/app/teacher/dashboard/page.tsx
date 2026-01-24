'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

type Attendance = {
  id: string;
  check_in: string | null;
  check_out: string | null;
};

/* =========================
   IST HELPERS
========================= */
function getISTDate() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  return ist.toISOString().slice(0, 10);
}

function formatIST(timestamp: string | null) {
  if (!timestamp) return '-';

  return new Date(timestamp).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export default function TeacherDashboard() {
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayAttendance();
  }, []);

  async function loadTodayAttendance() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!teacher) {
      setLoading(false);
      return;
    }

    // 🔥 IST DATE (NOT UTC)
    const todayIST = getISTDate();

    const { data } = await supabase
      .from('teacher_attendance')
      .select('id, check_in, check_out')
      .eq('teacher_id', teacher.id)
      .eq('date', todayIST)
      .maybeSingle();

    setAttendance(data ?? null);
    setLoading(false);
  }

  async function handleCheckout() {
    if (!attendance) return;

    await supabase
      .from('teacher_attendance')
      .update({
        check_out: new Date().toISOString(), // UTC (correct)
      })
      .eq('id', attendance.id);

    toast.success('Checked out successfully');
    loadTodayAttendance();
  }

  if (loading) {
    return <p className="text-zinc-400">Loading dashboard…</p>;
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl mb-4">Teacher Dashboard</h1>

      {!attendance && (
        <p className="text-zinc-400">
          You have not checked in today. Please scan the QR.
        </p>
      )}

      {attendance && (
        <div className="bg-zinc-900 p-4 rounded-xl space-y-3">
          <p>
            <strong>Check-in (IST):</strong>{' '}
            {formatIST(attendance.check_in)}
          </p>

          <p>
            <strong>Check-out (IST):</strong>{' '}
            {formatIST(attendance.check_out)}
          </p>

          {!attendance.check_out && (
            <button
              onClick={handleCheckout}
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
