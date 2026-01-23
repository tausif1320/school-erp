'use client';

import { useRouter } from 'next/navigation';

export default function RoleSelect() {
  const router = useRouter();

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
