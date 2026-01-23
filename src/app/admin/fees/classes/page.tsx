'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

type ClassFee = {
  id: string;
  class: string;
  academic_year: string;
  monthly_amount: number;
};

export default function ClassFeesPage() {
  const [academicYear, setAcademicYear] = useState('');
  const [fees, setFees] = useState<ClassFee[]>([]);
  const [newClass, setNewClass] = useState('');
  const [newAmount, setNewAmount] = useState('');

  /* =========================
     LOAD FEES
  ========================= */
  async function loadFees() {
    if (!academicYear) return;

    const { data, error } = await supabase
      .from('class_fees')
      .select('*')
      .eq('academic_year', academicYear)
      .order('class');

    if (error) {
      toast.error('Failed to load class fees');
      return;
    }

    setFees(data ?? []);
  }

  useEffect(() => {
    loadFees();
  }, [academicYear]);

  /* =========================
     SAVE EXISTING FEE
  ========================= */
  async function saveFee(id: string, amount: number) {
    if (!academicYear) {
      toast.error('Academic year required');
      return;
    }

    if (amount <= 0) {
      toast.error('Fee must be positive');
      return;
    }

    const { error } = await supabase
      .from('class_fees')
      .update({ monthly_amount: amount })
      .eq('id', id);

    if (error) {
      toast.error('Failed to save fee');
      return;
    }

    toast.success('Fee updated');
    loadFees();
  }

  /* =========================
     ADD NEW CLASS FEE
  ========================= */
  async function addNewFee() {
    if (!academicYear || !newClass || !newAmount) {
      toast.error('All fields required');
      return;
    }

    const amount = Number(newAmount);
    if (amount <= 0) {
      toast.error('Fee must be positive');
      return;
    }

    const { error } = await supabase.from('class_fees').insert({
      class: newClass,
      academic_year: academicYear,
      monthly_amount: amount,
    });

    if (error) {
      toast.error('Class fee already exists or invalid data');
      return;
    }

    toast.success('Class fee added');
    setNewClass('');
    setNewAmount('');
    loadFees();
  }

  /* =========================
     UI
  ========================= */
  return (
    <div>
      <h1 className="text-2xl mb-4">Class Fees</h1>

      <input
        placeholder="Academic Year (e.g. 2026-2027)"
        className="p-2 bg-zinc-800 rounded mb-4"
        value={academicYear}
        onChange={(e) => setAcademicYear(e.target.value)}
      />

      {fees.map((f) => (
        <div key={f.id} className="flex gap-4 mb-2 items-center">
          <span className="w-24">Class {f.class}</span>

          <input
            type="number"
            className="p-2 bg-zinc-800 rounded w-40"
            value={f.monthly_amount}
            onChange={(e) =>
              setFees(prev =>
                prev.map(x =>
                  x.id === f.id
                    ? { ...x, monthly_amount: Number(e.target.value) }
                    : x
                )
              )
            }
          />

          <button
            onClick={() => saveFee(f.id, f.monthly_amount)}
            className="px-3 py-1 bg-blue-600 rounded"
          >
            Save
          </button>
        </div>
      ))}

      <div className="mt-6">
        <h2 className="mb-2">Add Class Fee</h2>

        <input
          placeholder="Class"
          className="p-2 bg-zinc-800 rounded mr-2 w-24"
          value={newClass}
          onChange={(e) => setNewClass(e.target.value)}
        />

        <input
          placeholder="Monthly Fee"
          type="number"
          className="p-2 bg-zinc-800 rounded mr-2 w-40"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
        />

        <button
          onClick={addNewFee}
          className="px-3 py-2 bg-green-600 rounded"
        >
          Add
        </button>
      </div>
    </div>
  );
}
