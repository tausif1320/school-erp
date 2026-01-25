'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { getISTDateString, formatToIST } from '@/lib/time';

type Attendance = {
  id: string;
  check_in: string | null;
  check_out: string | null;
};

export default function TeacherDashboard() {
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayAttendance();
  }, []);

  async function loadTodayAttendance() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setLoading(false);

    // Get Teacher Profile
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!teacher) {
      toast.error('Teacher profile not found');
      return setLoading(false);
    }

    // 🔥 VITAL: Get the exact "YYYY-MM-DD" for India to query the date column
    const todayIST = getISTDateString(); 

    const { data } = await supabase
      .from('teacher_attendance')
      .select('id, check_in, check_out')
      .eq('teacher_id', teacher.id)
      .eq('date', todayIST) // Matches the 'date' column in your DB
      .maybeSingle();

    setAttendance(data ?? null);
    setLoading(false);
  }

  async function handleCheckout() {
    if (!attendance) return;

    // We send UTC ISO string. Supabase stores it as absolute time.
    // When we fetch it back, 'formatToIST' converts it to +5:30.
    const nowUTC = new Date().toISOString();

    const { error } = await supabase
      .from('teacher_attendance')
      .update({
        check_out: nowUTC, 
        status: 'present' // Optional: ensure status is set
      })
      .eq('id', attendance.id);

    if (error) {
      toast.error('Error checking out');
      return;
    }

    toast.success('Checked out successfully');
    loadTodayAttendance();
  }

  if (loading) return <div className="p-4 text-center">Loading dashboard...</div>;

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h1>

      {!attendance ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">
            ⚠ You have not checked in today (IST: {getISTDateString()}). 
            <br />
            Please scan the QR code at the school entrance.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-xl overflow-hidden border">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h2 className="text-lg font-medium text-gray-700">Today's Attendance</h2>
            <p className="text-sm text-gray-500">{getISTDateString()}</p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold">Check In</p>
                <p className="text-xl font-mono text-green-700">
                  {formatToIST(attendance.check_in)}
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase font-semibold">Check Out</p>
                <p className="text-xl font-mono text-red-700">
                  {formatToIST(attendance.check_out)}
                </p>
              </div>
            </div>

            {!attendance.check_out ? (
              <button
                onClick={handleCheckout}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition shadow-sm"
              >
                Tap to Check Out
              </button>
            ) : (
              <div className="bg-green-100 text-green-800 p-3 rounded text-center font-medium">
                ✅ Attendance Completed
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}