'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type Teacher = {
  id: string;
  full_name: string;
  subject: string;
  phone: string;
  join_date: string;
  status: string;
};

export default function TeacherListPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  async function loadTeachers() {
    const { data } = await supabase
      .from('teachers')
      .select('id, full_name, subject, phone, join_date, status')
      .order('full_name');

    setTeachers(data ?? []);
  }

  async function toggleStatus(id: string, status: string) {
    await supabase
      .from('teachers')
      .update({ status: status === 'active' ? 'inactive' : 'active' })
      .eq('id', id);

    loadTeachers();
  }

  async function deleteTeacher(id: string) {
    if (!confirm('Delete teacher?')) return;
    await supabase.from('teachers').delete().eq('id', id);
    loadTeachers();
  }

  useEffect(() => {
    loadTeachers();
  }, []);

  return (
    <div>
      <h1 className="text-2xl mb-4">Teachers</h1>

      <table className="w-full bg-zinc-900 rounded-xl text-sm">
        <thead className="bg-zinc-800">
          <tr>
            <th className="p-3">#</th>
            <th>Name</th>
            <th>Subject</th>
            <th>Phone</th>
            <th>Join Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((t, i) => (
            <tr key={t.id} className="border-t border-zinc-800">
              <td className="p-3">{i + 1}</td>
              <td>{t.full_name}</td>
              <td>{t.subject}</td>
              <td>{t.phone}</td>
              <td>{t.join_date}</td>
              <td>{t.status}</td>
              <td className="space-x-2">
                <Link href={`/admin/teachers/${t.id}`} className="text-blue-400">
                  View
                </Link>
                <button
                  onClick={() => toggleStatus(t.id, t.status)}
                  className="text-yellow-400"
                >
                  {t.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => deleteTeacher(t.id)}
                  className="text-red-400"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
