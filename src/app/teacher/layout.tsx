'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      toast.error('Please login first');
      router.replace('/auth/login');
      return;
    }

    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/auth/login');
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-zinc-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* TOP NAV */}
      <nav className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex gap-6">
          <button
            onClick={() => router.push('/teacher/dashboard')}
            className="hover:text-blue-400"
          >
            Dashboard
          </button>

          <button
            onClick={() => router.push('/teacher/scan')}
            className="hover:text-blue-400"
          >
            Scan QR
          </button>
        </div>

        <button
          onClick={logout}
          className="px-4 py-1 bg-red-600 rounded text-sm"
        >
          Logout
        </button>
      </nav>

      {/* PAGE CONTENT */}
      <main className="p-6">{children}</main>
    </div>
  );
}
