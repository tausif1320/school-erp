'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/* =========================
   TYPES
========================= */
type Student = {
  id: string;
  admission_number: string;
  full_name: string;
  class: string;
  section: string | null;
  academic_year: string;
  status: 'active' | 'inactive';
};

/* =========================
   COMPONENT
========================= */
export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // add student modal
  const [showAddForm, setShowAddForm] = useState(false);

  // edit student modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // add form state
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [section, setSection] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');

  /* =========================
     LOAD STUDENTS
  ========================= */
  async function loadStudents() {
    setLoading(true);

    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        admission_number,
        full_name,
        class,
        section,
        academic_year,
        status
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load students:', error);
    } else {
      setStudents(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadStudents();
  }, []);

  /* =========================
     ADD STUDENT
  ========================= */
  async function handleAddStudent() {
    if (
      !admissionNumber ||
      !fullName ||
      !studentClass ||
      !academicYear ||
      !admissionDate
    ) {
      alert('Please fill all required fields');
      return;
    }

    const { error } = await supabase.from('students').insert({
      admission_number: admissionNumber,
      full_name: fullName,
      class: studentClass,
      section: section || null,
      academic_year: academicYear,
      admission_date: admissionDate,
    });

    if (error) {
      alert(error.message);
      return;
    }

    // reset form
    setAdmissionNumber('');
    setFullName('');
    setStudentClass('');
    setSection('');
    setAcademicYear('');
    setAdmissionDate('');
    setShowAddForm(false);

    loadStudents();
  }

  /* =========================
     UPDATE STUDENT
  ========================= */
  async function handleUpdateStudent() {
    if (!editingStudent) return;

    const { error } = await supabase
      .from('students')
      .update({
        full_name: editingStudent.full_name,
        class: editingStudent.class,
        section: editingStudent.section,
        academic_year: editingStudent.academic_year,
      })
      .eq('id', editingStudent.id);

    if (error) {
      alert(error.message);
      return;
    }

    setEditingStudent(null);
    loadStudents();
  }

  /* =========================
     TOGGLE STATUS
  ========================= */
  async function toggleStudentStatus(student: Student) {
    const newStatus = student.status === 'active' ? 'inactive' : 'active';

    const { error } = await supabase
      .from('students')
      .update({ status: newStatus })
      .eq('id', student.id);

    if (error) {
      alert(error.message);
      return;
    }

    loadStudents();
  }

  /* =========================
     RENDER
  ========================= */
  if (loading) {
    return <p className="text-zinc-400">Loading students…</p>;
  }

  return (
    <div>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl">Students</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
        >
          + Add Student
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-zinc-900 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800 text-zinc-300">
            <tr>
              <th className="px-4 py-3 text-left">Admission No</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Class</th>
              <th className="px-4 py-3 text-left">Section</th>
              <th className="px-4 py-3 text-left">Academic Year</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-zinc-800">
                <td className="px-4 py-3">{s.admission_number}</td>

                <td className="px-4 py-3">
                  <a
                    href={`/admin/students/${s.id}`}
                    className="text-blue-400 hover:underline"
                  >
                    {s.full_name}
                  </a>
                </td>

                <td className="px-4 py-3">{s.class}</td>
                <td className="px-4 py-3">{s.section ?? '-'}</td>
                <td className="px-4 py-3">{s.academic_year}</td>

                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      s.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {s.status}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingStudent(s)}
                      className="text-blue-400 text-xs hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleStudentStatus(s)}
                      className="text-yellow-400 text-xs hover:underline"
                    >
                      {s.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {students.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-zinc-400"
                >
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD STUDENT MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-zinc-900 p-6 rounded-xl w-96 space-y-4">
            <h2 className="text-lg">Add Student</h2>

            <input
              placeholder="Admission Number *"
              className="w-full p-2 bg-zinc-800 rounded"
              value={admissionNumber}
              onChange={(e) => setAdmissionNumber(e.target.value)}
            />

            <input
              placeholder="Full Name *"
              className="w-full p-2 bg-zinc-800 rounded"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <input
              placeholder="Class *"
              className="w-full p-2 bg-zinc-800 rounded"
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
            />

            <input
              placeholder="Section"
              className="w-full p-2 bg-zinc-800 rounded"
              value={section}
              onChange={(e) => setSection(e.target.value)}
            />

            <input
              placeholder="Academic Year *"
              className="w-full p-2 bg-zinc-800 rounded"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            />

            <input
              type="date"
              className="w-full p-2 bg-zinc-800 rounded"
              value={admissionDate}
              onChange={(e) => setAdmissionDate(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-zinc-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudent}
                className="px-4 py-2 bg-blue-600 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-zinc-900 p-6 rounded-xl w-96 space-y-4">
            <h2 className="text-lg">Edit Student</h2>

            <input
              className="w-full p-2 bg-zinc-800 rounded"
              value={editingStudent.full_name}
              onChange={(e) =>
                setEditingStudent({
                  ...editingStudent,
                  full_name: e.target.value,
                })
              }
            />

            <input
              className="w-full p-2 bg-zinc-800 rounded"
              value={editingStudent.class}
              onChange={(e) =>
                setEditingStudent({
                  ...editingStudent,
                  class: e.target.value,
                })
              }
            />

            <input
              className="w-full p-2 bg-zinc-800 rounded"
              value={editingStudent.section ?? ''}
              onChange={(e) =>
                setEditingStudent({
                  ...editingStudent,
                  section: e.target.value,
                })
              }
            />

            <input
              className="w-full p-2 bg-zinc-800 rounded"
              value={editingStudent.academic_year}
              onChange={(e) =>
                setEditingStudent({
                  ...editingStudent,
                  academic_year: e.target.value,
                })
              }
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 bg-zinc-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStudent}
                className="px-4 py-2 bg-blue-600 rounded"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
