'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AddTeacherPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    user_email: '',
    full_name: '',
    gender: '',
    designation: '',
    subject: '',
    dob: '',
    father_name: '',
    mother_name: '',
    husband_name: '',
    join_date: '',
    phone: '',
    experience: '',
    current_address: '',
    permanent_address: '',
  });

  async function handleSubmit() {
    if (!form.user_email || !form.full_name || !form.join_date) {
      toast.error('Email, Name and Join Date are required');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-teacher`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) {
        const msg = await res.text();
        toast.error(msg || 'Failed to add teacher');
        setLoading(false);
        return;
      }

      toast.success('Teacher added successfully');

      // small delay so user sees success message
      setTimeout(() => {
        router.push('/admin/teachers');
      }, 1200);
    } catch (err) {
      toast.error('Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl mb-4">Add Teacher</h1>

      <div className="grid grid-cols-2 gap-4 bg-zinc-900 p-6 rounded-xl">

        <input
          placeholder="Teacher Email"
          className="p-2 bg-zinc-800 rounded col-span-2"
          value={form.user_email}
          onChange={e => setForm({ ...form, user_email: e.target.value })}
        />

        <input
          placeholder="Full Name"
          className="p-2 bg-zinc-800 rounded"
          value={form.full_name}
          onChange={e => setForm({ ...form, full_name: e.target.value })}
        />

        <input
          placeholder="Gender"
          className="p-2 bg-zinc-800 rounded"
          value={form.gender}
          onChange={e => setForm({ ...form, gender: e.target.value })}
        />

        <input
          placeholder="Designation"
          className="p-2 bg-zinc-800 rounded"
          value={form.designation}
          onChange={e => setForm({ ...form, designation: e.target.value })}
        />

        <input
          placeholder="Subject"
          className="p-2 bg-zinc-800 rounded"
          value={form.subject}
          onChange={e => setForm({ ...form, subject: e.target.value })}
        />

        <input
          type="date"
          className="p-2 bg-zinc-800 rounded"
          value={form.dob}
          onChange={e => setForm({ ...form, dob: e.target.value })}
        />

        <input
          placeholder="Father Name"
          className="p-2 bg-zinc-800 rounded"
          value={form.father_name}
          onChange={e => setForm({ ...form, father_name: e.target.value })}
        />

        <input
          placeholder="Mother Name"
          className="p-2 bg-zinc-800 rounded"
          value={form.mother_name}
          onChange={e => setForm({ ...form, mother_name: e.target.value })}
        />

        <input
          placeholder="Husband Name (optional)"
          className="p-2 bg-zinc-800 rounded"
          value={form.husband_name}
          onChange={e => setForm({ ...form, husband_name: e.target.value })}
        />

        <input
          type="date"
          className="p-2 bg-zinc-800 rounded"
          value={form.join_date}
          onChange={e => setForm({ ...form, join_date: e.target.value })}
        />

        <input
          placeholder="Phone"
          className="p-2 bg-zinc-800 rounded"
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
        />

        <input
          type="number"
          placeholder="Experience (years)"
          className="p-2 bg-zinc-800 rounded"
          value={form.experience}
          onChange={e => setForm({ ...form, experience: e.target.value })}
        />

        <textarea
          placeholder="Current Address"
          className="p-2 bg-zinc-800 rounded col-span-2"
          value={form.current_address}
          onChange={e =>
            setForm({ ...form, current_address: e.target.value })
          }
        />

        <textarea
          placeholder="Permanent Address"
          className="p-2 bg-zinc-800 rounded col-span-2"
          value={form.permanent_address}
          onChange={e =>
            setForm({ ...form, permanent_address: e.target.value })
          }
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`py-2 rounded col-span-2 ${
            loading
              ? 'bg-zinc-700 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {loading ? 'Saving...' : 'Save Teacher'}
        </button>
      </div>
    </div>
  );
}
