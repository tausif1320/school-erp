'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

/* =========================
   DISTANCE UTILS
========================= */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function TeacherScanPage() {
  const router = useRouter();
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => toast.error('Location permission required'),
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    if (!gps) return;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(
      async (text) => {
        scanner.clear();
        await handleScan(text, gps.lat, gps.lng);
      },
      () => {}
    );
  }, [gps]);

  async function handleScan(text: string, userLat: number, userLng: number) {
    try {
      const parts = text.split('|');
      if (parts.length !== 6) {
        toast.error('Invalid QR');
        return;
      }

      const [, date, latStr, lngStr, radiusStr, signature] = parts;
      const today = new Date().toISOString().slice(0, 10);
      const secret = process.env.NEXT_PUBLIC_QR_SECRET!;

      const expected = btoa(
        `${date}|${latStr}|${lngStr}|${radiusStr}|${secret}`
      );

      if (date !== today || signature !== expected) {
        toast.error('QR expired or invalid');
        return;
      }

      let qrLat = Number(latStr);
      let qrLng = Number(lngStr);

      // AUTO-FIX swapped coords
      if (Math.abs(qrLat) > 90) {
        const t = qrLat;
        qrLat = qrLng;
        qrLng = t;
      }

      const distance = getDistance(userLat, userLng, qrLat, qrLng);
      const radius = Number(radiusStr);

      if (distance > radius) {
        toast.error(`Outside premises (${Math.round(distance)}m away)`);
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

      const { data: existing } = await supabase
        .from('teacher_attendance')
        .select('id')
        .eq('teacher_id', teacher.id)
        .eq('date', today)
        .maybeSingle();

      if (existing) {
        toast.error('Already checked in');
        return;
      }

      await supabase.from('teacher_attendance').insert({
        teacher_id: teacher.id,
        date: today,
        check_in: new Date().toISOString(),
        status: 'present',
      });

      toast.success('Attendance marked');
      router.push('/teacher/dashboard');
    } catch (e) {
      console.error(e);
      toast.error('Scan failed');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-xl mb-4">Scan Attendance QR</h1>
      {!gps && <p>Waiting for location permission…</p>}
      <div id="qr-reader" className="w-72" />
    </div>
  );
}
