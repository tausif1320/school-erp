'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Edit3, Save, User, MapPin, Users, Wallet, 
  Phone, Mail, GraduationCap, Calendar, Hash, Shield, X, 
  UserCircle, CheckCircle2, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

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

/* --- PROPS INTERFACES --- */
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

interface FieldProps {
  label: string;
  value: string | null;
  icon?: React.ReactNode;
}

interface InputProps {
  label: string;
  value: string | null;
  edit: boolean;
  onChange: (val: string) => void;
  icon?: React.ReactNode;
  type?: string;
}

interface TextareaProps {
  label: string;
  value: string | null;
  edit: boolean;
  onChange: (val: string) => void;
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

  // Modal State
  const [showGuardianModal, setShowGuardianModal] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
  const [guardianForm, setGuardianForm] = useState<Omit<Guardian, 'id'>>({
    type: 'father', name: '', email: '', phone: '', occupation: '',
  });

  /* =========================
     LOGIC: LOAD DATA
  ========================= */
  useEffect(() => {
    async function fetchAll() {
        if(!id) return;
        const [stu, fees, guards] = await Promise.all([
            supabase.from('students').select('*').eq('id', id).single(),
            supabase.from('fee_records').select('fee_month, total_amount, paid_amount, status').eq('student_id', id).order('fee_month', { ascending: false }),
            supabase.from('guardians').select('*').eq('student_id', id)
        ]);

        if (stu.error) { toast.error('Failed to load student'); router.push('/admin/students'); return; }
        
        setStudent(stu.data);
        setStudentFees(fees.data ?? []);
        setGuardians(guards.data ?? []);
        setLoading(false);
    }
    fetchAll();
  }, [id, router]);

  async function loadGuardians() {
    const { data } = await supabase.from('guardians').select('*').eq('student_id', id);
    setGuardians(data ?? []);
  }

  /* =========================
     LOGIC: UPDATE STUDENT
  ========================= */
  async function handleUpdateStudent() {
    if (!student) return;
    const { error } = await supabase.from('students').update({
      roll_number: student.roll_number,
      full_name: student.full_name,
      gender: student.gender,
      dob: student.dob,
      class: student.class,
      section: student.section,
      academic_year: student.academic_year,
      current_address: student.current_address,
      permanent_address: student.permanent_address,
    }).eq('id', student.id);

    if (error) { toast.error(error.message); return; }
    toast.success('Profile updated successfully');
    setEditMode(false);
  }

  /* =========================
     LOGIC: SAVE GUARDIAN
  ========================= */
  async function saveGuardian() {
    if (!guardianForm.name) { toast.error('Guardian name is required'); return; }
    const payload = { student_id: id, ...guardianForm };
    const query = editingGuardian
      ? supabase.from('guardians').update(payload).eq('id', editingGuardian.id)
      : supabase.from('guardians').insert(payload);

    const { error } = await query;
    if (error) { toast.error(error.message); return; }

    toast.success(editingGuardian ? 'Guardian updated' : 'Guardian added');
    setShowGuardianModal(false);
    setEditingGuardian(null);
    setGuardianForm({ type: 'father', name: '', email: '', phone: '', occupation: '' });
    loadGuardians();
  }

  /* =========================
     UI RENDER
  ========================= */
  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-zinc-500 text-sm font-medium animate-pulse">Loading Profile...</p>
    </div>
  );
  
  if (!student) return null;

  return (
    <div className="animate-fade-in-up pb-20 md:pb-10 max-w-7xl mx-auto space-y-8">
      
      {/* --- HERO HEADER --- */}
      <div className="relative bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden p-6 md:p-10 shadow-2xl">
        {/* Glow Effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          
          <div className="flex items-center gap-6 md:gap-8">
            
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center shadow-2xl">
                <UserCircle className="w-12 h-12 text-zinc-600" />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-zinc-950 ${student.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            </div>
            
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{student.full_name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold uppercase tracking-wide">
                  Class {student.class} - {student.section || 'A'}
                </span>
                <span className="px-3 py-1 rounded-lg bg-zinc-800/50 text-zinc-400 border border-white/5 text-xs font-mono flex items-center gap-2">
                  <Hash className="w-3 h-3" /> {student.admission_number}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => editMode ? handleUpdateStudent() : setEditMode(true)} 
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95
              ${editMode 
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20' 
                : 'bg-white hover:bg-zinc-200 text-black shadow-white/10'}
            `}
          >
            {editMode ? <><Save className="w-4 h-4" /> Save Changes</> : <><Edit3 className="w-4 h-4" /> Edit Profile</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* --- LEFT COLUMN: DETAILS --- */}
        <div className="xl:col-span-2 space-y-8">
          
          <Section title="Student Information" icon={<User className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              
              {/* Identity Column */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                   <Shield className="w-3.5 h-3.5 text-indigo-400" />
                   <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Identity</span>
                </div>
                
                <ReadOnlyField label="Admission No" value={student.admission_number} />
                <EditableInput label="Roll Number" value={student.roll_number} edit={editMode} onChange={(v)=>setStudent({...student, roll_number:v})} icon={<Hash className="w-3.5 h-3.5" />} />
                <EditableInput label="Full Name" value={student.full_name} edit={editMode} onChange={(v)=>setStudent({...student, full_name:v})} icon={<User className="w-3.5 h-3.5" />} />
                <div className="grid grid-cols-2 gap-4">
                   <EditableInput label="Gender" value={student.gender} edit={editMode} onChange={(v)=>setStudent({...student, gender:v})} />
                   <EditableInput label="DOB" type="date" value={student.dob} edit={editMode} onChange={(v)=>setStudent({...student, dob:v})} />
                </div>
              </div>

              {/* Academic Column */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                   <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                   <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Academic</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <EditableInput label="Class" value={student.class} edit={editMode} onChange={(v)=>setStudent({...student, class:v})} />
                   <EditableInput label="Section" value={student.section} edit={editMode} onChange={(v)=>setStudent({...student, section:v})} />
                </div>
                <EditableInput label="Academic Year" value={student.academic_year} edit={editMode} onChange={(v)=>setStudent({...student, academic_year:v})} icon={<Calendar className="w-3.5 h-3.5" />} />
                <ReadOnlyField label="Admission Date" value={student.admission_date} />
                
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase text-zinc-500">Status</span>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${student.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                      {student.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {student.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Address Details" icon={<MapPin className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <EditableTextarea label="Current Address" value={student.current_address} edit={editMode} onChange={(v)=>setStudent({...student, current_address:v})} />
               <EditableTextarea label="Permanent Address" value={student.permanent_address} edit={editMode} onChange={(v)=>setStudent({...student, permanent_address:v})} />
            </div>
          </Section>
        </div>

        {/* --- RIGHT COLUMN: GUARDIANS & FEES --- */}
        <div className="space-y-8">
          
          <Section 
            title="Guardians" 
            icon={<Users className="w-4 h-4" />} 
            action={
              <button 
                onClick={() => { setEditingGuardian(null); setShowGuardianModal(true); }} 
                className="text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-lg border border-indigo-500/20 font-bold tracking-wide transition-all"
              >
                + ADD
              </button>
            }
          >
            <div className="space-y-4">
              {guardians.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-500 bg-black/20 rounded-2xl border border-white/5 border-dashed">
                   <Users className="w-8 h-8 opacity-20 mb-2" />
                   <p className="text-xs">No guardians added yet.</p>
                </div>
              )}
              {guardians.map((g) => (
                <div key={g.id} className="relative group bg-black/20 hover:bg-black/40 border border-white/5 rounded-2xl p-4 transition-all hover:border-white/10 hover:shadow-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-sm font-bold text-zinc-400 uppercase">{g.type[0]}</div>
                      <div>
                        <p className="text-sm font-bold text-white">{g.name}</p>
                        <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider bg-indigo-500/10 px-1.5 py-0.5 rounded inline-block mt-1">{g.type}</p>
                      </div>
                    </div>
                    <button onClick={() => { setEditingGuardian(g); setGuardianForm({ type: g.type, name: g.name, email: g.email, phone: g.phone, occupation: g.occupation }); setShowGuardianModal(true); }} className="p-2 bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="mt-4 space-y-2 pt-3 border-t border-white/5">
                    {g.phone && <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono"><Phone className="w-3.5 h-3.5 text-zinc-600" /> {g.phone}</div>}
                    {g.email && <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono truncate"><Mail className="w-3.5 h-3.5 text-zinc-600" /> {g.email}</div>}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Fee History" icon={<Wallet className="w-4 h-4" />}>
            {studentFees.length === 0 ? (
               <div className="text-center py-8 text-zinc-500 text-xs bg-black/20 rounded-2xl border border-white/5 border-dashed">No fee records found</div>
            ) : (
              <div className="space-y-2">
                {studentFees.slice(0, 5).map((f) => (
                  <div key={f.fee_month} className="group flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-8 rounded-full ${f.status === 'paid' ? 'bg-emerald-500' : f.status === 'partial' ? 'bg-amber-500' : 'bg-red-500'} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
                      <div>
                        <p className="text-xs font-bold text-white uppercase">{f.fee_month}</p>
                        <p className={`text-[10px] uppercase font-bold tracking-wider ${f.status === 'paid' ? 'text-emerald-500' : f.status === 'partial' ? 'text-amber-500' : 'text-red-500'}`}>{f.status}</p>
                      </div>
                    </div>
                    <p className="text-sm font-mono font-bold text-zinc-300">₹{f.paid_amount}</p>
                  </div>
                ))}
                <button className="w-full py-2 text-[10px] font-bold text-zinc-500 uppercase hover:text-white transition-colors mt-2">View All Transactions</button>
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* --- GUARDIAN MODAL --- */}
      {showGuardianModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-white/5 p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">{editingGuardian ? 'Edit Guardian' : 'Add Guardian'}</h2>
              <button onClick={() => setShowGuardianModal(false)} className="text-zinc-500 hover:text-white transition-transform hover:rotate-90"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Relation</label>
                <div className="relative">
                  <select className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-indigo-500 outline-none appearance-none font-medium" value={guardianForm.type} onChange={(e)=>setGuardianForm({...guardianForm,type:e.target.value as any})}><option value="father">Father</option><option value="mother">Mother</option><option value="other">Other</option></select>
                  <div className="absolute right-4 top-3.5 pointer-events-none text-zinc-500"><Users className="w-4 h-4"/></div>
                </div>
              </div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Full Name</label><input className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-indigo-500 outline-none font-medium" placeholder="e.g. John Doe" value={guardianForm.name} onChange={(e)=>setGuardianForm({...guardianForm,name:e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5"><label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Phone</label><input className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-indigo-500 outline-none font-medium" placeholder="987..." value={guardianForm.phone ?? ''} onChange={(e)=>setGuardianForm({...guardianForm,phone:e.target.value})} /></div>
                 <div className="space-y-1.5"><label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Occupation</label><input className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-indigo-500 outline-none font-medium" placeholder="Job" value={guardianForm.occupation ?? ''} onChange={(e)=>setGuardianForm({...guardianForm,occupation:e.target.value})} /></div>
              </div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Email</label><input className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-indigo-500 outline-none font-medium" placeholder="mail@example.com" value={guardianForm.email ?? ''} onChange={(e)=>setGuardianForm({...guardianForm,email:e.target.value})} /></div>
              <div className="flex gap-3 pt-4">
                <button onClick={()=>setShowGuardianModal(false)} className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">Cancel</button>
                <button onClick={saveGuardian} className="flex-1 px-4 py-3 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-colors">Save Details</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   UI HELPERS (Strictly Typed)
========================= */

function Section({ title, icon, children, action, className }: SectionProps) {
  return (
    <div className={`bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-6 md:p-8 rounded-[32px] relative shadow-2xl flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
         <div className="flex items-center gap-3">
           <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-zinc-400">{icon}</div>
           <h2 className="text-sm font-bold uppercase tracking-widest text-white">{title}</h2>
         </div>
         {action}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function ReadOnlyField({ label, value }: FieldProps) {
  return (
    <div className="group space-y-1.5">
      <span className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1.5 group-hover:text-zinc-300 transition-colors">
        {label}
      </span>
      <div className="text-sm text-white font-medium pl-3 border-l-2 border-white/10 py-1 truncate">
        {value ?? <span className="text-zinc-600 italic">Not set</span>}
      </div>
    </div>
  );
}

function EditableInput({ label, value, edit, onChange, type = 'text', icon }: InputProps) {
  return (
    <div className="group space-y-1.5">
      <span className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1.5 group-hover:text-indigo-400 transition-colors">
        {icon} {label}
      </span>
      {edit ? (
        <input
          type={type}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:bg-black/60 outline-none transition-all font-medium"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="text-sm text-zinc-200 font-medium pl-3 border-l-2 border-white/10 py-1 truncate">
          {value ?? <span className="text-zinc-600 italic">Not set</span>}
        </div>
      )}
    </div>
  );
}

function EditableTextarea({ label, value, edit, onChange }: TextareaProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1.5">
        <MapPin className="w-3 h-3" /> {label}
      </span>
      {edit ? (
        <textarea
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-all min-h-[100px] leading-relaxed"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="text-sm text-zinc-400 leading-relaxed bg-black/20 p-4 rounded-2xl border border-white/5 min-h-[80px]">
          {value ?? <span className="text-zinc-600 italic">No address provided.</span>}
        </div>
      )}
    </div>
  );
}