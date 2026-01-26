'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { 
  ArrowLeft, Edit3, Save, User, MapPin, Users, Wallet, 
  Phone, Mail, Briefcase, GraduationCap, Calendar, Hash, Shield, X
} from 'lucide-react';

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

/* --- UI PROPS INTERFACES --- */
interface SectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}

interface ReadOnlyFieldProps {
  label: string;
  value: string | null;
  icon: ReactNode;
}

interface EditableInputProps {
  label: string;
  value: string | null;
  edit: boolean;
  onChange: (value: string) => void;
  icon: ReactNode;
  type?: string;
}

interface EditableTextareaProps {
  label: string;
  value: string | null;
  edit: boolean;
  onChange: (value: string) => void;
}

/* =========================
   COMPONENT
========================= */
export default function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // STATE
  const [studentFees, setStudentFees] = useState<any[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Guardian Modal State
  const [showGuardianModal, setShowGuardianModal] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
  const [guardianForm, setGuardianForm] = useState<Omit<Guardian, 'id'>>({
    type: 'father', name: '', email: '', phone: '', occupation: '',
  });

  /* =========================
     LOGIC: LOAD DATA
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
        id, admission_number, roll_number, full_name, gender, dob,
        class, section, academic_year, admission_date, status,
        current_address, permanent_address
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
     LOGIC: UPDATE STUDENT
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

    if (error) { alert(error.message); return; }
    setEditMode(false);
    loadStudent();
  }

  /* =========================
     LOGIC: SAVE GUARDIAN
  ========================= */
  async function saveGuardian() {
    if (!guardianForm.name) { alert('Guardian name is required'); return; }

    const payload = { student_id: id, ...guardianForm };
    const query = editingGuardian
      ? supabase.from('guardians').update(payload).eq('id', editingGuardian.id)
      : supabase.from('guardians').insert(payload);

    const { error } = await query;
    if (error) { alert(error.message); return; }

    setShowGuardianModal(false);
    setEditingGuardian(null);
    setGuardianForm({ type: 'father', name: '', email: '', phone: '', occupation: '' });
    loadGuardians();
  }

  /* =========================
     UI RENDER
  ========================= */
  if (loading) return (
    <div className="h-[50vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-zinc-500 text-sm animate-pulse">Loading Profile...</p>
    </div>
  );
  
  if (!student) return null;

  return (
    <div className="space-y-6 animate-fade-in-up pb-20 md:pb-10 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{student.full_name}</h1>
            <p className="text-zinc-500 text-sm flex items-center gap-2">
              <span>Class {student.class} {student.section ? `(${student.section})` : ''}</span>
              <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
              <span className="font-mono text-zinc-400">ADM: {student.admission_number}</span>
            </p>
          </div>
        </div>
        
        <button
          onClick={() => editMode ? handleUpdateStudent() : setEditMode(true)}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg
            ${editMode 
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'}
          `}
        >
          {editMode ? <><Save className="w-4 h-4" /> Save Changes</> : <><Edit3 className="w-4 h-4" /> Edit Profile</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          <Section title="Basic Information" icon={<User className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <ReadOnlyField label="Admission No" value={student.admission_number} icon={<Hash className="w-3.5 h-3.5" />} />
              <EditableInput label="Roll Number" value={student.roll_number} edit={editMode} onChange={(v)=>setStudent({...student, roll_number:v})} icon={<Hash className="w-3.5 h-3.5" />} />
              <EditableInput label="Full Name" value={student.full_name} edit={editMode} onChange={(v)=>setStudent({...student, full_name:v})} icon={<User className="w-3.5 h-3.5" />} />
              <EditableInput label="Gender" value={student.gender} edit={editMode} onChange={(v)=>setStudent({...student, gender:v})} icon={<User className="w-3.5 h-3.5" />} />
              <EditableInput label="Date of Birth" type="date" value={student.dob} edit={editMode} onChange={(v)=>setStudent({...student, dob:v})} icon={<Calendar className="w-3.5 h-3.5" />} />
              <EditableInput label="Class" value={student.class} edit={editMode} onChange={(v)=>setStudent({...student, class:v})} icon={<GraduationCap className="w-3.5 h-3.5" />} />
              <EditableInput label="Section" value={student.section} edit={editMode} onChange={(v)=>setStudent({...student, section:v})} icon={<Users className="w-3.5 h-3.5" />} />
              <EditableInput label="Academic Year" value={student.academic_year} edit={editMode} onChange={(v)=>setStudent({...student, academic_year:v})} icon={<Calendar className="w-3.5 h-3.5" />} />
              <ReadOnlyField label="Admission Date" value={student.admission_date} icon={<Calendar className="w-3.5 h-3.5" />} />
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase text-zinc-500 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Status
                </span>
                <div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${student.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {student.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Address Details" icon={<MapPin className="w-4 h-4" />}>
            <div className="space-y-6">
               <EditableTextarea label="Current Address" value={student.current_address} edit={editMode} onChange={(v)=>setStudent({...student, current_address:v})} />
               <EditableTextarea label="Permanent Address" value={student.permanent_address} edit={editMode} onChange={(v)=>setStudent({...student, permanent_address:v})} />
            </div>
          </Section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          <Section 
            title="Parents & Guardians" 
            icon={<Users className="w-4 h-4" />}
            action={
              <button 
                onClick={() => { setEditingGuardian(null); setShowGuardianModal(true); }}
                className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-500/20 transition-colors border border-indigo-500/20 font-medium"
              >
                + Add
              </button>
            }
          >
            <div className="space-y-3">
              {guardians.length === 0 && <p className="text-zinc-500 text-sm italic py-2">No guardian info added.</p>}
              {guardians.map((g) => (
                <div key={g.id} className="group bg-black/20 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{g.type}</span>
                      <p className="font-semibold text-white mt-1.5">{g.name}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setEditingGuardian(g);
                        setGuardianForm({ type: g.type, name: g.name, email: g.email, phone: g.phone, occupation: g.occupation });
                        setShowGuardianModal(true);
                      }}
                      className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {g.phone && <div className="flex items-center gap-2 text-xs text-zinc-400"><Phone className="w-3 h-3" /> {g.phone}</div>}
                    {g.email && <div className="flex items-center gap-2 text-xs text-zinc-400"><Mail className="w-3 h-3" /> {g.email}</div>}
                    {g.occupation && <div className="flex items-center gap-2 text-xs text-zinc-400"><Briefcase className="w-3 h-3" /> {g.occupation}</div>}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Fee History" icon={<Wallet className="w-4 h-4" />}>
            {studentFees.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm border border-dashed border-white/10 rounded-xl bg-white/5">
                No fee records found
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-white/5 bg-black/20">
                <table className="w-full text-xs text-left">
                  <thead className="bg-white/5 text-zinc-400 font-semibold uppercase">
                    <tr>
                      <th className="px-3 py-2">Month</th>
                      <th className="px-3 py-2 text-right">Paid</th>
                      <th className="px-3 py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {studentFees.map((f) => (
                      <tr key={f.fee_month} className="hover:bg-white/5 transition-colors">
                        <td className="px-3 py-2.5 font-medium text-zinc-300">{f.fee_month}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-zinc-400">₹{f.paid_amount}</td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${f.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : f.status === 'partial' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {f.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

        </div>
      </div>

      {/* --- GUARDIAN MODAL --- */}
      {showGuardianModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-white/5 p-5 border-b border-white/5 flex justify-between items-center">
              <div><h2 className="text-lg font-bold text-white">{editingGuardian ? 'Edit Guardian' : 'Add Guardian'}</h2></div>
              <button onClick={() => setShowGuardianModal(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                 <label className="text-xs text-zinc-400 font-semibold ml-1 uppercase">Relation Type</label>
                 <div className="relative"><Users className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                 <select className="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-indigo-500 outline-none appearance-none cursor-pointer" value={guardianForm.type} onChange={(e)=>setGuardianForm({...guardianForm,type:e.target.value as any})}>
                   <option value="father">Father</option><option value="mother">Mother</option><option value="other">Other</option>
                 </select></div>
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs text-zinc-400 font-semibold ml-1 uppercase">Full Name *</label>
                 <div className="relative"><User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                 <input className="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-indigo-500 outline-none placeholder:text-zinc-700" placeholder="e.g. John Doe" value={guardianForm.name} onChange={(e)=>setGuardianForm({...guardianForm,name:e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1.5"><label className="text-xs text-zinc-400 font-semibold ml-1 uppercase">Phone</label>
                 <input className="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2.5 px-3 text-white text-sm focus:border-indigo-500 outline-none" placeholder="98765..." value={guardianForm.phone ?? ''} onChange={(e)=>setGuardianForm({...guardianForm,phone:e.target.value})} /></div>
                 <div className="space-y-1.5"><label className="text-xs text-zinc-400 font-semibold ml-1 uppercase">Occupation</label>
                 <input className="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2.5 px-3 text-white text-sm focus:border-indigo-500 outline-none" placeholder="Job Title" value={guardianForm.occupation ?? ''} onChange={(e)=>setGuardianForm({...guardianForm,occupation:e.target.value})} /></div>
              </div>
              <div className="space-y-1.5"><label className="text-xs text-zinc-400 font-semibold ml-1 uppercase">Email</label>
              <input className="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2.5 px-3 text-white text-sm focus:border-indigo-500 outline-none" placeholder="mail@example.com" value={guardianForm.email ?? ''} onChange={(e)=>setGuardianForm({...guardianForm,email:e.target.value})} /></div>

              <div className="flex gap-3 pt-2">
                <button onClick={()=>setShowGuardianModal(false)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl font-medium transition-colors">Cancel</button>
                <button onClick={saveGuardian} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-lg transition-colors">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* =========================
   UI HELPERS (TYPED)
========================= */

function Section({ title, icon, children, action }: SectionProps) {
  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl relative shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/5">
         <div className="flex items-center gap-2 text-indigo-400">
           {icon}
           <h2 className="text-sm font-bold uppercase tracking-wider">{title}</h2>
         </div>
         {action}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function ReadOnlyField({ label, value, icon }: ReadOnlyFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase text-zinc-500 flex items-center gap-1.5">
        {icon} {label}
      </span>
      <div className="text-sm text-zinc-300 font-medium pl-1 border-l-2 border-white/10 ml-0.5 py-0.5">
        {value ?? <span className="text-zinc-600 italic">N/A</span>}
      </div>
    </div>
  );
}

function EditableInput({ label, value, edit, onChange, icon, type = 'text' }: EditableInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase text-zinc-500 flex items-center gap-1.5">
        {icon} {label}
      </span>
      {edit ? (
        <input
          type={type}
          className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:bg-black/40 outline-none transition-all"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="text-sm text-white font-medium pl-1 border-l-2 border-white/10 ml-0.5 py-0.5 truncate">
          {value ?? <span className="text-zinc-600 italic">N/A</span>}
        </div>
      )}
    </div>
  );
}

function EditableTextarea({ label, value, edit, onChange }: EditableTextareaProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase text-zinc-500 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5" /> {label}
      </span>
      {edit ? (
        <textarea
          className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:bg-black/40 outline-none transition-all min-h-[80px]"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="text-sm text-zinc-300 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5 min-h-[60px]">
          {value ?? <span className="text-zinc-600 italic">No address provided.</span>}
        </div>
      )}
    </div>
  );
}