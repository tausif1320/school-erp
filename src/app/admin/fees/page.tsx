'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type FeeRow = {
  id: string;
  student_id: string;
  admission_number: string;
  full_name: string;
  class: string;
  total_amount: number;
  paid_amount: number;
  status: 'paid' | 'partial' | 'unpaid';
};

export default function FeesPage() {
  const [month, setMonth] = useState('');
  const [academicYear, setAcademicYear] = useState('');

  const [fees, setFees] = useState<FeeRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const [editingFee, setEditingFee] = useState<FeeRow | null>(null);
  const [paidInput, setPaidInput] = useState('');

  /* =========================
     LOAD FEES
  ========================= */
  async function loadFees() {
    if (!month || !academicYear) return;

    setLoading(true);

    let query = supabase
      .from('fee_records')
      .select(`
        id,
        student_id,
        total_amount,
        paid_amount,
        status,
        students (
          admission_number,
          full_name,
          class
        )
      `)
      .eq('fee_month', month)
      .eq('academic_year', academicYear);

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (!error && data) {
      let rows: FeeRow[] = data.map((f: any) => ({
        id: f.id,
        student_id: f.student_id,
        admission_number: f.students.admission_number,
        full_name: f.students.full_name,
        class: f.students.class,
        total_amount: f.total_amount,
        paid_amount: f.paid_amount,
        status: f.status,
      }));

      if (classFilter) {
        rows = rows.filter(r => r.class === classFilter);
      }

      setFees(rows);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadFees();
  }, [month, academicYear, statusFilter, classFilter]);

  /* =========================
     GENERATE FEES
  ========================= */
  async function generateFees() {
    if (!month || !academicYear) {
      alert('Select month and academic year');
      return;
    }

    setLoading(true);

    const { data: students } = await supabase
      .from('students')
      .select('id, class')
      .eq('status', 'active')
      .eq('academic_year', academicYear);

    if (!students) {
      setLoading(false);
      return;
    }

    let generated = 0;

    for (const s of students) {
      const { data: exists } = await supabase
        .from('fee_records')
        .select('id')
        .eq('student_id', s.id)
        .eq('fee_month', month)
        .eq('academic_year', academicYear)
        .maybeSingle();

      if (exists) continue;

      const { data: classFee } = await supabase
        .from('class_fees')
        .select('monthly_amount')
        .eq('class', s.class)
        .eq('academic_year', academicYear)
        .single();

      if (!classFee) continue;

      await supabase.from('fee_records').insert({
        student_id: s.id,
        fee_month: month,
        academic_year: academicYear,
        total_amount: classFee.monthly_amount,
        paid_amount: 0,
      });

      generated++;
    }

    alert(`${generated} fee records generated`);
    setLoading(false);
    loadFees();
  }

  /* =========================
     UPDATE PAYMENT
  ========================= */
  async function updatePaidAmount() {
    if (!editingFee) return;

    const amount = Number(paidInput);

    if (amount < 0 || amount > editingFee.total_amount) {
      alert('Invalid paid amount');
      return;
    }

    await supabase
      .from('fee_records')
      .update({ paid_amount: amount })
      .eq('id', editingFee.id);

    setEditingFee(null);
    setPaidInput('');
    loadFees();
  }

  /* =========================
     UI
  ========================= */
  return (
    <div>
      <h1 className="text-2xl mb-4">Manage Fees</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="month"
          className="p-2 bg-zinc-800 rounded"
          value={month}
          onChange={e => setMonth(e.target.value)}
        />

        <input
          placeholder="Academic Year (2026-2027)"
          className="p-2 bg-zinc-800 rounded"
          value={academicYear}
          onChange={e => setAcademicYear(e.target.value)}
        />

        <select
          className="p-2 bg-zinc-800 rounded"
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>

        <input
          placeholder="Class filter"
          className="p-2 bg-zinc-800 rounded"
          onChange={e => setClassFilter(e.target.value)}
        />

        <button
          onClick={generateFees}
          className="px-4 bg-green-600 rounded"
        >
          Generate Fees
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && (
        <table className="w-full text-sm bg-zinc-900 rounded-xl">
          <thead className="bg-zinc-800">
            <tr>
              <th className="p-3">Admission No</th>
              <th>Name</th>
              <th>Class</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {fees.map(f => (
              <tr key={f.id} className="border-t border-zinc-800">
                <td className="p-3">{f.admission_number}</td>
                <td>{f.full_name}</td>
                <td>{f.class}</td>
                <td>₹{f.total_amount}</td>
                <td>₹{f.paid_amount}</td>
                <td>{f.status}</td>
                <td>
                  <button
                    className="text-blue-400"
                    onClick={() => {
                      setEditingFee(f);
                      setPaidInput(String(f.paid_amount));
                    }}
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editingFee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-zinc-900 p-6 rounded-xl w-96 space-y-4">
            <h2 className="text-lg">Update Payment</h2>
            <p>{editingFee.full_name}</p>
            <p>Total: ₹{editingFee.total_amount}</p>

            <input
              type="number"
              className="w-full p-2 bg-zinc-800 rounded"
              value={paidInput}
              onChange={e => setPaidInput(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-zinc-700 rounded"
                onClick={() => setEditingFee(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 rounded"
                onClick={updatePaidAmount}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
