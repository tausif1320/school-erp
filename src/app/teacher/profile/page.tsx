'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Calendar, MapPin, Briefcase, Book, Clock } from 'lucide-react';

export default function TeacherProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    gender: 'male',
    dob: '',
    current_address: '',
    permanent_address: '',
    father_name: '',
    mother_name: '',
    husband_name: '',
    designation: '',
    subject: '',
    experience: '',
    join_date: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/login');

    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setFormData({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        gender: data.gender || 'male',
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

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('teachers')
      .update(formData)
      .eq('user_id', user.id);

    setSaving(false);
    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success('Profile updated');
      setIsEditing(false); // Return to view mode
    }
  }

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-zinc-400 text-sm mt-1">Manage your personal and academic details</p>
          </div>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* FORM / VIEW */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SECTION 1: BASIC DETAILS */}
          <Section title="Personal Information" icon={<User className="w-5 h-5 text-blue-500" />}>
            <Grid>
              <Field label="Full Name" name="full_name" val={formData.full_name} edit={isEditing} onChange={handleChange} />
              <Field label="Email" name="email" val={formData.email} edit={false} onChange={handleChange} locked />
              <Field label="Phone" name="phone" val={formData.phone} edit={isEditing} onChange={handleChange} />
              
              {isEditing ? (
                <div className="space-y-1">
                  <label className="text-xs uppercase text-zinc-500 font-semibold tracking-wider">Gender</label>
                  <select 
                    name="gender" 
                    value={formData.gender} 
                    onChange={handleChange}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-white focus:border-blue-500 outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              ) : (
                <Field label="Gender" name="gender" val={formData.gender} edit={false} onChange={handleChange} />
              )}
              
              <Field label="Date of Birth" name="dob" val={formData.dob} edit={isEditing} type="date" onChange={handleChange} />
            </Grid>
          </Section>

          {/* SECTION 2: PROFESSIONAL */}
          <Section title="Professional Details" icon={<Briefcase className="w-5 h-5 text-purple-500" />}>
            <Grid>
              <Field label="Designation" name="designation" val={formData.designation} edit={isEditing} onChange={handleChange} />
              <Field label="Subject" name="subject" val={formData.subject} edit={isEditing} onChange={handleChange} />
              <Field label="Experience (Years)" name="experience" val={formData.experience} edit={isEditing} onChange={handleChange} />
              <Field label="Join Date" name="join_date" val={formData.join_date} edit={isEditing} type="date" onChange={handleChange} />
            </Grid>
          </Section>

          {/* SECTION 3: FAMILY & ADDRESS */}
          <Section title="Family & Address" icon={<MapPin className="w-5 h-5 text-green-500" />}>
            <Grid cols={3}>
              <Field label="Father's Name" name="father_name" val={formData.father_name} edit={isEditing} onChange={handleChange} />
              <Field label="Mother's Name" name="mother_name" val={formData.mother_name} edit={isEditing} onChange={handleChange} />
              <Field label="Spouse Name" name="husband_name" val={formData.husband_name} edit={isEditing} onChange={handleChange} />
            </Grid>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <TextArea label="Current Address" name="current_address" val={formData.current_address} edit={isEditing} onChange={handleChange} />
              <TextArea label="Permanent Address" name="permanent_address" val={formData.permanent_address} edit={isEditing} onChange={handleChange} />
            </div>
          </Section>

          {/* ACTIONS */}
          {isEditing && (
            <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition text-zinc-300"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}

// --- UI COMPONENTS FOR DARK THEME ---

function Section({ title, icon, children }: any) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
      <div className="flex items-center gap-2 mb-6">
        {icon}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Grid({ children, cols = 2 }: any) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-6`}>
      {children}
    </div>
  );
}

function Field({ label, name, val, edit, onChange, type = "text", locked = false }: any) {
  return (
    <div className="space-y-1">
      <label className="text-xs uppercase text-zinc-500 font-semibold tracking-wider">{label}</label>
      {edit && !locked ? (
        <input 
          type={type} 
          name={name} 
          value={val} 
          onChange={onChange}
          className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
        />
      ) : (
        <p className="p-3 bg-zinc-900/30 border border-transparent border-b-zinc-800 text-zinc-200 min-h-[46px] flex items-center">
          {val || <span className="text-zinc-600 italic">Not set</span>}
        </p>
      )}
    </div>
  );
}

function TextArea({ label, name, val, edit, onChange }: any) {
  return (
    <div className="space-y-1">
      <label className="text-xs uppercase text-zinc-500 font-semibold tracking-wider">{label}</label>
      {edit ? (
        <textarea 
          name={name} 
          value={val} 
          onChange={onChange}
          className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-white h-24 focus:border-blue-500 outline-none transition resize-none"
        />
      ) : (
        <p className="p-3 bg-zinc-900/30 border border-transparent border-b-zinc-800 text-zinc-200 h-24 overflow-auto">
          {val || <span className="text-zinc-600 italic">Not set</span>}
        </p>
      )}
    </div>
  );
}