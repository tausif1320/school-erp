'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { 
  User, Phone, Calendar, MapPin, Briefcase, 
  BookOpen, Clock, Save, Edit3, Loader2, Users, ShieldCheck, Mail,
  ArrowUpRight
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
  email: string;
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
};

/* =========================
   MAIN COMPONENT
========================= */
export default function TeacherProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);

  /* --- LOAD DATA --- */
  useEffect(() => {
    async function initProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/auth/login'); return; }

      const { data: teacherData, error } = await supabase.from('teachers').select('*').eq('user_id', user.id).single();

      if (error || !teacherData) { toast.error('Profile not found'); return; }
      setTeacher(teacherData);

      const { data: attData } = await supabase.from('view_teacher_attendance_ist').select('date, status, check_in_ist, check_out_ist').eq('teacher_id', teacherData.id).order('date', { ascending: false });

      if (attData) {
        const formatted = attData.map((item: any) => ({
          date: item.date,
          status: item.status,
          check_in: item.check_in_ist,
          check_out: item.check_out_ist
        }));
        setAttendance(formatted);
      }
      setLoading(false);
    }
    initProfile();
  }, [router]);

  /* --- SAVE CHANGES --- */
  async function saveChanges() {
    if (!teacher) return;
    setSaving(true);

    const { error } = await supabase.from('teachers').update({
        full_name: teacher.full_name,
        phone: teacher.phone,
        designation: teacher.designation, 
        subject: teacher.subject,         
        join_date: teacher.join_date,     
        gender: teacher.gender,
        dob: teacher.dob,
        father_name: teacher.father_name,
        mother_name: teacher.mother_name,
        husband_name: teacher.husband_name,
        current_address: teacher.current_address,
        permanent_address: teacher.permanent_address,
      }).eq('id', teacher.id);

    if (error) { toast.error('Failed to update profile'); } 
    else { toast.success('Profile updated successfully'); setEditMode(false); }
    setSaving(false);
  }

  /* --- TIME FORMATTER --- */
  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--';
    const parts = dateString.split(' ');
    // Handle "27-Jan-2026 06:30:46 PM"
    if (parts.length >= 3) {
       return `${parts[1].slice(0, 5)} ${parts[2]}`;
    }
    // Handle ISO
    if (dateString.includes('T')) {
      return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return dateString;
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
      <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">Loading Profile...</p>
    </div>
  );

  if (!teacher) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 overflow-x-hidden selection:bg-emerald-500/30">
      
      <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active Faculty</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Teacher Profile</h1>
            <p className="text-zinc-500 text-sm mt-1">Personal information and employment records.</p>
          </div>
          
          <button
            onClick={() => editMode ? saveChanges() : setEditMode(true)}
            disabled={saving}
            className={`
              group relative overflow-hidden flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200
              active:scale-95 touch-manipulation
              ${editMode 
                ? 'bg-white text-black hover:bg-zinc-200' 
                : 'bg-zinc-900 border border-white/10 text-white hover:bg-zinc-800'}
            `}
          >
            <div className="relative z-10 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editMode ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {editMode ? 'Save Changes' : 'Edit Details'}
            </div>
            {/* Glossy Glow Effect (PC Only) */}
            {!editMode && <div className="hidden md:block absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- LEFT: IDENTITY CARD (SPECIAL BACKGROUND) --- */}
          <div className="lg:col-span-4 sticky top-8 space-y-6">
            
            {/* CARD CONTAINER */}
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 shadow-2xl">
              
              {/* --- BACKGROUND FROM TEACHER LOGIN PAGE (Confined to Card) --- */}
              <div className="absolute inset-0 bg-zinc-900 z-0" />
              <div className="absolute top-[-20%] left-[-20%] w-[120%] h-[120%] rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 opacity-20 blur-[80px] animate-pulse-slow z-0 pointer-events-none" />
              <div className="absolute bottom-[-20%] right-[-20%] w-[120%] h-[120%] rounded-full bg-blue-600 opacity-20 blur-[80px] animate-pulse-slow delay-1000 z-0 pointer-events-none" />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay z-0 pointer-events-none" />

              {/* CONTENT */}
              <div className="relative z-10 p-8 flex flex-col items-center text-center">
                
                {/* Avatar */}
                <div className="relative mb-6">
                  <div className="w-28 h-28 rounded-3xl bg-zinc-950/50 backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden shadow-2xl group">
                    <span className="text-5xl font-bold text-white/90 select-none">{teacher.full_name[0]}</span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-zinc-950 p-1.5 rounded-full border border-white/10 shadow-lg">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>

                {/* Name & Role */}
                <h2 className="text-xl font-bold text-white mb-1">{teacher.full_name}</h2>
                <p className="text-xs text-emerald-200 font-bold uppercase tracking-widest mb-6">{teacher.designation}</p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 w-full mb-6">
                  <div className="bg-zinc-950/40 rounded-2xl p-3 border border-white/10 backdrop-blur-sm">
                    <BookOpen className="w-4 h-4 text-emerald-200/70 mx-auto mb-1.5" />
                    <p className="text-[10px] text-emerald-200/70 font-bold uppercase tracking-wide">Subject</p>
                    <p className="text-xs font-medium text-white truncate">{teacher.subject}</p>
                  </div>
                  <div className="bg-zinc-950/40 rounded-2xl p-3 border border-white/10 backdrop-blur-sm">
                    <Calendar className="w-4 h-4 text-emerald-200/70 mx-auto mb-1.5" />
                    <p className="text-[10px] text-emerald-200/70 font-bold uppercase tracking-wide">Joined</p>
                    <p className="text-xs font-medium text-white">{new Date(teacher.join_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</p>
                  </div>
                </div>

                {/* Email Footer (Visible, Read-Only) */}
                <div className="w-full pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-emerald-100/80">
                  <Mail className="w-3.5 h-3.5" /> 
                  <span className="font-medium tracking-wide">{teacher.email}</span>
                </div>

              </div>
            </div>

            {/* Quick Contact Card (Standard Style) */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 hover:bg-zinc-900 transition-colors">
              <EditableItem label="Mobile Number" value={teacher.phone} edit={editMode} onChange={(v) => setTeacher({...teacher, phone: v})} icon={<Phone className="w-3.5 h-3.5" />} />
            </div>
          </div>

          {/* --- RIGHT: DETAILS & HISTORY (Interactive Cards) --- */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. INFO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Personal */}
              <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 transition-all duration-300 hover:bg-zinc-900 hover:border-white/10 hover:shadow-2xl active:scale-[0.98]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><User className="w-4 h-4" /></div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Personal</h3>
                </div>
                <div className="space-y-4">
                  <EditableItem label="Gender" value={teacher.gender} edit={editMode} onChange={(v) => setTeacher({...teacher, gender: v})} icon={<Users className="w-3.5 h-3.5" />} />
                  <EditableItem label="Date of Birth" type="date" value={teacher.dob} edit={editMode} onChange={(v) => setTeacher({...teacher, dob: v})} icon={<Calendar className="w-3.5 h-3.5" />} />
                  <EditableItem label="Current Role" value={teacher.designation} edit={editMode} onChange={(v) => setTeacher({...teacher, designation: v})} icon={<Briefcase className="w-3.5 h-3.5" />} />
                  <EditableItem label="Subject" value={teacher.subject} edit={editMode} onChange={(v) => setTeacher({...teacher, subject: v})} icon={<BookOpen className="w-3.5 h-3.5" />} />
                  <EditableItem label="Join Date" type="date" value={teacher.join_date} edit={editMode} onChange={(v) => setTeacher({...teacher, join_date: v})} icon={<Calendar className="w-3.5 h-3.5" />} />
                </div>
              </div>

              {/* Family */}
              <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 transition-all duration-300 hover:bg-zinc-900 hover:border-white/10 hover:shadow-2xl active:scale-[0.98]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400"><Users className="w-4 h-4" /></div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Family</h3>
                </div>
                <div className="space-y-4">
                  <EditableItem label="Father's Name" value={teacher.father_name} edit={editMode} onChange={(v) => setTeacher({...teacher, father_name: v})} icon={<User className="w-3.5 h-3.5" />} />
                  <EditableItem label="Mother's Name" value={teacher.mother_name} edit={editMode} onChange={(v) => setTeacher({...teacher, mother_name: v})} icon={<User className="w-3.5 h-3.5" />} />
                  <EditableItem label="Spouse's Name" value={teacher.husband_name} edit={editMode} onChange={(v) => setTeacher({...teacher, husband_name: v})} icon={<User className="w-3.5 h-3.5" />} />
                </div>
              </div>
            </div>

            {/* 2. ADDRESS */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 transition-all duration-300 hover:bg-zinc-900 hover:border-white/10 hover:shadow-2xl active:scale-[0.98]">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><MapPin className="w-4 h-4" /></div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Addresses</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EditableTextarea label="Current Address" value={teacher.current_address} edit={editMode} onChange={(v) => setTeacher({...teacher, current_address: v})} />
                <EditableTextarea label="Permanent Address" value={teacher.permanent_address} edit={editMode} onChange={(v) => setTeacher({...teacher, permanent_address: v})} />
              </div>
            </div>

            {/* 3. ATTENDANCE HISTORY */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 transition-all duration-300 hover:bg-zinc-900 hover:border-white/10 hover:shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><Clock className="w-4 h-4" /></div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Recent Activity</h3>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  Last 30 Days
                </div>
              </div>

              {attendance.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 border border-dashed border-white/10 rounded-2xl">
                  <p className="text-xs">No records found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attendance.slice(0, 5).map((a, i) => (
                    <div key={i} className="group flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 transition-all">
                      
                      {/* Left: Date Block */}
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border ${a.status === 'present' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-red-500/5 border-red-500/20 text-red-500'}`}>
                          {new Date(a.date).getDate()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{new Date(a.date).toLocaleDateString('en-US', { month: 'short', weekday: 'short' })}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${a.status === 'present' ? 'text-emerald-500' : 'text-red-500'}`}>{a.status}</p>
                        </div>
                      </div>

                      {/* Right: Times */}
                      <div className="text-right space-y-1.5 min-w-[120px]">
                        <div className="grid grid-cols-[25px_1fr] gap-3 items-center">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase text-left">IN</span>
                          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 text-center w-full block">
                            {formatTime(a.check_in)}
                          </span>
                        </div>
                        <div className="grid grid-cols-[25px_1fr] gap-3 items-center">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase text-left">OUT</span>
                          <span className="text-xs font-mono text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 text-center w-full block">
                            {formatTime(a.check_out)}
                          </span>
                        </div>
                      </div>

                    </div>
                  ))}
                  <button className="w-full py-4 mt-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest flex items-center justify-center gap-1 group">
                    View Full History <ArrowUpRight className="w-3 h-3 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   UI HELPERS
========================= */

function EditableItem({ label, value, edit, onChange, type = 'text', icon }: { label: string; value: string | null; edit: boolean; onChange: (v: string) => void; icon: React.ReactNode; type?: string }) {
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-2 text-zinc-500">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-zinc-300 transition-colors">{label}</span>
      </div>
      {edit ? (
        <input 
          type={type}
          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all font-medium placeholder:text-zinc-700"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="text-sm text-zinc-300 font-medium pl-1 py-1 border-b border-white/5 truncate h-[30px] flex items-center">
          {value || <span className="text-zinc-600 italic">Not set</span>}
        </div>
      )}
    </div>
  );
}

function EditableTextarea({ label, value, edit, onChange }: { label: string; value: string | null; edit: boolean; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col h-full">
      <span className="text-[10px] font-bold uppercase text-zinc-500 mb-3 tracking-widest">{label}</span>
      {edit ? (
        <textarea 
          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all min-h-[100px] resize-none leading-relaxed"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="text-sm text-zinc-400 leading-relaxed bg-black/20 p-5 rounded-2xl border border-white/5 min-h-[100px]">
          {value || <span className="text-zinc-700 italic">No address provided.</span>}
        </div>
      )}
    </div>
  );
}