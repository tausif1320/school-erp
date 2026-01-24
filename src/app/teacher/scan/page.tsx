'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function TeacherScanPage() {
  const router = useRouter();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => startScanner(pos.coords.latitude, pos.coords.longitude),
      () => toast.error('Location permission required')
    );
  }, []);

  function startScanner(userLat: number, userLng: number) {
    const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false);

    scanner.render(async (text) => {
      scanner.clear();
      await handleScan(text, userLat, userLng);
    },
  () => {
    
  });
  }

  async function handleScan(text: string, userLat: number, userLng: number) {
    try {
      const parts = text.split('|');
      if (parts.length !== 6) {
        toast.error('Invalid QR');
        return;
      }

      const [, date, lat, lng, radius, signature] = parts;
      const today = new Date().toISOString().slice(0, 10);
      const secret = process.env.NEXT_PUBLIC_QR_SECRET!;

      const expected = btoa(`${date}|${lat}|${lng}|${radius}|${secret}`);

      if (date !== today || signature !== expected) {
        toast.error('QR expired or invalid');
        return;
      }

      const distance = getDistance(
        userLat,
        userLng,
        Number(lat),
        Number(lng)
      );

      if (distance > Number(radius)) {
        toast.error('You are outside school premises');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not logged in');
        return;
      }

      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!teacher) {
        toast.error('Teacher not found');
        return;
      }

      const todayDate = today;

      const { data: existing } = await supabase
        .from('teacher_attendance')
        .select('id')
        .eq('teacher_id', teacher.id)
        .eq('date', todayDate)
        .maybeSingle();

      if (existing) {
        toast.error('Already checked in');
        return;
      }

      await supabase.from('teacher_attendance').insert({
        teacher_id: teacher.id,
        date: todayDate,
        check_in: new Date().toISOString(),
        status: 'present',
      });

      toast.success('Attendance marked');
      router.push('/teacher/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Scan failed');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-xl mb-4">Scan Attendance QR</h1>
      <div id="qr-reader" className="w-72" />
    </div>
  );
}
