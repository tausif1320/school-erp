'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { 
  Calendar, Save, Plus, DollarSign, BookOpen, Loader2, Edit3, CheckCircle2 
} from 'lucide-react';

/* --- TYPES (Kept Original) --- */
type ClassFee = {
  id: string;
  class: string;
  academic_year: string;
  monthly_amount: number;
};

export default function ClassFeesPage() {
  /* --- STATE (Kept Original) --- */
  const [academicYear, setAcademicYear] = useState('');
  const [fees, setFees] = useState<ClassFee[]>([]);
  const [newClass, setNewClass] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  /* =========================
     LOGIC: LOAD FEES
  ========================= */
  async function loadFees() {
    if (!academicYear) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('class_fees')
      .select('*')
      .eq('academic_year', academicYear)
      .order('class'); // Assuming class is stored as text, sorting might need alphanumeric handling in SQL normally

    if (error) {
      toast.error('Failed to load class fees');
    } else {
      setFees(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadFees();
  }, [academicYear]);

  /* =========================
     LOGIC: SAVE FEE
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

    setSavingId(id);

    const { error } = await supabase
      .from('class_fees')
      .update({ monthly_amount: amount })
      .eq('id', id);

    setSavingId(null);

    if (error) {
      toast.error('Failed to save fee');
      return;
    }

    toast.success('Fee updated successfully');
    loadFees();
  }

  /* =========================
     LOGIC: ADD NEW FEE
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

    toast.success('New class added');
    setNewClass('');
    setNewAmount('');
    loadFees();
  }

  /* =========================
     PREMIUM UI RENDER
  ========================= */
  return (
    <div className="space-y-8 animate-fade-in-up pb-24 md:pb-10">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Fee Structure</h1>
          <p className="text-zinc-500 text-sm mt-1">Define monthly tuition rates per class</p>
        </div>
      </div>

      {/* --- ACADEMIC YEAR SELECTOR --- */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl relative z-10">
        <label className="text-xs font-semibold uppercase text-zinc-500 ml-1 mb-2 block">Select Academic Year</label>
        <div className="relative group max-w-md">
          <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
          <input
            placeholder="e.g. 2026-2027"
            className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-300 focus:bg-black/40 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600 font-mono tracking-wide"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT: FEE LIST TABLE --- */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-2 px-1">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Current Fees</h2>
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center text-zinc-500 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-sm font-medium">Loading classes...</p>
              </div>
            ) : fees.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center text-zinc-500">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                  <DollarSign className="w-6 h-6 opacity-50" />
                </div>
                <p className="text-white font-medium">No fees defined</p>
                <p className="text-xs mt-1">Enter a year above to view or add fees.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-zinc-500 uppercase bg-white/5 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Class Name</th>
                      <th className="px-6 py-4 font-semibold">Monthly Fee</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {fees.map((f) => (
                      <tr key={f.id} className="group hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">
                          Class {f.class}
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative max-w-[140px]">
                            <span className="absolute left-3 top-2.5 text-zinc-500">₹</span>
                            <input
                              type="number"
                              className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-7 pr-3 text-white focus:border-indigo-500 outline-none transition-all font-mono text-sm"
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
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => saveFee(f.id, f.monthly_amount)}
                            disabled={savingId === f.id}
                            className="text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 p-2 rounded-lg transition-all disabled:opacity-50"
                            title="Save Changes"
                          >
                            {savingId === f.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT: ADD NEW CLASS CARD --- */}
        <div>
          <div className="flex items-center gap-2 mb-4 px-1">
            <Plus className="w-4 h-4 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Add New Class</h2>
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl sticky top-24 space-y-5 shadow-xl">
            
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-zinc-500 ml-1">Class Name</label>
              <div className="relative group">
                <BookOpen className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                <input
                  placeholder="e.g. 10-A"
                  className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-300 focus:bg-black/40 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600"
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-zinc-500 ml-1">Monthly Fee</label>
              <div className="relative group">
                <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-300 focus:bg-black/40 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600 font-mono"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={addNewFee}
              disabled={!academicYear}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 rounded-xl font-medium shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Fee Structure</span>
            </button>
            
            {!academicYear && (
              <p className="text-xs text-center text-zinc-500">
                Please enter an Academic Year first.
              </p>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}