'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, User, Mail, Phone, Briefcase, 
  Calendar, Users, MapPin, Save, Loader2, 
  GraduationCap, Hash, FileText, ChevronDown
} from 'lucide-react';

/* =========================
   HELPER: PREMIUM NATIVE DATE PICKER
   (Uses browser native picker but styled dark)
========================= */
function PremiumDatePicker({ label, value, onChange, required = false }: { label: string, value: string, onChange: (e: any) => void, required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-zinc-400 font-bold ml-1 uppercase flex items-center gap-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative group">
        {/* Icon Overlay */}
        <div className="absolute left-3 top-2.5 pointer-events-none z-10">
          <Calendar className="w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
        </div>

        {/* Native Input with Dark Scheme 
           [color-scheme:dark] ensures the popup calendar is dark mode 
        */}
        <input 
          type="date"
          required={required}
          value={value}
          onChange={onChange}
          className="
            w-full bg-black/20 border border-white/10 rounded-xl 
            py-2.5 pl-10 pr-4 text-sm text-white 
            focus:border-indigo-500 focus:bg-black/40 
            outline-none transition-all font-medium
            [color-scheme:dark] 
            cursor-pointer
            placeholder-zinc-600
          "
        />
        
        {/* Custom Chevron for visual consistency */}
        <div className="absolute right-3 top-2.5 pointer-events-none">
          <ChevronDown className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
        </div>
      </div>
    </div>
  );
}

/* =========================
   OTHER HELPER COMPONENTS
========================= */
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-xl">
      <div className="flex items-center gap-2.5 mb-6 border-b border-white/5 pb-4">
        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">{icon}</div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children}
      </div>
    </div>
  );
}

function InputGroup({ label, icon, value, onChange, placeholder, type = 'text', required = false, className = '' }: any) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs text-zinc-400 font-bold ml-1 uppercase flex items-center gap-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative group">
        <div className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-white transition-colors">
          {icon}
        </div>
        <input
          type={type}
          className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-indigo-500 focus:bg-black/40 outline-none transition-all placeholder:text-zinc-600 font-medium"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function SelectGroup({ label, icon, value, onChange, options, required = false }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-zinc-400 font-bold ml-1 uppercase flex items-center gap-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative group">
        <div className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-white transition-colors">
          {icon}
        </div>
        <select
          className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-8 text-sm text-white focus:border-indigo-500 focus:bg-black/40 outline-none transition-all appearance-none cursor-pointer"
          value={value}
          onChange={onChange}
        >
          {options.map((opt: any) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-600 pointer-events-none" />
      </div>
    </div>
  );
}

function TextareaGroup({ label, icon, value, onChange, placeholder }: any) {
  return (
    <div className="space-y-1.5 col-span-1 md:col-span-2">
      <label className="text-xs text-zinc-400 font-bold ml-1 uppercase flex items-center gap-1">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-white transition-colors">
          {icon}
        </div>
        <textarea
          className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-indigo-500 focus:bg-black/40 outline-none transition-all placeholder:text-zinc-600 font-medium min-h-[80px]"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

/* =========================
   MAIN PAGE
========================= */
export default function AddStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    academic_year: '',
    class: '',
    section: '',
    roll_number: '',
    admission_number: '',
    full_name: '',
    gender: 'Male',
    dob: '',
    admission_date: new Date().toISOString().split('T')[0], // Default to today
    
    father_name: '',
    father_phone: '',
    father_occupation: '',
    mother_name: '',
    mother_phone: '',
    mother_occupation: '',

    guardian_relation: 'Father',
    guardian_name: '',
    guardian_email: '',
    guardian_phone: '',
    guardian_occupation: '',

    current_address: '',
    permanent_address: '',
  });

  async function handleSubmit() {
    if (!form.full_name || !form.admission_number || !form.class || !form.academic_year) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from('students').insert({
        admission_number: form.admission_number,
        roll_number: form.roll_number || null,
        full_name: form.full_name,
        class: form.class,
        section: form.section,
        academic_year: form.academic_year,
        gender: form.gender,
        dob: form.dob || null,
        admission_date: form.admission_date,
        current_address: form.current_address,
        permanent_address: form.permanent_address,
        father_name: form.father_name,
        mother_name: form.mother_name,
        // Add other mapped fields as per your schema
      });

      if (error) throw error;

      toast.success('Student registered successfully');
      setTimeout(() => {
        router.push('/admin/students');
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in-up pb-20 md:pb-10 max-w-5xl mx-auto space-y-8">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Add New Student</h1>
            <p className="text-zinc-500 text-sm mt-1">Register a new student profile</p>
          </div>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>{loading ? 'Processing...' : 'Save Student'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">

        {/* SECTION 1: PERSONAL INFO */}
        <Section title="Personal Information" icon={<User className="w-5 h-5" />}>
          <InputGroup label="Academic Year" required icon={<Calendar className="w-4 h-4" />} value={form.academic_year} onChange={(e: any) => setForm({ ...form, academic_year: e.target.value })} placeholder="e.g. 2025-2026" />
          <InputGroup label="Admission Number" required icon={<FileText className="w-4 h-4" />} value={form.admission_number} onChange={(e: any) => setForm({ ...form, admission_number: e.target.value })} placeholder="e.g. 2025001" />
          <InputGroup label="Class" required icon={<GraduationCap className="w-4 h-4" />} value={form.class} onChange={(e: any) => setForm({ ...form, class: e.target.value })} placeholder="10" />
          <InputGroup label="Section" icon={<Users className="w-4 h-4" />} value={form.section} onChange={(e: any) => setForm({ ...form, section: e.target.value })} placeholder="A" />
          <InputGroup label="Full Name" required icon={<User className="w-4 h-4" />} value={form.full_name} onChange={(e: any) => setForm({ ...form, full_name: e.target.value })} placeholder="Student Name" />
          <InputGroup label="Roll Number" icon={<Hash className="w-4 h-4" />} value={form.roll_number} onChange={(e: any) => setForm({ ...form, roll_number: e.target.value })} placeholder="Optional" />
          <SelectGroup label="Gender" icon={<User className="w-4 h-4" />} value={form.gender} onChange={(e: any) => setForm({ ...form, gender: e.target.value })} options={[{value: 'Male', label: 'Male'}, {value: 'Female', label: 'Female'}, {value: 'Other', label: 'Other'}]} />
          
          {/* NATIVE PICKERS (Solves Z-Index & UX Issues) */}
          <PremiumDatePicker 
            label="Date of Birth" required
            value={form.dob} onChange={(e: any) => setForm({ ...form, dob: e.target.value })} 
          />
          <PremiumDatePicker 
            label="Admission Date" required
            value={form.admission_date} onChange={(e: any) => setForm({ ...form, admission_date: e.target.value })} 
          />
        </Section>

        {/* SECTION 2: PARENTS INFO */}
        <Section title="Parents Information" icon={<Users className="w-5 h-5" />}>
           <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-black/20 rounded-2xl border border-white/5">
              <h3 className="md:col-span-3 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Father's Details</h3>
              <InputGroup label="Name" icon={<User className="w-4 h-4" />} value={form.father_name} onChange={(e: any) => setForm({ ...form, father_name: e.target.value })} placeholder="Father's Name" />
              <InputGroup label="Phone" icon={<Phone className="w-4 h-4" />} value={form.father_phone} onChange={(e: any) => setForm({ ...form, father_phone: e.target.value })} placeholder="Phone" />
              <InputGroup label="Occupation" icon={<Briefcase className="w-4 h-4" />} value={form.father_occupation} onChange={(e: any) => setForm({ ...form, father_occupation: e.target.value })} placeholder="Job" />
           </div>
           <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-black/20 rounded-2xl border border-white/5">
              <h3 className="md:col-span-3 text-xs font-bold text-pink-400 uppercase tracking-wider mb-2">Mother's Details</h3>
              <InputGroup label="Name" icon={<User className="w-4 h-4" />} value={form.mother_name} onChange={(e: any) => setForm({ ...form, mother_name: e.target.value })} placeholder="Mother's Name" />
              <InputGroup label="Phone" icon={<Phone className="w-4 h-4" />} value={form.mother_phone} onChange={(e: any) => setForm({ ...form, mother_phone: e.target.value })} placeholder="Phone" />
              <InputGroup label="Occupation" icon={<Briefcase className="w-4 h-4" />} value={form.mother_occupation} onChange={(e: any) => setForm({ ...form, mother_occupation: e.target.value })} placeholder="Job" />
           </div>
        </Section>

        {/* SECTION 3: GUARDIAN INFO */}
        <Section title="Guardian Information" icon={<User className="w-5 h-5" />}>
           <SelectGroup label="Select Guardian" icon={<Users className="w-4 h-4" />} value={form.guardian_relation} onChange={(e: any) => setForm({ ...form, guardian_relation: e.target.value })} options={[{value: 'Father', label: 'Father'}, {value: 'Mother', label: 'Mother'}, {value: 'Other', label: 'Other'}]} />
           <InputGroup label="Guardian Name" icon={<User className="w-4 h-4" />} value={form.guardian_name} onChange={(e: any) => setForm({ ...form, guardian_name: e.target.value })} placeholder="Name" />
           <InputGroup label="Guardian Email" icon={<Mail className="w-4 h-4" />} value={form.guardian_email} onChange={(e: any) => setForm({ ...form, guardian_email: e.target.value })} placeholder="Email" />
           <InputGroup label="Guardian Phone" icon={<Phone className="w-4 h-4" />} value={form.guardian_phone} onChange={(e: any) => setForm({ ...form, guardian_phone: e.target.value })} placeholder="Phone" />
           <InputGroup label="Occupation" icon={<Briefcase className="w-4 h-4" />} value={form.guardian_occupation} onChange={(e: any) => setForm({ ...form, guardian_occupation: e.target.value })} placeholder="Job" className="md:col-span-2" />
        </Section>

        {/* SECTION 4: ADDRESS */}
        <Section title="Address Details" icon={<MapPin className="w-5 h-5" />}>
          <TextareaGroup label="Current Address" icon={<MapPin className="w-4 h-4" />} value={form.current_address} onChange={(e: any) => setForm({ ...form, current_address: e.target.value })} placeholder="Enter full current address..." />
          <TextareaGroup label="Permanent Address" icon={<MapPin className="w-4 h-4" />} value={form.permanent_address} onChange={(e: any) => setForm({ ...form, permanent_address: e.target.value })} placeholder="Enter full permanent address..." />
        </Section>

      </div>
    </div>
  );
}