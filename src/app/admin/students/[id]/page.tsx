'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Edit3, Save, User, MapPin, Users, Wallet, 
  Phone, Mail, Briefcase, GraduationCap, Calendar, Hash, Shield, X, 
  UserCircle
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
    loadStudent();
    loadGuardians();
    loadStudentFees();
  }, [id]);

  async function loadStudent() {
    const { data, error } = await supabase.from('students').select('*').eq('id', id).single();
    if (error) { console.error(error); router.push('/admin/students'); return; }
    setStudent(data);
    setLoading(false);
  }

  async function loadStudentFees() {
    const { data } = await supabase.from('fee_records').select('fee_month, total_amount, paid_amount, status').eq('student_id', id).order('fee_month', { ascending: false });
    setStudentFees(data ?? []);
  }

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
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-zinc-500 text-sm animate-pulse">Fetching Profile...</p>
    </div>
  );
  
  if (!student) return null;

  return (
    <div className="animate-fade-in-up pb-20 md:pb-10 max-w-7xl mx-auto space-y-6">
      
      {/* HERO HEADER */}
      <div className="relative bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden p-6 md:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button onClick={() => router.back()} className="group p-3 bg-black/20 hover:bg-white/10 rounded-2xl border border-white/5 transition-all">
              <ArrowLeft className="w-5 h-5 text-zinc-400 group-hover:text-white" />
            </button>
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl">
                <UserCircle className="w-10 h-10 text-zinc-500" />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-zinc-900 ${student.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">{student.full_name}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">Class {student.class}-{student.section || 'A'}</span>
                <span className="text-zinc-500 flex items-center gap-1.5 font-mono"><Hash className="w-3.5 h-3.5" /> {student.admission_number}</span>
              </div>
            </div>
          </div>
          <button onClick={() => editMode ? handleUpdateStudent() : setEditMode(true)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-xl ${editMode ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}>
            {editMode ? <><Save className="w-4 h-4" /> Save Changes</> : <><Edit3 className="w-4 h-4" /> Edit Profile</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="xl:col-span-2 space-y-6">
          <Section title="Student Information" icon={<User className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Identity</h3>
                <ReadOnlyField label="Admission No" value={student.admission_number} icon={<Hash className="w-3.5 h-3.5" />} />
                <EditableInput label="Roll Number" value={student.roll_number} edit={editMode} onChange={(v)=>setStudent({...student, roll_number:v})} icon={<Hash className="w-3.5 h-3.5" />} />
                <EditableInput label="Full Name" value={student.full_name} edit={editMode} onChange={(v)=>setStudent({...student, full_name:v})} icon={<User className="w-3.5 h-3.5" />} />
                <EditableInput label="Gender" value={student.gender} edit={editMode} onChange={(v)=>setStudent({...student, gender:v})} icon={<User className="w-3.5 h-3.5" />} />
                <EditableInput label="Date of Birth" type="date" value={student.dob} edit={editMode} onChange={(v)=>setStudent({...student, dob:v})} icon={<Calendar className="w-3.5 h-3.5" />} />
              </div>
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Academic</h3>
                <EditableInput label="Class" value={student.class} edit={editMode} onChange={(v)=>setStudent({...student, class:v})} icon={<GraduationCap className="w-3.5 h-3.5" />} />
                <EditableInput label="Section" value={student.section} edit={editMode} onChange={(v)=>setStudent({...student, section:v})} icon={<Users className="w-3.5 h-3.5" />} />
                <EditableInput label="Academic Year" value={student.academic_year} edit={editMode} onChange={(v)=>setStudent({...student, academic_year:v})} icon={<Calendar className="w-3.5 h-3.5" />} />
                <ReadOnlyField label="Admission Date" value={student.admission_date} icon={<Calendar className="w-3.5 h-3.5" />} />
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase text-zinc-500 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Status</span>
                  <span className={`self-start px-2.5 py-1 rounded text-[11px] font-bold border ${student.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{student.status.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Address Details" icon={<MapPin className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <EditableTextarea label="Current Address" value={student.current_address} edit={editMode} onChange={(v)=>setStudent({...student, current_address:v})} />
               <EditableTextarea label="Permanent Address" value={student.permanent_address} edit={editMode} onChange={(v)=>setStudent({...student, permanent_address:v})} />
            </div>
          </Section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <Section title="Guardians" icon={<Users className="w-4 h-4" />} action={<button onClick={() => { setEditingGuardian(null); setShowGuardianModal(true); }} className="text-[10px] bg-white/5 hover:bg-white/10 text-zinc-300 px-3 py-1.5 rounded-lg border border-white/5 font-medium transition-colors">+ ADD NEW</button>}>
            <div className="space-y-3">
              {guardians.length === 0 && <p className="text-zinc-500 text-xs text-center py-4 bg-black/20 rounded-xl">No guardians listed.</p>}
              {guardians.map((g) => (
                <div key={g.id} className="relative group bg-zinc-950/50 border border-white/5 rounded-xl p-4 transition-all hover:border-indigo-500/30">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 uppercase">{g.type[0]}</div>
                      <div><p className="text-sm font-semibold text-white">{g.name}</p><p className="text-[10px] uppercase font-bold text-indigo-400">{g.type}</p></div>
                    </div>
                    <button onClick={() => { setEditingGuardian(g); setGuardianForm({ type: g.type, name: g.name, email: g.email, phone: g.phone, occupation: g.occupation }); setShowGuardianModal(true); }} className="text-zinc-600 hover:text-white transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="mt-3 space-y-1.5 pt-3 border-t border-white/5">
                    {g.phone && <div className="flex items-center gap-2 text-xs text-zinc-400"><Phone className="w-3 h-3" /> {g.phone}</div>}
                    {g.email && <div className="flex items-center gap-2 text-xs text-zinc-400 truncate"><Mail className="w-3 h-3" /> {g.email}</div>}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Fee Status" icon={<Wallet className="w-4 h-4" />}>
            {studentFees.length === 0 ? <div className="text-center py-6 text-zinc-500 text-xs bg-black/20 rounded-xl">No transactions found</div> : (
              <div className="space-y-2">
                {studentFees.slice(0, 5).map((f) => (
                  <div key={f.fee_month} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${f.status === 'paid' ? 'bg-emerald-500' : f.status === 'partial' ? 'bg-amber-500' : 'bg-red-500'}`} />
                      <div><p className="text-xs font-medium text-white">{f.fee_month}</p><p className="text-[10px] text-zinc-500 uppercase">{f.status}</p></div>
                    </div>
                    <p className="text-sm font-mono text-zinc-300">₹{f.paid_amount}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* MODAL */}
      {showGuardianModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-white/5 p-5 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">{editingGuardian ? 'Edit Guardian' : 'Add Guardian'}</h2>
              <button onClick={() => setShowGuardianModal(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5"><label className="text-xs text-zinc-400 font-bold ml-1">RELATION</label><select className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:border-indigo-500 outline-none" value={guardianForm.type} onChange={(e)=>setGuardianForm({...guardianForm,type:e.target.value as any})}><option value="father">Father</option><option value="mother">Mother</option><option value="other">Other</option></select></div>
              <div className="space-y-1.5"><label className="text-xs text-zinc-400 font-bold ml-1">FULL NAME</label><input className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:border-indigo-500 outline-none" placeholder="e.g. John Doe" value={guardianForm.name} onChange={(e)=>setGuardianForm({...guardianForm,name:e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1.5"><label className="text-xs text-zinc-400 font-bold ml-1">PHONE</label><input className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:border-indigo-500 outline-none" placeholder="98765..." value={guardianForm.phone ?? ''} onChange={(e)=>setGuardianForm({...guardianForm,phone:e.target.value})} /></div>
                 <div className="space-y-1.5"><label className="text-xs text-zinc-400 font-bold ml-1">OCCUPATION</label><input className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:border-indigo-500 outline-none" placeholder="Job" value={guardianForm.occupation ?? ''} onChange={(e)=>setGuardianForm({...guardianForm,occupation:e.target.value})} /></div>
              </div>
              <div className="space-y-1.5"><label className="text-xs text-zinc-400 font-bold ml-1">EMAIL</label><input className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:border-indigo-500 outline-none" placeholder="mail@example.com" value={guardianForm.email ?? ''} onChange={(e)=>setGuardianForm({...guardianForm,email:e.target.value})} /></div>
              <div className="flex gap-3 pt-3">
                <button onClick={()=>setShowGuardianModal(false)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-xl text-sm font-bold transition-colors">CANCEL</button>
                <button onClick={saveGuardian} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg transition-colors">SAVE</button>
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
    <div className={`bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-6 rounded-3xl relative shadow-xl flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-2.5">
           <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">{icon}</div>
           <h2 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h2>
         </div>
         {action}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function ReadOnlyField({ label, value, icon }: FieldProps) {
  return (
    <div className="group">
      <span className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1.5 mb-1 group-hover:text-indigo-400 transition-colors">
        {label}
      </span>
      <div className="text-sm text-zinc-200 font-medium pl-2 border-l-2 border-white/10 py-0.5 truncate">
        {value ?? <span className="text-zinc-700 italic">N/A</span>}
      </div>
    </div>
  );
}

function EditableInput({ label, value, edit, onChange, type = 'text' }: InputProps) {
  return (
    <div className="group">
      <span className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1.5 mb-1 group-hover:text-indigo-400 transition-colors">
        {label}
      </span>
      {edit ? (
        <input
          type={type}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:bg-black/60 outline-none transition-all"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="text-sm text-zinc-200 font-medium pl-2 border-l-2 border-white/10 py-0.5 truncate">
          {value ?? <span className="text-zinc-700 italic">N/A</span>}
        </div>
      )}
    </div>
  );
}

function EditableTextarea({ label, value, edit, onChange }: TextareaProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1.5">
        <MapPin className="w-3 h-3" /> {label}
      </span>
      {edit ? (
        <textarea
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none transition-all min-h-[80px]"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="text-sm text-zinc-400 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5 min-h-[60px]">
          {value ?? <span className="text-zinc-700 italic">No address provided.</span>}
        </div>
      )}
    </div>
  );
}