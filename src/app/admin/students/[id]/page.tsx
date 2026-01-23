'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

/* =========================
   TYPES
========================= */
type Student = {
  id: string;
  admission_number: string;
  roll_number: string | null;
  full_name: string;
  gender: string | null;
  dob: string | null;
  class: string;
  section: string | null;
  academic_year: string;
  admission_date: string;
  status: string;
  current_address: string | null;
  permanent_address: string | null;
};

type Guardian = {
  id: string;
  type: 'father' | 'mother' | 'other';
  name: string;
  email: string | null;
  phone: string | null;
  occupation: string | null;
};

/* =========================
   COMPONENT
========================= */
export default function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [studentFees, setStudentFees] = useState<any[]>([]);


  const [student, setStudent] = useState<Student | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);

  const [editMode, setEditMode] = useState(false);

  // guardian modal
  const [showGuardianModal, setShowGuardianModal] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
  const [guardianForm, setGuardianForm] = useState<Omit<Guardian, 'id'>>({
    type: 'father',
    name: '',
    email: '',
    phone: '',
    occupation: '',
  });

  /* =========================
     LOAD DATA
  ========================= */
  useEffect(() => {
    loadStudent();
    loadGuardians();
    loadStudentFees();
  }, [id]);

  async function loadStudent() {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        admission_number,
        roll_number,
        full_name,
        gender,
        dob,
        class,
        section,
        academic_year,
        admission_date,
        status,
        current_address,
        permanent_address
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error(error);
      router.push('/admin/students');
      return;
    }

    setStudent(data);
    setLoading(false);
  }


  async function loadStudentFees() {
  const { data } = await supabase
    .from('fee_records')
    .select('fee_month, total_amount, paid_amount, status')
    .eq('student_id', id)
    .order('fee_month', { ascending: false });

  setStudentFees(data ?? []);
}


  async function loadGuardians() {
    const { data } = await supabase
      .from('guardians')
      .select('id, type, name, email, phone, occupation')
      .eq('student_id', id);

    setGuardians(data ?? []);
  }

  /* =========================
     UPDATE STUDENT
  ========================= */
  async function handleUpdateStudent() {
    if (!student) return;

    const { error } = await supabase
      .from('students')
      .update({
        roll_number: student.roll_number,
        full_name: student.full_name,
        gender: student.gender,
        dob: student.dob,
        class: student.class,
        section: student.section,
        academic_year: student.academic_year,
        current_address: student.current_address,
        permanent_address: student.permanent_address,
      })
      .eq('id', student.id);

    if (error) {
      alert(error.message);
      return;
    }

    setEditMode(false);
    loadStudent();
  }

  /* =========================
     SAVE GUARDIAN
  ========================= */
  async function saveGuardian() {
    if (!guardianForm.name) {
      alert('Guardian name is required');
      return;
    }

    const payload = {
      student_id: id,
      ...guardianForm,
    };

    const query = editingGuardian
      ? supabase.from('guardians').update(payload).eq('id', editingGuardian.id)
      : supabase.from('guardians').insert(payload);

    const { error } = await query;

    if (error) {
      alert(error.message);
      return;
    }

    setShowGuardianModal(false);
    setEditingGuardian(null);
    setGuardianForm({
      type: 'father',
      name: '',
      email: '',
      phone: '',
      occupation: '',
    });

    loadGuardians();
  }

  if (loading) return <p className="text-zinc-400">Loading…</p>;
  if (!student) return null;

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="text-sm text-zinc-400 mb-4 hover:underline"
      >
        ← Back
      </button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl">Student Details</h1>
        <button
          onClick={() => setEditMode(!editMode)}
          className="px-4 py-2 bg-blue-600 rounded"
        >
          {editMode ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {/* BASIC INFO */}
      <Section title="Basic Information">
        <Grid>
          <Field label="Admission No" value={student.admission_number} />
          <Input label="Roll Number" value={student.roll_number} edit={editMode} onChange={(v)=>setStudent({...student, roll_number:v})} />
          <Input label="Full Name" value={student.full_name} edit={editMode} onChange={(v)=>setStudent({...student, full_name:v})} />
          <Input label="Gender" value={student.gender} edit={editMode} onChange={(v)=>setStudent({...student, gender:v})} />
          <Input label="Date of Birth" type="date" value={student.dob} edit={editMode} onChange={(v)=>setStudent({...student, dob:v})} />
          <Input label="Class" value={student.class} edit={editMode} onChange={(v)=>setStudent({...student, class:v})} />
          <Input label="Section" value={student.section} edit={editMode} onChange={(v)=>setStudent({...student, section:v})} />
          <Input label="Academic Year" value={student.academic_year} edit={editMode} onChange={(v)=>setStudent({...student, academic_year:v})} />
          <Field label="Admission Date" value={student.admission_date} />
          <Field label="Status" value={student.status} />
        </Grid>
      </Section>

      {/* ADDRESS */}
      <Section title="Address">
        <Textarea label="Current Address" value={student.current_address} edit={editMode} onChange={(v)=>setStudent({...student, current_address:v})} />
        <Textarea label="Permanent Address" value={student.permanent_address} edit={editMode} onChange={(v)=>setStudent({...student, permanent_address:v})} />
      </Section>

      {editMode && (
        <div className="flex justify-end mb-6">
          <button
            onClick={handleUpdateStudent}
            className="px-6 py-2 bg-green-600 rounded"
          >
            Save Changes
          </button>
        </div>
      )}

      {/* GUARDIANS */}
      <Section title="Parents & Guardians">
        <div className="flex justify-end mb-3">
          <button
            onClick={() => {
              setEditingGuardian(null);
              setShowGuardianModal(true);
            }}
            className="px-3 py-1 bg-blue-600 rounded text-sm"
          >
            + Add Guardian
          </button>
        </div>

        {guardians.map((g) => (
          <div key={g.id} className="border border-zinc-800 rounded p-4 mb-3 flex justify-between">
            <div>
              <p className="text-xs text-zinc-400 uppercase">{g.type}</p>
              <p className="font-medium">{g.name}</p>
              <p className="text-sm text-zinc-400">
                {g.phone ?? '-'} | {g.email ?? '-'}
              </p>
            </div>
            <button
              onClick={() => {
                setEditingGuardian(g);
                setGuardianForm({
                  type: g.type,
                  name: g.name,
                  email: g.email,
                  phone: g.phone,
                  occupation: g.occupation,
                });
                setShowGuardianModal(true);
              }}
              className="text-blue-400 text-sm"
            >
              Edit
            </button>
          </div>
        ))}


      
      <Section title="Fees">
  {studentFees.length === 0 && (
    <p className="text-zinc-400 text-sm">No fee records</p>
  )}

  {studentFees.length > 0 && (
    <table className="w-full text-sm">
      <thead className="text-zinc-400">
        <tr>
          <th>Month</th>
          <th>Total</th>
          <th>Paid</th>
          <th>Due</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {studentFees.map((f) => (
          <tr key={f.fee_month} className="border-t border-zinc-800">
            <td>{f.fee_month}</td>
            <td>₹{f.total_amount}</td>
            <td>₹{f.paid_amount}</td>
            <td>₹{f.total_amount - f.paid_amount}</td>
            <td>{f.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</Section>

      </Section>

      {/* GUARDIAN MODAL */}
      {showGuardianModal && (
        <Modal>
          <h2 className="text-lg mb-2">
            {editingGuardian ? 'Edit Guardian' : 'Add Guardian'}
          </h2>

          <select className="input" value={guardianForm.type}
            onChange={(e)=>setGuardianForm({...guardianForm,type:e.target.value as any})}>
            <option value="father">Father</option>
            <option value="mother">Mother</option>
            <option value="other">Other</option>
          </select>

          <input className="input" placeholder="Name *"
            value={guardianForm.name}
            onChange={(e)=>setGuardianForm({...guardianForm,name:e.target.value})}
          />

          <input className="input" placeholder="Phone"
            value={guardianForm.phone ?? ''}
            onChange={(e)=>setGuardianForm({...guardianForm,phone:e.target.value})}
          />

          <input className="input" placeholder="Email"
            value={guardianForm.email ?? ''}
            onChange={(e)=>setGuardianForm({...guardianForm,email:e.target.value})}
          />

          <input className="input" placeholder="Occupation"
            value={guardianForm.occupation ?? ''}
            onChange={(e)=>setGuardianForm({...guardianForm,occupation:e.target.value})}
          />

          <div className="flex justify-end gap-2">
            <button onClick={()=>setShowGuardianModal(false)} className="btn-gray">Cancel</button>
            <button onClick={saveGuardian} className="btn-green">Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* =========================
   UI HELPERS (TYPED)
========================= */

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-zinc-900 rounded-xl p-6 mb-6">
      <h2 className="text-lg mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 text-sm">{children}</div>;
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div>
      <p className="text-zinc-400">{label}</p>
      <p>{value ?? '-'}</p>
    </div>
  );
}

function Input({
  label,
  value,
  edit,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string | null;
  edit: boolean;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <p className="text-zinc-400">{label}</p>
      {edit ? (
        <input
          type={type}
          className="w-full p-2 bg-zinc-800 rounded"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <p>{value ?? '-'}</p>
      )}
    </div>
  );
}

function Textarea({
  label,
  value,
  edit,
  onChange,
}: {
  label: string;
  value: string | null;
  edit: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3">
      <p className="text-zinc-400">{label}</p>
      {edit ? (
        <textarea
          className="w-full p-2 bg-zinc-800 rounded"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <p>{value ?? '-'}</p>
      )}
    </div>
  );
}

function Modal({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-zinc-900 p-6 rounded-xl w-96 space-y-3">
        {children}
      </div>
    </div>
  );
}
