'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        toast.error('Invalid or expired invite link');
        router.replace('/auth/login');
      }
    });
  }, []);

  async function submit() {
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Password set successfully');
    router.replace('/teacher/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="bg-zinc-900 p-6 rounded-xl w-96">
        <h1 className="text-xl mb-4">Set Your Password</h1>

        <input
          type="password"
          className="w-full p-2 bg-zinc-800 rounded mb-4"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-green-600 py-2 rounded"
        >
          {loading ? 'Saving...' : 'Set Password'}
        </button>
      </div>
    </div>
  );
}
