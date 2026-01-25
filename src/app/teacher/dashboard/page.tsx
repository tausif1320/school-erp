'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

// Helper to get today's date in IST for querying
function getISTDateString() {
  return new Date().toLocaleDateString('en-CA', { 
    timeZone: 'Asia/Kolkata' 
  });
}

type AttendanceIST = {
  id: string;
  check_in_ist: string | null;  // Now comes as a formatted string!
  check_out_ist: string | null; // Now comes as a formatted string!
  raw_check_out: string | null; // Used for logic check
};

export default function TeacherDashboard() {
  const [attendance, setAttendance] = useState<AttendanceIST | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayAttendance();
  }, []);

  async function loadTodayAttendance() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!teacher) return;

    // 1. Get Today's Date in IST (YYYY-MM-DD)
    const todayIST = getISTDateString();

    // 2. Fetch from our NEW VIEW
    const { data } = await supabase
      .from('view_teacher_attendance_ist') // <--- CHANGED THIS
      .select('*')
      .eq('teacher_id', teacher.id)
      .eq('date', todayIST)
      .maybeSingle();

    setAttendance(data ?? null);
    setLoading(false);
  }

  async function handleCheckout() {
    if (!attendance) return;

    // We still update the REAL table with UTC (Database Standard)
    const { error } = await supabase
      .from('teacher_attendance')
      .update({
        check_out: new Date().toISOString(), 
      })
      .eq('id', attendance.id);

    if (error) {
      toast.error('Error checking out');
      return;
    }

    toast.success('Checked out successfully');
    loadTodayAttendance(); // Reloading will fetch the new IST string from the View
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>

      {!attendance ? (
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-200">
           You have not marked attendance today ({getISTDateString()}).
        </div>
      ) : (
        <div className="bg-white shadow rounded-xl border overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h2 className="font-semibold text-gray-700">Today's Activity</h2>
          </div>
          
          <div className="p-6 grid gap-6">
            
            {/* CHECK IN DISPLAY */}
            <div className="flex justify-between items-center border-b pb-4">
              <span className="text-gray-500">Check In Time</span>
              <span className="text-xl font-mono font-bold text-green-600">
                {attendance.check_in_ist || '-'}
              </span>
            </div>

            {/* CHECK OUT DISPLAY */}
            <div className="flex justify-between items-center border-b pb-4">
              <span className="text-gray-500">Check Out Time</span>
              <span className="text-xl font-mono font-bold text-red-600">
                {attendance.check_out_ist || 'Not yet'}
              </span>
            </div>

            {/* ACTION BUTTON */}
            {!attendance.raw_check_out ? (
              <button
                onClick={handleCheckout}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Tap to Check Out
              </button>
            ) : (
              <div className="text-center p-2 bg-green-100 text-green-800 rounded">
                Attendance Completed
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}