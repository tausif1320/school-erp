'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function TeacherProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Initial state matches your DB columns
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
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      toast.error('Could not load profile');
      return;
    }

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully!');
    }
  }

  if (loading) return <div className="p-8 text-center">Loading Profile...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Edit Profile</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow border space-y-6">
        
        {/* Section: Personal Info */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Full Name</label>
              <input name="full_name" value={formData.full_name} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Email</label>
              <input name="email" value={formData.email} onChange={handleChange} className="w-full border p-2 rounded bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Phone</label>
              <input name="phone" value={formData.phone} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border p-2 rounded">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Date of Birth</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
          </div>
        </div>

        {/* Section: Professional Info */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Professional Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Designation</label>
              <input name="designation" value={formData.designation} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Subject</label>
              <input name="subject" value={formData.subject} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Experience (Years)</label>
              <input name="experience" value={formData.experience} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Join Date</label>
              <input type="date" name="join_date" value={formData.join_date} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
          </div>
        </div>

        {/* Section: Family & Address */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Family & Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input name="father_name" placeholder="Father Name" value={formData.father_name} onChange={handleChange} className="border p-2 rounded" />
            <input name="mother_name" placeholder="Mother Name" value={formData.mother_name} onChange={handleChange} className="border p-2 rounded" />
            <input name="husband_name" placeholder="Spouse Name" value={formData.husband_name} onChange={handleChange} className="border p-2 rounded" />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <textarea name="current_address" placeholder="Current Address" value={formData.current_address} onChange={handleChange} className="border p-2 rounded h-20" />
            <textarea name="permanent_address" placeholder="Permanent Address" value={formData.permanent_address} onChange={handleChange} className="border p-2 rounded h-20" />
          </div>
        </div>

        <button 
          disabled={saving}
          type="submit" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 w-full md:w-auto font-medium"
        >
          {saving ? 'Saving...' : 'Save Profile Changes'}
        </button>

      </form>
    </div>
  );
}