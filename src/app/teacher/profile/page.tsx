'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { 
  User, Phone, Calendar, MapPin, Briefcase, 
  BookOpen, Clock, Save, Edit3, Loader2, Users, ShieldCheck, Mail,
  Sparkles, Fingerprint, ArrowUpRight
} from 'lucide-react';

/* =========================
   TYPES & HELPERS
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

  async function saveChanges() {
    if (!teacher) return;
    setSaving(true);

    const { error } = await supabase.from('teachers').update({
        full_name: teacher.full_name,
        phone: teacher.phone,
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

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--';
    const parts = dateString.split(' ');
    if (parts.length >= 3) {
       return `${parts[1].slice(0, 5)} ${parts[2]}`;
    }
    if (dateString.includes('T')) {
      return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return dateString;
  };

  if (loading) return (
    <div className="h-[90vh] flex flex-col items-center justify-center bg-zinc-950 relative overflow-hidden">
        {/* --- LOADING BACKGROUND --- */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-zinc-500 text-xs font-mono uppercase tracking-widest animate-pulse">Authenticating Identity...</p>
        </div>
    </div>
  );

  if (!teacher) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 pb-20 selection:bg-indigo-500/30 overflow-hidden relative">
      
      {/* --- PREMIUM BACKGROUND SYSTEM --- */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:30px_30px] md:bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-[100px] animate-pulse-slow pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[100px] animate-pulse-slow delay-1000 pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay z-0"></div>

      <div className="relative z-10 max-w-[1400px] mx-auto p-4 md:p-8 lg:p-12">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Verified Faculty</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">My Profile</h1>
            <p className="text-zinc-500 mt-2 text-sm max-w-md">Manage your personal information, view employment records, and track attendance history.</p>
          </div>
          
          <button
            onClick={() => editMode ? saveChanges() : setEditMode(true)}
            disabled={saving}
            className={`
              group relative overflow-hidden rounded-xl px-8 py-3 font-bold text-sm transition-all duration-200
              active:scale-95 active:shadow-inner touch-manipulation
              ${editMode 
                ? 'bg-white text-black hover:bg-zinc-200' 
                : 'bg-zinc-900 border border-white/10 hover:border-white/30 text-white active:bg-zinc-800'}
            `}
          >
            <div className="relative z-10 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editMode ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {editMode ? 'Save Changes' : 'Edit Information'}
            </div>
            {!editMode && <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full group-active:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-24">
              
              {/* ID CARD */}
              <div className="relative overflow-hidden rounded-[32px] bg-white/5 border border-white/10 p-1 shadow-2xl backdrop-blur-md">
                <div className="relative bg-zinc-950/50 rounded-[28px] p-8 flex flex-col items-center text-center border border-white/5">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group">
                      <span className="text-5xl font-bold text-zinc-600 group-hover:text-zinc-400 transition-colors select-none">{teacher.full_name[0]}</span>
                    </div>
                    <div className="absolute -bottom-3 -right-3 bg-zinc-950 rounded-xl px-3 py-1 border border-white/10 flex items-center gap-1.5 shadow-lg">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] font-bold text-white uppercase">{teacher.status}</span>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-white tracking-tight mb-1">{teacher.full_name}</h2>
                  <p className="text-sm text-indigo-400 font-medium mb-6">{teacher.designation}</p>

                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5 hover:bg-white/10 transition-colors">
                      <BookOpen className="w-4 h-4 text-zinc-500 mb-2 mx-auto" />
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Subject</p>
                      <p className="text-sm font-medium text-white">{teacher.subject}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5 hover:bg-white/10 transition-colors">
                      <Calendar className="w-4 h-4 text-zinc-500 mb-2 mx-auto" />
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Joined</p>
                      <p className="text-sm font-medium text-white">{new Date(teacher.join_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric'})}</p>
                    </div>
                  </div>

                  <div className="mt-6 w-full pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                      <span className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Email</span>
                      <span className="text-white truncate max-w-[150px]">{teacher.email}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="flex items-center gap-2"><Fingerprint className="w-3.5 h-3.5" /> ID</span>
                      <span className="font-mono text-zinc-500">#{teacher.id.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Contact Card */}
              <div className="mt-6 bg-zinc-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Contact Info</h3>
                <EditableInput label="Phone Number" value={teacher.phone} edit={editMode} onChange={(v) => setTeacher({...teacher, phone: v})} icon={<Phone className="w-3.5 h-3.5" />} />
              </div>

            </div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. PERSONAL & FAMILY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-[32px] hover:bg-zinc-900/50 transition-colors backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-full bg-indigo-500/10 text-indigo-400"><User className="w-4 h-4" /></div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Personal</h3>
                </div>
                <div className="space-y-5">
                  <EditableInput label="Gender" value={teacher.gender} edit={editMode} onChange={(v) => setTeacher({...teacher, gender: v})} icon={<Users className="w-3.5 h-3.5" />} />
                  <EditableInput label="Date of Birth" type="date" value={teacher.dob} edit={editMode} onChange={(v) => setTeacher({...teacher, dob: v})} icon={<Calendar className="w-3.5 h-3.5" />} />
                  <EditableInput label="Current Role" value={teacher.designation} locked edit={false} onChange={()=>{}} icon={<Briefcase className="w-3.5 h-3.5" />} />
                </div>
              </div>

              <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-[32px] hover:bg-zinc-900/50 transition-colors backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-full bg-pink-500/10 text-pink-400"><Users className="w-4 h-4" /></div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Family</h3>
                </div>
                <div className="space-y-5">
                  <EditableInput label="Father's Name" value={teacher.father_name} edit={editMode} onChange={(v) => setTeacher({...teacher, father_name: v})} icon={<User className="w-3.5 h-3.5" />} />
                  <EditableInput label="Mother's Name" value={teacher.mother_name} edit={editMode} onChange={(v) => setTeacher({...teacher, mother_name: v})} icon={<User className="w-3.5 h-3.5" />} />
                  <EditableInput label="Spouse's Name" value={teacher.husband_name} edit={editMode} onChange={(v) => setTeacher({...teacher, husband_name: v})} icon={<User className="w-3.5 h-3.5" />} />
                </div>
              </div>
            </div>

            {/* 2. ADDRESS */}
            <div className="bg-zinc-900/30 border border-white/5 p-6 md:p-8 rounded-[32px] backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-400"><MapPin className="w-4 h-4" /></div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Residency</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <EditableTextarea label="Current Address" value={teacher.current_address} edit={editMode} onChange={(v) => setTeacher({...teacher, current_address: v})} />
                <EditableTextarea label="Permanent Address" value={teacher.permanent_address} edit={editMode} onChange={(v) => setTeacher({...teacher, permanent_address: v})} />
              </div>
            </div>

            {/* 3. ATTENDANCE TIMELINE */}
            <div className="bg-zinc-900/30 border border-white/5 p-6 md:p-8 rounded-[32px] backdrop-blur-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-500/10 text-amber-400"><Clock className="w-4 h-4" /></div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Recent Activity</h3>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  Last 30 Days
                </div>
              </div>

              {attendance.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">No records found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attendance.slice(0, 5).map((a, i) => (
                    <div key={i} className="group flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${a.status === 'present' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {new Date(a.date).getDate()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{new Date(a.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long' })}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${a.status === 'present' ? 'text-emerald-500' : 'text-red-500'}`}>{a.status}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center justify-end gap-2 text-xs text-zinc-400 font-mono">
                          <span>IN</span> <span className="text-white bg-white/5 px-2 py-0.5 rounded border border-white/5">{formatTime(a.check_in)}</span>
                        </div>
                        <div className="flex items-center justify-end gap-2 text-xs text-zinc-400 font-mono">
                          <span>OUT</span> <span className="text-white bg-white/5 px-2 py-0.5 rounded border border-white/5">{formatTime(a.check_out)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-3 mt-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest flex items-center justify-center gap-1 group">
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

function EditableInput({ label, value, edit, onChange, type = 'text', icon, locked = false }: { label: string; value: string | null; edit: boolean; onChange: (v: string) => void; icon: React.ReactNode; type?: string; locked?: boolean }) {
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-2 text-zinc-500">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-zinc-300 transition-colors">{label}</span>
      </div>
      {edit && !locked ? (
        <input 
          type={type}
          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all font-medium placeholder:text-zinc-700"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="text-sm text-zinc-200 font-medium pl-1 py-1 border-b border-white/5 truncate">
          {value || <span className="text-zinc-700 italic">Not set</span>}
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
        <div className="text-sm text-zinc-400 leading-relaxed bg-black/40 p-5 rounded-2xl border border-white/5 min-h-[100px]">
          {value || <span className="text-zinc-700 italic">No address provided.</span>}
        </div>
      )}
    </div>
  );
}