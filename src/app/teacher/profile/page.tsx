'use client';

import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  Calendar, Phone, Briefcase, BookOpen, 
  User, Users, CheckCircle2, Clock, Shield, MapPin, Loader2, Edit3, Save
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
   COMPONENT
========================= */
export default function TeacherDetailsPage() {
  const router = useRouter();
  const params = useParams();
  
  const teacherId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: Edit State
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  /* --- LOGIC: LOAD DATA --- */
  async function loadTeacher(id: string) {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error('Failed to load teacher');
      setLoading(false);
      return;
    }
    setTeacher(data);
  }

  async function loadAttendance(id: string) {
    const { data, error } = await supabase
      .from('view_teacher_attendance_ist')
      .select('date, status, check_in_ist, check_out_ist')
      .eq('teacher_id', id)
      .order('date', { ascending: false });

    if (error) {
      toast.error('Failed to load attendance');
      return;
    }

    const formattedData = data?.map((item: any) => ({
      date: item.date,
      status: item.status,
      check_in: item.check_in_ist,
      check_out: item.check_out_ist
    })) || [];

    setAttendance(formattedData);
  }

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

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Teacher profile updated');
      setEditMode(false);
    }
    setSaving(false);
  }

  useEffect(() => {
    if (!teacherId) {
      toast.error('Invalid teacher ID');
      setLoading(false);
      return;
    }

    Promise.all([
      loadTeacher(teacherId),
      loadAttendance(teacherId),
    ]).finally(() => setLoading(false));
  }, [teacherId]);

  /* --- UI RENDER --- */
  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-zinc-500 text-sm animate-pulse">Loading Profile...</p>
    </div>
  );

  if (!teacher) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-red-500/10 p-4 rounded-full mb-4"><Shield className="w-8 h-8 text-red-500" /></div>
      <h2 className="text-xl font-bold text-white">Teacher Not Found</h2>
      <button onClick={() => router.back()} className="mt-4 text-sm text-zinc-400 hover:text-white">Go Back</button>
    </div>
  );

  return (
    <div className="animate-fade-in-up pb-20 md:pb-10 max-w-7xl mx-auto space-y-6">
      
      {/* --- HERO PROFILE HEADER --- */}
      <div className="relative bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden p-6 md:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row items-start gap-6 w-full">
            
            {/* REMOVED BACK ARROW BUTTON HERE */}
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 flex-1">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-900/50 to-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl">
                  <span className="text-3xl font-bold text-indigo-400">{teacher.full_name[0]}</span>
                </div>
                <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-zinc-900 ${teacher.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </div>

              <div className="text-center md:text-left space-y-2 flex-1">
                {editMode ? (
                  <input 
                    className="text-3xl md:text-4xl font-bold text-white bg-black/40 border border-white/10 rounded-xl px-4 py-1 w-full max-w-md focus:border-indigo-500 outline-none"
                    value={teacher.full_name}
                    onChange={(e) => setTeacher({ ...teacher, full_name: e.target.value })}
                  />
                ) : (
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{teacher.full_name}</h1>
                )}
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> {teacher.designation || 'N/A'}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> {teacher.subject || 'N/A'}
                  </span>
                  <span className={`px-3 py-1 rounded-lg border text-sm font-medium flex items-center gap-2 ${teacher.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {teacher.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* EDIT BUTTON */}
          <button
            onClick={() => editMode ? saveTeacher() : setEditMode(true)}
            disabled={saving}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-xl whitespace-nowrap
              ${editMode 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20' 
                : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}
            `}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editMode ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {editMode ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* --- LEFT COLUMN --- */}
        <div className="space-y-6">
          
          {/* PROFESSIONAL DETAILS */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-xl">
            <div className="flex items-center gap-2.5 mb-6 border-b border-white/5 pb-4">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><User className="w-4 h-4" /></div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Professional Info</h2>
            </div>
            <div className="space-y-6">
              <EditableItem label="Phone Number" value={teacher.phone} edit={editMode} onChange={(v) => setTeacher({...teacher, phone: v})} icon={<Phone className="w-4 h-4" />} />
              <EditableItem label="Date of Joining" type="date" value={teacher.join_date} edit={editMode} onChange={(v) => setTeacher({...teacher, join_date: v})} icon={<Calendar className="w-4 h-4" />} />
              <EditableItem label="Subject Expert" value={teacher.subject} edit={editMode} onChange={(v) => setTeacher({...teacher, subject: v})} icon={<BookOpen className="w-4 h-4" />} />
              <EditableItem label="Current Role" value={teacher.designation} edit={editMode} onChange={(v) => setTeacher({...teacher, designation: v})} icon={<Briefcase className="w-4 h-4" />} />
            </div>
          </div>

          {/* FAMILY BACKGROUND */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-xl">
            <div className="flex items-center gap-2.5 mb-6 border-b border-white/5 pb-4">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400"><Users className="w-4 h-4" /></div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Family Background</h2>
            </div>
            <div className="space-y-6">
              <EditableItem label="Father's Name" value={teacher.father_name} edit={editMode} onChange={(v) => setTeacher({...teacher, father_name: v})} icon={<User className="w-4 h-4" />} />
              <EditableItem label="Mother's Name" value={teacher.mother_name} edit={editMode} onChange={(v) => setTeacher({...teacher, mother_name: v})} icon={<User className="w-4 h-4" />} />
              <EditableItem label="Husband's Name" value={teacher.husband_name} edit={editMode} onChange={(v) => setTeacher({...teacher, husband_name: v})} icon={<User className="w-4 h-4" />} />
              <EditableItem label="Date of Birth" type="date" value={teacher.dob} edit={editMode} onChange={(v) => setTeacher({...teacher, dob: v})} icon={<Calendar className="w-4 h-4" />} />
              <EditableItem label="Gender" value={teacher.gender} edit={editMode} onChange={(v) => setTeacher({...teacher, gender: v})} icon={<User className="w-4 h-4" />} />
            </div>
          </div>

        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* ADDRESS DETAILS */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-xl">
            <div className="flex items-center gap-2.5 mb-6 border-b border-white/5 pb-4">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><MapPin className="w-4 h-4" /></div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Contact Addresses</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EditableTextarea label="Current Address" value={teacher.current_address} edit={editMode} onChange={(v) => setTeacher({...teacher, current_address: v})} />
              <EditableTextarea label="Permanent Address" value={teacher.permanent_address} edit={editMode} onChange={(v) => setTeacher({...teacher, permanent_address: v})} />
            </div>
          </div>

          {/* ATTENDANCE HISTORY */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-xl min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><Clock className="w-4 h-4" /></div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Attendance History</h2>
              </div>
              <span className="text-xs text-zinc-500 font-medium bg-white/5 px-2 py-1 rounded-md">
                Total Records: {attendance.length}
              </span>
            </div>

            {attendance.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-2 py-10">
                <Calendar className="w-10 h-10 opacity-20" />
                <p className="text-sm">No attendance records found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar rounded-xl border border-white/5 bg-black/20">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-zinc-500 uppercase bg-white/5 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 font-bold">Date</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold">Check In</th>
                      <th className="px-6 py-4 font-bold">Check Out</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {attendance.map((a) => (
                      <tr key={a.date} className="group hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-white font-mono">{a.date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            a.status === 'present' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                          {a.check_in ? (
                            <span className="flex items-center gap-1.5 text-zinc-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              {a.check_in}
                            </span>
                          ) : (
                            <span className="opacity-50">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                           {a.check_out || <span className="opacity-50">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

/* =========================
   HELPER COMPONENTS
========================= */
function EditableItem({ label, value, edit, onChange, icon, type = 'text' }: { label: string; value: string | null; edit: boolean; onChange: (v: string) => void; icon: React.ReactNode; type?: string }) {
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

function EditableTextarea({ label, value, edit, onChange }: { label: string; value: string | null; edit: boolean; onChange: (v: string) => void }) {
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