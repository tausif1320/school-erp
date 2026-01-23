'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RoleSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const type = searchParams.get('type');

    // 🔐 ONLY redirect invite/reset users
    if (type === 'invite' || type === 'recovery') {
      router.replace('/auth/set-password');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center gap-10">
      <button
        onClick={() => router.push('/auth/login?role=admin')}
        className="px-10 py-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition"
      >
        Admin
      </button>

      <button
        onClick={() => router.push('/auth/login?role=teacher')}
        className="px-10 py-6 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition"
      >
        Teacher
      </button>
    </div>
  );
}
