'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, User, Mail, Phone, Briefcase, BookOpen, 
  Calendar, Clock, Users, MapPin, Save, Loader2, Star
} from 'lucide-react';

/* =========================
   HELPER COMPONENTS
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
export default function AddTeacherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '',
    full_name: '',
    gender: '',
    designation: '',
    subject: '',
    dob: '',
    father_name: '',
    mother_name: '',
    husband_name: '',
    join_date: '',
    phone: '',
    experience: '',
    current_address: '',
    permanent_address: '',
  });

  async function handleSubmit() {
    if (!form.email || !form.full_name || !form.join_date) {
      toast.error('Email, Name and Join Date are required');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-teacher`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) {
        const msg = await res.text();
        toast.error(msg || 'Failed to add teacher');
        setLoading(false);
        return;
      }

      toast.success('Teacher added successfully');

      // small delay so user sees success message
      setTimeout(() => {
        router.push('/admin/teachers');
      }, 1200);
    } catch (err) {
      toast.error('Something went wrong');
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
            <h1 className="text-3xl font-bold text-white tracking-tight">Add New Teacher</h1>
            <p className="text-zinc-500 text-sm mt-1">Create a new faculty profile</p>
          </div>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>{loading ? 'Creating Profile...' : 'Save Teacher'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">

        {/* SECTION 1: PERSONAL INFO */}
        <Section title="Personal Information" icon={<User className="w-5 h-5" />}>
          <InputGroup 
            label="Full Name" 
            required 
            icon={<User className="w-4 h-4" />} 
            value={form.full_name} 
            onChange={(e: any) => setForm({ ...form, full_name: e.target.value })} 
            placeholder="e.g. Sarah Connor"
          />
          <InputGroup 
            label="Email Address" 
            required 
            type="email"
            icon={<Mail className="w-4 h-4" />} 
            value={form.email} 
            onChange={(e: any) => setForm({ ...form, email: e.target.value })} 
            placeholder="teacher@school.com"
          />
          <InputGroup 
            label="Phone Number" 
            icon={<Phone className="w-4 h-4" />} 
            value={form.phone} 
            onChange={(e: any) => setForm({ ...form, phone: e.target.value })} 
            placeholder="+91 98765..."
          />
          <InputGroup 
            label="Gender" 
            icon={<User className="w-4 h-4" />} 
            value={form.gender} 
            onChange={(e: any) => setForm({ ...form, gender: e.target.value })} 
            placeholder="Male / Female"
          />
          <InputGroup 
            label="Date of Birth" 
            type="date"
            icon={<Calendar className="w-4 h-4" />} 
            value={form.dob} 
            onChange={(e: any) => setForm({ ...form, dob: e.target.value })} 
          />
        </Section>

        {/* SECTION 2: PROFESSIONAL INFO */}
        <Section title="Professional Details" icon={<Briefcase className="w-5 h-5" />}>
           <InputGroup 
            label="Designation" 
            icon={<Briefcase className="w-4 h-4" />} 
            value={form.designation} 
            onChange={(e: any) => setForm({ ...form, designation: e.target.value })} 
            placeholder="e.g. Senior Lecturer"
          />
          <InputGroup 
            label="Subject Specialization" 
            icon={<BookOpen className="w-4 h-4" />} 
            value={form.subject} 
            onChange={(e: any) => setForm({ ...form, subject: e.target.value })} 
            placeholder="e.g. Mathematics"
          />
           <InputGroup 
            label="Joining Date" 
            required
            type="date"
            icon={<Clock className="w-4 h-4" />} 
            value={form.join_date} 
            onChange={(e: any) => setForm({ ...form, join_date: e.target.value })} 
          />
          <InputGroup 
            label="Experience (Years)" 
            type="number"
            icon={<Star className="w-4 h-4" />} 
            value={form.experience} 
            onChange={(e: any) => setForm({ ...form, experience: e.target.value })} 
            placeholder="e.g. 5"
          />
        </Section>

        {/* SECTION 3: FAMILY DETAILS */}
        <Section title="Family Background" icon={<Users className="w-5 h-5" />}>
           <InputGroup 
            label="Father's Name" 
            icon={<User className="w-4 h-4" />} 
            value={form.father_name} 
            onChange={(e: any) => setForm({ ...form, father_name: e.target.value })} 
          />
           <InputGroup 
            label="Mother's Name" 
            icon={<User className="w-4 h-4" />} 
            value={form.mother_name} 
            onChange={(e: any) => setForm({ ...form, mother_name: e.target.value })} 
          />
           <InputGroup 
            label="Husband's Name" 
            icon={<User className="w-4 h-4" />} 
            value={form.husband_name} 
            onChange={(e: any) => setForm({ ...form, husband_name: e.target.value })} 
            placeholder="Optional"
            className="col-span-1 md:col-span-2 md:w-1/2"
          />
        </Section>

        {/* SECTION 4: ADDRESS */}
        <Section title="Contact Addresses" icon={<MapPin className="w-5 h-5" />}>
          <TextareaGroup 
            label="Current Address"
            icon={<MapPin className="w-4 h-4" />}
            value={form.current_address}
            onChange={(e: any) => setForm({ ...form, current_address: e.target.value })}
            placeholder="Enter full current address..."
          />
          <TextareaGroup 
            label="Permanent Address"
            icon={<MapPin className="w-4 h-4" />}
            value={form.permanent_address}
            onChange={(e: any) => setForm({ ...form, permanent_address: e.target.value })}
            placeholder="Enter full permanent address..."
          />
        </Section>

      </div>
    </div>
  );
}