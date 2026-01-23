'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';

type Attendance = {
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
};

type Teacher = {
  id: string;
  full_name: string;
  designation: string;
  subject: string;
  phone: string;
  join_date: string;
  status: string;
};

export default function TeacherDetailsPage() {
  const params = useParams();
  const teacherId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTeacher(id: string) {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error('Failed to load teacher');
      setLoading(false);
      return;
    }

    setTeacher(data);
  }

  async function loadAttendance(id: string) {
    const { data, error } = await supabase
      .from('teacher_attendance')
      .select('*')
      .eq('teacher_id', id)
      .order('date', { ascending: false });

    if (error) {
      toast.error('Failed to load attendance');
      return;
    }

    setAttendance(data ?? []);
  }

  useEffect(() => {
    if (!teacherId) {
      toast.error('Invalid teacher ID');
      setLoading(false);
      return;
    }

    Promise.all([
      loadTeacher(teacherId),
      loadAttendance(teacherId),
    ]).finally(() => setLoading(false));
  }, [teacherId]);

  if (loading) {
    return <p className="text-zinc-400">Loading...</p>;
  }

  if (!teacher) {
    return <p className="text-red-400">Teacher not found</p>;
  }

  return (
    <div>
      <h1 className="text-2xl mb-2">{teacher.full_name}</h1>
      <p className="text-zinc-400 mb-4">
        {teacher.designation || '-'} • {teacher.subject || '-'}
      </p>

      {/* PROFILE */}
      <div className="bg-zinc-900 p-4 rounded-xl mb-6">
        <p><b>Phone:</b> {teacher.phone || '-'}</p>
        <p><b>Join Date:</b> {teacher.join_date}</p>
        <p><b>Status:</b> {teacher.status}</p>
      </div>

      {/* ATTENDANCE */}
      <h2 className="text-lg mb-2">Attendance</h2>

      {attendance.length === 0 && (
        <p className="text-zinc-400">No attendance records</p>
      )}

      {attendance.length > 0 && (
        <table className="w-full bg-zinc-900 rounded-xl text-sm">
          <thead className="bg-zinc-800">
            <tr>
              <th className="p-3">Date</th>
              <th>Status</th>
              <th>Check In</th>
              <th>Check Out</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((a) => (
              <tr key={a.date} className="border-t border-zinc-800">
                <td className="p-3">{a.date}</td>
                <td>{a.status.toUpperCase()}</td>
                <td>{a.check_in || '-'}</td>
                <td>{a.check_out || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
