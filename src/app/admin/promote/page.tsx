'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

type Student = {
  id: string;
  admission_number: string;
  full_name: string;
  class: string;
  section: string | null;
};

export default function PromoteStudentsPage() {
  /* =========================
     PROMOTION CONFIG
  ========================= */
  const [fromYear, setFromYear] = useState('');
  const [toYear, setToYear] = useState('');
  const [fromClass, setFromClass] = useState('');
  const [toClass, setToClass] = useState('');
  const [promotionDate, setPromotionDate] = useState('');

  /* =========================
     STUDENTS
  ========================= */
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  /* =========================
     LOAD STUDENTS
  ========================= */
  async function loadStudents() {
    if (!fromYear || !fromClass) {
      setStudents([]);
      return;
    }

    const { data, error } = await supabase
      .from('students')
      .select('id, admission_number, full_name, class, section')
      .eq('academic_year', fromYear)
      .eq('class', fromClass)
      .eq('status', 'active')
      .order('full_name');

    if (error) {
      toast.error('Failed to load students');
      return;
    }

    setStudents(data ?? []);
    setSelected([]);
  }

  useEffect(() => {
    loadStudents();
  }, [fromYear, fromClass]);

  /* =========================
     SELECTION
  ========================= */
  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  /* =========================
     PROMOTE
  ========================= */
  async function promoteStudents(holdSameClass = false) {
    if (
      !fromYear ||
      !toYear ||
      !fromClass ||
      !promotionDate ||
      selected.length === 0
    ) {
      toast.error('Missing required data');
      return;
    }

    const updates = selected.map((studentId) => ({
      student_id: studentId,
      from_class: fromClass,
      to_class: holdSameClass ? fromClass : toClass,
      from_year: fromYear,
      to_year: toYear,
      promoted_at: promotionDate,
    }));

    // 1️⃣ Insert promotion history
    const { error: historyError } = await supabase
      .from('promotion_history')
      .insert(updates);

    if (historyError) {
      toast.error('Failed to save promotion history');
      return;
    }

    // 2️⃣ Update students
    const { error: updateError } = await supabase
      .from('students')
      .update({
        class: holdSameClass ? fromClass : toClass,
        academic_year: toYear,
      })
      .in('id', selected);

    if (updateError) {
      toast.error('Failed to update students');
      return;
    }

    toast.success(
      holdSameClass
        ? 'Students held successfully'
        : 'Students promoted successfully'
    );

    setSelected([]);
    loadStudents();
  }

  /* =========================
     UI
  ========================= */
  return (
    <div>
      <h1 className="text-2xl mb-4">Promote Students</h1>

      {/* PROMOTION PANEL */}
      <div className="bg-zinc-900 p-4 rounded-xl mb-6 grid grid-cols-5 gap-3">
        <input
          placeholder="Current Year"
          className="p-2 bg-zinc-800 rounded"
          value={fromYear}
          onChange={(e) => setFromYear(e.target.value)}
        />
        <input
          placeholder="New Year"
          className="p-2 bg-zinc-800 rounded"
          value={toYear}
          onChange={(e) => setToYear(e.target.value)}
        />
        <input
          placeholder="From Class"
          className="p-2 bg-zinc-800 rounded"
          value={fromClass}
          onChange={(e) => setFromClass(e.target.value)}
        />
        <input
          placeholder="To Class"
          className="p-2 bg-zinc-800 rounded"
          value={toClass}
          onChange={(e) => setToClass(e.target.value)}
        />
        <input
          type="date"
          className="p-2 bg-zinc-800 rounded"
          value={promotionDate}
          onChange={(e) => setPromotionDate(e.target.value)}
        />
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => promoteStudents(false)}
          className="bg-green-600 px-4 py-2 rounded"
        >
          Promote Selected
        </button>
        <button
          onClick={() => promoteStudents(true)}
          className="bg-yellow-600 px-4 py-2 rounded"
        >
          Hold Selected
        </button>
      </div>

      {/* STUDENT LIST */}
      <table className="w-full bg-zinc-900 rounded-xl text-sm">
        <thead className="bg-zinc-800">
          <tr>
            <th className="p-3"></th>
            <th>Admission No</th>
            <th>Name</th>
            <th>Class</th>
            <th>Section</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id} className="border-t border-zinc-800">
              <td className="p-3">
                <input
                  type="checkbox"
                  checked={selected.includes(s.id)}
                  onChange={() => toggleSelect(s.id)}
                />
              </td>
              <td>{s.admission_number}</td>
              <td>{s.full_name}</td>
              <td>{s.class}</td>
              <td>{s.section ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {students.length === 0 && (
        <p className="text-zinc-400 mt-4">
          No students found for selected year & class
        </p>
      )}
    </div>
  );
}
