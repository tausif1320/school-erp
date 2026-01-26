'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Filter, Plus, Calendar, Edit3, X, Check, Loader2, DollarSign, ChevronDown, ChevronLeft, ChevronRight 
} from 'lucide-react';
import toast from 'react-hot-toast';

/* --- TYPES --- */
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
  /* --- LOGIC STATE --- */
  // We keep 'month' as YYYY-MM string for logic, but use separate UI for picking
  const [month, setMonth] = useState(''); 
  const [academicYear, setAcademicYear] = useState('');
  
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  
  const [editingFee, setEditingFee] = useState<FeeRow | null>(null);
  const [paidInput, setPaidInput] = useState('');

  // UI States for Custom Pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const datePickerRef = useRef<any>(null);

  /* =========================
     LOGIC: LOAD FEES
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

  // Click outside to close date picker
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* =========================
     LOGIC: GENERATE FEES
  ========================= */
  async function generateFees() {
    if (!month || !academicYear) {
      toast.error('Please select Month and Academic Year first');
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

    toast.success(`Generated ${generated} new fee records`);
    setLoading(false);
    loadFees();
  }

  /* =========================
     LOGIC: UPDATE PAYMENT
  ========================= */
  async function updatePaidAmount() {
    if (!editingFee) return;
    const amount = Number(paidInput);

    if (amount < 0 || amount > editingFee.total_amount) {
      toast.error('Invalid amount');
      return;
    }

    await supabase
      .from('fee_records')
      .update({ paid_amount: amount })
      .eq('id', editingFee.id);

    toast.success('Payment updated');
    setEditingFee(null);
    setPaidInput('');
    loadFees();
  }

  /* =========================
     UI HELPERS
  ========================= */
  const handleMonthSelect = (mIndex: number) => {
    const mStr = String(mIndex + 1).padStart(2, '0');
    setMonth(`${pickerYear}-${mStr}`);
    setShowDatePicker(false);
  };

  const getMonthName = (m: string) => {
    if (!m) return 'Select Month';
    const [y, mn] = m.split('-');
    const date = new Date(Number(y), Number(mn) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="space-y-6 animate-fade-in-up pb-24 md:pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Fee Collection</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage monthly tuition records</p>
        </div>
        <button
          onClick={generateFees}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>Generate Records</span>
        </button>
      </div>

      {/* FILTER BAR (Glassmorphism) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-4 rounded-2xl">
        
        {/* 1. CUSTOM MONTH PICKER */}
        <div className="relative" ref={datePickerRef}>
          <button 
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="w-full flex items-center justify-between bg-black/20 border border-white/5 hover:bg-white/5 text-zinc-300 rounded-xl px-4 py-3 text-sm transition-all outline-none focus:border-indigo-500/50"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-zinc-500" />
              <span>{month ? getMonthName(month) : 'Select Month...'}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-zinc-600" />
          </button>

          {/* Month/Year Dropdown Popover */}
          {showDatePicker && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 p-4 animate-fade-in-up">
              
              {/* Year Selector */}
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                <button onClick={() => setPickerYear(pickerYear - 1)} className="p-1 hover:bg-white/10 rounded"><ChevronLeft className="w-4 h-4 text-zinc-400" /></button>
                <span className="font-bold text-white">{pickerYear}</span>
                <button onClick={() => setPickerYear(pickerYear + 1)} className="p-1 hover:bg-white/10 rounded"><ChevronRight className="w-4 h-4 text-zinc-400" /></button>
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleMonthSelect(i)}
                    className="p-2 text-xs rounded-lg hover:bg-indigo-600 hover:text-white text-zinc-400 transition-colors"
                  >
                    {new Date(0, i).toLocaleString('default', { month: 'short' })}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. ACADEMIC YEAR INPUT */}
        <div className="relative group">
          <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
          <input
            placeholder="Academic Year (e.g. 2026-2027)"
            className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-300 focus:bg-black/40 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600"
            value={academicYear}
            onChange={e => setAcademicYear(e.target.value)}
          />
        </div>

        {/* 3. CUSTOM STATUS SELECT */}
        <div className="relative group">
          <Filter className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
          <select
            className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-300 focus:bg-black/40 focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
            onChange={e => setStatusFilter(e.target.value)}
            value={statusFilter}
          >
            <option value="" className="bg-zinc-900 text-zinc-400">All Statuses</option>
            <option value="paid" className="bg-zinc-900 text-white">Paid</option>
            <option value="partial" className="bg-zinc-900 text-white">Partial</option>
            <option value="unpaid" className="bg-zinc-900 text-white">Unpaid</option>
          </select>
          <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-zinc-600 pointer-events-none" />
        </div>

        {/* 4. CLASS SEARCH */}
        <div className="relative group">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
          <input
            placeholder="Filter by Class..."
            className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-300 focus:bg-black/40 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600"
            onChange={e => setClassFilter(e.target.value)}
          />
        </div>
      </div>

      {/* --- TABLE (Responsive) --- */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-zinc-500 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm font-medium">Loading records...</p>
          </div>
        ) : fees.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center text-zinc-500">
             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
               <Filter className="w-8 h-8 opacity-50" />
             </div>
             <p className="text-lg font-medium text-white">No records found</p>
             <p className="text-sm mt-1">Adjust filters or generate new fees to see data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-wider whitespace-nowrap">Student Name</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Class</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Total</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Paid</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {fees.map((f) => (
                  <tr key={f.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{f.full_name}</div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{f.admission_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-white/5 px-2 py-1 rounded text-xs border border-white/5 text-zinc-300">{f.class}</span>
                    </td>
                    <td className="px-6 py-4 text-zinc-300 font-mono">₹{f.total_amount.toLocaleString()}</td>
                    <td className="px-6 py-4 font-mono">
                      <span className={`${f.paid_amount > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        ₹{f.paid_amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={f.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setEditingFee(f);
                          setPaidInput(String(f.paid_amount));
                        }}
                        className="text-indigo-400 hover:text-white p-2 hover:bg-indigo-500/20 rounded-lg transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- EDIT MODAL --- */}
      {editingFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            
            <div className="bg-white/5 p-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white">Update Payment</h2>
                <p className="text-xs text-zinc-400 mt-1">Enter collection details</p>
              </div>
              <button 
                onClick={() => setEditingFee(null)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-black/20 rounded-xl p-4 border border-white/5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Student</span>
                  <span className="text-white font-medium">{editingFee.full_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Total Fee</span>
                  <span className="text-white font-medium">₹{editingFee.total_amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-zinc-500 ml-1">Received Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="number"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-lg font-mono placeholder:text-zinc-700"
                    value={paidInput}
                    onChange={e => setPaidInput(e.target.value)}
                    autoFocus
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-zinc-500 text-right">
                  Balance: <span className="text-red-400 font-mono">₹{(editingFee.total_amount - Number(paidInput)).toLocaleString()}</span>
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingFee(null)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updatePaidAmount}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all flex justify-center items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- BADGE --- */
function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    partial: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    unpaid: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  const labels: any = { paid: 'Paid', partial: 'Partial', unpaid: 'Unpaid' };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.unpaid}`}>
      {labels[status] || status}
    </span>
  );
}