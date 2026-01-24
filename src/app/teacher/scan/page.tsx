'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '@/lib/supabase';
import { nowIST, todayIST } from '@/lib/time';
import toast from 'react-hot-toast';

export default function TeacherScanPage() {
  const router = useRouter();
  const qrRef = useRef<Html5Qrcode | null>(null);

  const [cameraId, setCameraId] = useState('');
  const [cameras, setCameras] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);

  /* =========================
     LOAD CAMERAS
  ========================= */
  useEffect(() => {
    Html5Qrcode.getCameras().then((devices) => {
      setCameras(devices);
      if (devices.length > 0) {
        setCameraId(devices[devices.length - 1].id); // back camera
      }
    });
  }, []);

  /* =========================
     START SCAN
  ========================= */
  async function startScan() {
    if (!cameraId) {
      toast.error('Camera not available');
      return;
    }

    qrRef.current = new Html5Qrcode('qr-reader');
    setScanning(true);

    await qrRef.current.start(
      cameraId,
      { fps: 10, qrbox: 260 },
      async (decodedText) => {
        await stopScan();
        await handleScan(decodedText.trim());
      },
      () => {}
    );
  }

  async function stopScan() {
    if (qrRef.current) {
      await qrRef.current.stop().catch(() => {});
      qrRef.current.clear();
      qrRef.current = null;
    }
    setScanning(false);
  }

  /* =========================
     HANDLE SCAN
  ========================= */
  async function handleScan(token: string) {
    try {
      // 1️⃣ Validate QR
      const { data: qr } = await supabase
        .from('qr_sessions')
        .select('expires_at')
        .eq('token', token)
        .single();

      if (!qr) {
        toast.error('Invalid QR');
        return;
      }

      if (new Date(qr.expires_at) < new Date()) {
        toast.error('QR expired');
        return;
      }

      // 2️⃣ Get logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Not logged in');
        return;
      }

      // 3️⃣ Find teacher
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!teacher) {
        toast.error('Teacher profile not found');
        return;
      }

      const today = todayIST();

      // 4️⃣ Check existing attendance
      const { data: existing } = await supabase
        .from('teacher_attendance')
        .select('check_in, check_out')
        .eq('teacher_id', teacher.id)
        .eq('date', today)
        .maybeSingle();

      // ❌ Already checked in and not checked out
      if (existing?.check_in && !existing.check_out) {
        toast.error('Already checked in');
        return;
      }

      // 5️⃣ Check-in
      if (!existing) {
        await supabase.from('teacher_attendance').insert({
          teacher_id: teacher.id,
          date: today,
          check_in: nowIST(),
          status: 'present',
        });

        toast.success('Check-in successful');
        router.push('/teacher/dashboard');
        return;
      }

      // 6️⃣ Check-out
      if (existing.check_in && !existing.check_out) {
        await supabase
          .from('teacher_attendance')
          .update({ check_out: nowIST() })
          .eq('teacher_id', teacher.id)
          .eq('date', today);

        toast.success('Check-out successful');
        router.push('/teacher/dashboard');
        return;
      }
    } catch (err) {
      console.error(err);
      toast.error('Scan failed');
    }
  }

  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-semibold">Scan Attendance QR</h1>

      <select
        className="bg-zinc-800 p-2 rounded w-72"
        value={cameraId}
        onChange={(e) => setCameraId(e.target.value)}
      >
        {cameras.map((cam) => (
          <option key={cam.id} value={cam.id}>
            {cam.label || 'Camera'}
          </option>
        ))}
      </select>

      <div
        id="qr-reader"
        className="w-72 h-72 bg-black rounded-xl border border-zinc-700"
      />

      {!scanning ? (
        <button
          onClick={startScan}
          className="px-6 py-2 bg-green-600 rounded"
        >
          Start Scan
        </button>
      ) : (
        <button
          onClick={stopScan}
          className="px-6 py-2 bg-red-600 rounded"
        >
          Stop Scan
        </button>
      )}
    </div>
  );
}
