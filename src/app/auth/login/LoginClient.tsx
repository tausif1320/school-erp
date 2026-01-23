'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function LoginClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const role = searchParams.get('role'); // admin / teacher

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      toast.error('Email and password required');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Login successful');

    if (role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/teacher/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-zinc-900 p-6 rounded-xl w-80 space-y-4">
        <h1 className="text-xl text-center">
          Login {role === 'admin' ? 'Admin' : 'Teacher'}
        </h1>

        <input
          placeholder="Email"
          className="w-full p-2 bg-zinc-800 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 bg-zinc-800 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-green-600 py-2 rounded"
        >
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </div>
    </div>
  );
}
