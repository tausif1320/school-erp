'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, User, FileText, GraduationCap, Filter, 
  Calendar, Save, Loader2 
} from 'lucide-react';

/* =========================
   COMPONENT
========================= */
export default function AddStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    admission_number: '',
    full_name: '',
    class: '',
    section: '',
    academic_year: '',
    admission_date: '',
  });

  async function handleSubmit() {
    if (!form.admission_number || !form.full_name || !form.class || !form.academic_year || !form.admission_date) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('students').insert({
      admission_number: form.admission_number,
      full_name: form.full_name,
      class: form.class,
      section: form.section || null,
      academic_year: form.academic_year,
      admission_date: form.admission_date,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success('Student registered successfully');
    setTimeout(() => {
      router.push('/admin/students');
    }, 1000);
  }

  return (
    <div className="animate-fade-in-up pb-20 md:pb-10 max-w-5xl mx-auto space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">New Admission</h1>
            <p className="text-zinc-500 text-sm mt-1">Register a new student</p>
          </div>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>{loading ? 'Registering...' : 'Complete Admission'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT: IDENTITY */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-xl space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/5 mb-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><User className="w-5 h-5" /></div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Student Identity</h2>
          </div>
          
          <InputGroup 
            label="Admission Number" 
            required
            icon={<FileText className="w-4 h-4" />} 
            value={form.admission_number} 
            onChange={(v) => setForm({...form, admission_number: v})} 
            placeholder="e.g. 2024001"
          />
          <InputGroup 
            label="Full Name" 
            required
            icon={<User className="w-4 h-4" />} 
            value={form.full_name} 
            onChange={(v) => setForm({...form, full_name: v})} 
            placeholder="e.g. John Doe"
          />
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold ml-1 uppercase flex items-center gap-1">Admission Date <span className="text-red-500">*</span></label>
            <div className="relative group">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
              <input type="date" className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-indigo-500 outline-none transition-all [color-scheme:dark]" value={form.admission_date} onChange={(e) => setForm({...form, admission_date: e.target.value})} />
            </div>
          </div>
        </div>

        {/* RIGHT: ACADEMIC */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-xl space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/5 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><GraduationCap className="w-5 h-5" /></div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Academic Details</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputGroup 
              label="Class" 
              required
              icon={<GraduationCap className="w-4 h-4" />} 
              value={form.class} 
              onChange={(v) => setForm({...form, class: v})} 
              placeholder="e.g. 10"
            />
            <InputGroup 
              label="Section" 
              icon={<Filter className="w-4 h-4" />} 
              value={form.section} 
              onChange={(v) => setForm({...form, section: v})} 
              placeholder="e.g. A"
            />
          </div>
          <InputGroup 
            label="Academic Year" 
            required
            icon={<Calendar className="w-4 h-4" />} 
            value={form.academic_year} 
            onChange={(v) => setForm({...form, academic_year: v})} 
            placeholder="e.g. 2025-2026"
          />
        </div>

      </div>
    </div>
  );
}

// Reusable Input Helper
function InputGroup({ label, icon, value, onChange, placeholder, required }: { label: string; icon: React.ReactNode; value: string; onChange: (val: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-zinc-400 font-bold ml-1 uppercase flex items-center gap-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative group">
        <div className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-white transition-colors">
          {icon}
        </div>
        <input
          className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-indigo-500 focus:bg-black/40 outline-none transition-all placeholder:text-zinc-600 font-medium"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}