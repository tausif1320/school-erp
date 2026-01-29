'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Calendar, Phone, Briefcase, BookOpen, 
  User, Users, CheckCircle2, Clock, MapPin, Loader2, Edit3, Save,
  GraduationCap, Mail, ShieldCheck, AlertCircle
} from 'lucide-react';

/* =========================
   TYPES
========================= */
type Attendance = {
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
};

type Teacher = {
  id: string;
  full_name: string;
  designation: string;
  subject: string;
  phone: string;
  join_date: string;
  status: string;
  gender: string;
  dob: string;
  father_name: string;
  mother_name: string;
  husband_name: string;
  current_address: string;
  permanent_address: string;
  email: string;
};

/* =========================
   HELPER: TIME FORMATTER (FIXED)
========================= */
const formatTime = (dateString: string | null) => {
  if (!dateString) return '-';
  
  // 1. Handle "27-Jan-2026 06:30:46 PM"
  const parts = dateString.split(' ');
  if (parts.length >= 3) {
     const timePart = parts[1]; // "06:30:46"
     const ampm = parts[2];     // "PM"
     return `${timePart.slice(0, 5)} ${ampm}`;
  }

  // 2. Handle ISO strings
  if (dateString.includes('T')) {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  return dateString;
};

/* =========================
   COMPONENT
========================= */
export default function TeacherDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const teacherId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  /* --- LOGIC: LOAD DATA --- */
  useEffect(() => {
    if (!teacherId) return;

    async function loadData() {
        const [teachRes, attRes] = await Promise.all([
            supabase.from('teachers').select('*').eq('id', teacherId).single(),
            supabase.from('view_teacher_attendance_ist').select('date, status, check_in_ist, check_out_ist').eq('teacher_id', teacherId).order('date', { ascending: false })
        ]);

        if (teachRes.error) { toast.error('Failed to load teacher'); setLoading(false); return; }
        
        setTeacher(teachRes.data);
        
        const formattedAtt = attRes.data?.map((item: any) => ({
            date: item.date,
            status: item.status,
            check_in: item.check_in_ist,
            check_out: item.check_out_ist
        })) || [];
        setAttendance(formattedAtt);
        setLoading(false);
    }
    loadData();
  }, [teacherId]);

  /* --- LOGIC: UPDATE TEACHER --- */
  async function saveTeacher() {
    if (!teacher) return;
    setSaving(true);

    const { error } = await supabase
      .from('teachers')
      .update({
        full_name: teacher.full_name,
        designation: teacher.designation,
        subject: teacher.subject,
        phone: teacher.phone,
        join_date: teacher.join_date,
        gender: teacher.gender,
        dob: teacher.dob,
        father_name: teacher.father_name,
        mother_name: teacher.mother_name,
        husband_name: teacher.husband_name,
        current_address: teacher.current_address,
        permanent_address: teacher.permanent_address,
      })
      .eq('id', teacher.id);

    if (error) { toast.error('Failed to update profile'); } 
    else { toast.success('Profile updated successfully'); setEditMode(false); }
    setSaving(false);
  }

  /* --- UI RENDER --- */
  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-zinc-500 text-sm font-medium animate-pulse">Loading Faculty Profile...</p>
    </div>
  );

  if (!teacher) return null;

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
                <span className="text-4xl font-bold text-zinc-600">{teacher.full_name[0]}</span>
              </div>
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-zinc-950 ${teacher.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            </div>

            <div>
              {editMode ? (
                <input 
                  className="text-3xl md:text-4xl font-bold text-white bg-black/40 border border-white/10 rounded-xl px-3 py-1 w-full max-w-md focus:border-indigo-500 outline-none transition-all"
                  value={teacher.full_name}
                  onChange={(e) => setTeacher(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                />
              ) : (
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{teacher.full_name}</h1>
              )}
              
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" /> {teacher.designation || 'Faculty'}
                </span>
                <span className="px-3 py-1 rounded-lg bg-zinc-800/50 text-zinc-400 border border-white/5 text-xs font-medium flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" /> {teacher.subject || 'General'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => editMode ? saveTeacher() : setEditMode(true)}
            disabled={saving}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95
              ${editMode 
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20' 
                : 'bg-white hover:bg-zinc-200 text-black shadow-white/10'}
            `}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editMode ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {editMode ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* --- LEFT COLUMN --- */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* PERSONAL INFO CARD */}
          <Section title="Personal Information" icon={<User className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              
              {/* Professional */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                   <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                   <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Professional</span>
                </div>
                
                <EditableItem label="Full Name" value={teacher.full_name} edit={editMode} onChange={(v: string) => setTeacher(prev => prev ? {...prev, full_name: v} : null)} icon={<User className="w-3.5 h-3.5" />} />
                <EditableItem label="Designation" value={teacher.designation} edit={editMode} onChange={(v: string) => setTeacher(prev => prev ? {...prev, designation: v} : null)} icon={<Briefcase className="w-3.5 h-3.5" />} />
                <div className="grid grid-cols-2 gap-4">
                   <EditableItem label="Subject" value={teacher.subject} edit={editMode} onChange={(v: string) => setTeacher(prev => prev ? {...prev, subject: v} : null)} />
                   <EditableItem label="Phone" value={teacher.phone} edit={editMode} onChange={(v: string) => setTeacher(prev => prev ? {...prev, phone: v} : null)} />
                </div>
                <EditableItem label="Join Date" type="date" value={teacher.join_date} edit={editMode} onChange={(v: string) => setTeacher(prev => prev ? {...prev, join_date: v} : null)} icon={<Calendar className="w-3.5 h-3.5" />} />
              </div>

              {/* Personal */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                   <Users className="w-3.5 h-3.5 text-emerald-400" />
                   <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Background</span>
                </div>

                <EditableItem label="Father's Name" value={teacher.father_name} edit={editMode} onChange={(v: string) => setTeacher(prev => prev ? {...prev, father_name: v} : null)} />
                <EditableItem label="Mother's Name" value={teacher.mother_name} edit={editMode} onChange={(v: string) => setTeacher(prev => prev ? {...prev, mother_name: v} : null)} />
                <EditableItem label="Husband's Name" value={teacher.husband_name} edit={editMode} onChange={(v: string) => setTeacher(prev => prev ? {...prev, husband_name: v} : null)} />
                <div className="grid grid-cols-2 gap-4">
                   <EditableItem label="Gender" value={teacher.gender} edit={editMode} onChange={(v: string) => setTeacher(prev => prev ? {...prev, gender: v} : null)} />
                   <EditableItem label="DOB" type="date" value={teacher.dob} edit={editMode} onChange={(v: string) => setTeacher(prev => prev ? {...prev, dob: v} : null)} />
                </div>
              </div>
            </div>
          </Section>

          {/* ADDRESS CARD */}
          <Section title="Contact Details" icon={<MapPin className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <EditableTextarea label="Current Address" value={teacher.current_address} edit={editMode} onChange={(v: string) => setTeacher(prev => prev ? {...prev, current_address: v} : null)} />
              <EditableTextarea label="Permanent Address" value={teacher.permanent_address} edit={editMode} onChange={(v: string) => setTeacher(prev => prev ? {...prev, permanent_address: v} : null)} />
            </div>
          </Section>
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="space-y-8">
          
          {/* ATTENDANCE CARD */}
          <Section 
            title="Attendance History" 
            icon={<Clock className="w-4 h-4" />}
            action={<span className="text-[10px] font-bold bg-white/5 px-2 py-1 rounded text-zinc-400">{attendance.length} Records</span>}
          >
            {attendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-zinc-500 space-y-2 py-10 bg-black/20 rounded-2xl border border-white/5 border-dashed">
                <Calendar className="w-8 h-8 opacity-20" />
                <p className="text-xs">No records found.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/20">
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] font-bold text-zinc-500 uppercase bg-white/5 border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">In</th>
                        <th className="px-4 py-3">Out</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {attendance.map((a, i) => (
                        <tr key={i} className="group hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 font-medium text-zinc-300 font-mono text-xs">{a.date}</td>
                          <td className="px-4 py-3 text-emerald-400 font-mono text-xs">{formatTime(a.check_in)}</td>
                          <td className="px-4 py-3 text-amber-400 font-mono text-xs">{formatTime(a.check_out)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                              a.status === 'present' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {a.status.substring(0, 1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Section>

        </div>
      </div>
    </div>
  );
}

/* =========================
   UI HELPERS (Strictly Typed)
========================= */

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

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

interface EditableItemProps {
  label: string;
  value: string | null;
  edit: boolean;
  onChange: (val: string) => void;
  icon?: React.ReactNode;
  type?: string;
}

function EditableItem({ label, value, edit, onChange, icon, type = 'text' }: EditableItemProps) {
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-1.5 text-zinc-500 group-hover:text-indigo-400 transition-colors">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      {edit ? (
        <input 
          type={type}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:bg-black/60 outline-none transition-all"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="pl-6 text-sm text-white font-medium border-l-2 border-white/10 ml-1.5 py-0.5">
          {value || <span className="text-zinc-600 italic">N/A</span>}
        </div>
      )}
    </div>
  );
}

interface EditableTextareaProps {
  label: string;
  value: string | null;
  edit: boolean;
  onChange: (val: string) => void;
}

function EditableTextarea({ label, value, edit, onChange }: EditableTextareaProps) {
  return (
    <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col h-full">
      <span className="text-[10px] font-bold uppercase text-zinc-500 mb-2 block">{label}</span>
      {edit ? (
        <textarea 
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:bg-black/60 outline-none transition-all min-h-[80px]"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <p className="text-sm text-zinc-300 leading-relaxed">
          {value || <span className="text-zinc-600 italic">No address provided.</span>}
        </p>
      )}
    </div>
  );
}