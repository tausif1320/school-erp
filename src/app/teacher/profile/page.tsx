'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { 
  User, Mail, Phone, Calendar, MapPin, Briefcase, 
  BookOpen, Star, Clock, Save, X, Edit3, Loader2 
} from 'lucide-react';

/* =========================
   UI HELPER COMPONENTS
========================= */
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-xl transition-all hover:border-white/10">
      <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
          {icon}
        </div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children}
      </div>
    </div>
  );
}

function FieldGroup({ label, icon, name, value, onChange, edit, type = 'text', locked = false, placeholder }: any) {
  return (
    <div className="space-y-1.5 group">
      <label className="text-xs text-zinc-500 font-bold ml-1 uppercase flex items-center gap-1 group-hover:text-zinc-400 transition-colors">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-white transition-colors pointer-events-none">
          {icon}
        </div>
        
        {edit && !locked ? (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`
              w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 
              text-sm text-white focus:border-indigo-500 focus:bg-black/60 outline-none 
              transition-all placeholder:text-zinc-700 font-medium
              ${type === 'date' ? '[color-scheme:dark]' : ''}
            `}
          />
        ) : (
          <div className="w-full bg-white/5 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 font-medium cursor-default">
            {value || <span className="text-zinc-600 italic">Not provided</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function SelectGroup({ label, icon, name, value, onChange, edit, options }: any) {
  return (
    <div className="space-y-1.5 group">
      <label className="text-xs text-zinc-500 font-bold ml-1 uppercase flex items-center gap-1 group-hover:text-zinc-400 transition-colors">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-white transition-colors pointer-events-none">
          {icon}
        </div>
        
        {edit ? (
          <select
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-indigo-500 focus:bg-black/60 outline-none transition-all appearance-none cursor-pointer"
          >
            {options.map((opt: string) => (
              <option key={opt} value={opt} className="bg-zinc-900">{opt}</option>
            ))}
          </select>
        ) : (
          <div className="w-full bg-white/5 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 font-medium cursor-default capitalize">
            {value}
          </div>
        )}
      </div>
    </div>
  );
}

function TextAreaGroup({ label, icon, name, value, onChange, edit, placeholder }: any) {
  return (
    <div className="space-y-1.5 md:col-span-2 group">
      <label className="text-xs text-zinc-500 font-bold ml-1 uppercase flex items-center gap-1 group-hover:text-zinc-400 transition-colors">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-white transition-colors pointer-events-none">
          {icon}
        </div>
        
        {edit ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-indigo-500 focus:bg-black/60 outline-none transition-all placeholder:text-zinc-700 font-medium min-h-[100px] resize-none"
          />
        ) : (
          <div className="w-full bg-white/5 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 font-medium cursor-default min-h-[100px]">
            {value || <span className="text-zinc-600 italic">Not provided</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================
   MAIN COMPONENT
========================= */
export default function TeacherProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', gender: 'Male', dob: '',
    current_address: '', permanent_address: '',
    father_name: '', mother_name: '', husband_name: '',
    designation: '', subject: '', experience: '', join_date: '',
  });

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/auth/login');

      const { data } = await supabase.from('teachers').select('*').eq('user_id', user.id).single();
      if (data) {
        setFormData({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          gender: data.gender || 'Male',
          dob: data.dob || '',
          current_address: data.current_address || '',
          permanent_address: data.permanent_address || '',
          father_name: data.father_name || '',
          mother_name: data.mother_name || '',
          husband_name: data.husband_name || '',
          designation: data.designation || '',
          subject: data.subject || '',
          experience: data.experience || '',
          join_date: data.join_date || '',
        });
      }
      setLoading(false);
    }
    fetchProfile();
  }, [router]);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('teachers').update(formData).eq('user_id', user.id);
    
    if (error) toast.error('Failed to update profile');
    else {
      toast.success('Profile updated successfully');
      setIsEditing(false);
    }
    setSaving(false);
  }

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-zinc-500 text-sm animate-pulse font-medium">Loading Profile...</p>
    </div>
  );

  return (
    <div className="animate-fade-in-up pb-24 md:pb-10 max-w-5xl mx-auto space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Profile</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage your personal information and academic records</p>
        </div>

        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
          >
            <Edit3 className="w-4 h-4 text-indigo-400" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => setIsEditing(false)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl font-medium transition-colors"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* SECTION 1: PERSONAL & CONTACT */}
        <Section title="Personal Information" icon={<User className="w-5 h-5" />}>
          <FieldGroup 
            label="Full Name" name="full_name" value={formData.full_name} 
            onChange={handleChange} edit={isEditing} icon={<User className="w-4 h-4" />} 
          />
          <FieldGroup 
            label="Email Address" name="email" value={formData.email} 
            onChange={handleChange} edit={false} locked icon={<Mail className="w-4 h-4" />} 
          />
          <FieldGroup 
            label="Phone Number" name="phone" value={formData.phone} 
            onChange={handleChange} edit={isEditing} icon={<Phone className="w-4 h-4" />} 
          />
          <SelectGroup 
            label="Gender" name="gender" value={formData.gender} 
            onChange={handleChange} edit={isEditing} icon={<User className="w-4 h-4" />}
            options={['Male', 'Female', 'Other']}
          />
          <FieldGroup 
            label="Date of Birth" name="dob" value={formData.dob} 
            onChange={handleChange} edit={isEditing} type="date" icon={<Calendar className="w-4 h-4" />} 
          />
        </Section>

        {/* SECTION 2: PROFESSIONAL */}
        <Section title="Professional Details" icon={<Briefcase className="w-5 h-5" />}>
          <FieldGroup 
            label="Designation" name="designation" value={formData.designation} 
            onChange={handleChange} edit={isEditing} icon={<Briefcase className="w-4 h-4" />} 
          />
          <FieldGroup 
            label="Subject Specialization" name="subject" value={formData.subject} 
            onChange={handleChange} edit={isEditing} icon={<BookOpen className="w-4 h-4" />} 
          />
          <FieldGroup 
            label="Experience (Years)" name="experience" value={formData.experience} 
            onChange={handleChange} edit={isEditing} type="number" icon={<Star className="w-4 h-4" />} 
          />
          <FieldGroup 
            label="Joining Date" name="join_date" value={formData.join_date} 
            onChange={handleChange} edit={isEditing} type="date" icon={<Clock className="w-4 h-4" />} 
          />
        </Section>

        {/* SECTION 3: FAMILY */}
        <Section title="Family Details" icon={<User className="w-5 h-5" />}>
          <FieldGroup 
            label="Father's Name" name="father_name" value={formData.father_name} 
            onChange={handleChange} edit={isEditing} icon={<User className="w-4 h-4" />} 
          />
          <FieldGroup 
            label="Mother's Name" name="mother_name" value={formData.mother_name} 
            onChange={handleChange} edit={isEditing} icon={<User className="w-4 h-4" />} 
          />
          <FieldGroup 
            label="Spouse Name" name="husband_name" value={formData.husband_name} 
            onChange={handleChange} edit={isEditing} icon={<User className="w-4 h-4" />} 
          />
        </Section>

        {/* SECTION 4: ADDRESS */}
        <Section title="Address Information" icon={<MapPin className="w-5 h-5" />}>
          <TextAreaGroup 
            label="Current Address" name="current_address" value={formData.current_address} 
            onChange={handleChange} edit={isEditing} icon={<MapPin className="w-4 h-4" />}
            placeholder="Enter full current address..."
          />
          <TextAreaGroup 
            label="Permanent Address" name="permanent_address" value={formData.permanent_address} 
            onChange={handleChange} edit={isEditing} icon={<MapPin className="w-4 h-4" />}
            placeholder="Enter full permanent address..."
          />
        </Section>

      </div>
    </div>
  );
}