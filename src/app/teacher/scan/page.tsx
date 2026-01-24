'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function TeacherScanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(
      async (decodedText) => {
        scanner.clear();
        await handleScan(decodedText);
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  async function handleScan(token: string) {
    try {
      setLoading(true);

      // 1️⃣ Validate QR
      const { data: qr, error: qrError } = await supabase
        .from('qr_sessions')
        .select('*')
        .eq('token', token)
        .single();

      if (qrError || !qr) {
        toast.error('Invalid QR');
        return;
      }

      if (new Date(qr.expires_at) < new Date()) {
        toast.error('QR expired');
        return;
      }

      // 2️⃣ Get logged-in teacher
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!teacher) {
        toast.error('Teacher profile not found');
        return;
      }

      const today = new Date().toISOString().slice(0, 10);

      // 3️⃣ Check existing attendance
      const { data: existing } = await supabase
        .from('teacher_attendance')
        .select('*')
        .eq('teacher_id', teacher.id)
        .eq('date', today)
        .maybeSingle();

      if (existing?.check_in) {
        toast.error('Already checked in');
        return;
      }

      // 4️⃣ Insert attendance
      await supabase.from('teacher_attendance').upsert({
        teacher_id: teacher.id,
        date: today,
        check_in: new Date().toISOString(),
        status: 'present',
      });

      toast.success('Check-in successful');
      router.push('/teacher/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Check-in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-xl mb-4">Scan QR</h1>

      {loading && <p className="text-zinc-400">Validating QR…</p>}

      <div id="qr-reader" className="w-72" />
    </div>
  );
}
