'use client';

import { Html5Qrcode } from 'html5-qrcode';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function TeacherScanPage() {
  const qrRef = useRef<Html5Qrcode | null>(null);
  const router = useRouter();

  async function handleScan(raw: string) {
    let payload: { type: string; issuedAt: number };

    try {
      payload = JSON.parse(raw);
    } catch {
      toast.error('Invalid QR');
      return;
    }

    if (payload.type !== 'teacher_attendance') {
      toast.error('Invalid QR');
      return;
    }

    if (Date.now() - payload.issuedAt > 2 * 60 * 1000) {
      toast.error('QR expired');
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error('Not logged in');
      return;
    }

    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', auth.user.id)
      .single();

    if (!teacher) {
      toast.error('Teacher profile not found');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const { data: existing } = await supabase
      .from('teacher_attendance')
      .select('*')
      .eq('teacher_id', teacher.id)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      toast.error('Already checked in');
      return;
    }

    const { error } = await supabase.from('teacher_attendance').insert({
      teacher_id: teacher.id,
      date: today,
      check_in: new Date().toISOString(),
      status: 'present',
    });

    if (error) {
      toast.error('Failed to check in');
      return;
    }

    toast.success('Checked in successfully');
    router.push('/teacher/dashboard');
  }

  useEffect(() => {
    qrRef.current = new Html5Qrcode('qr-reader');

    qrRef.current.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 250 },
      async (text) => {
        await qrRef.current?.stop();
        await handleScan(text);
      },
      () => {}
    );

    return () => {
      qrRef.current?.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="flex justify-center mt-20">
      <div id="qr-reader" className="w-72" />
    </div>
  );
}
