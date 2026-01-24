'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '@/lib/supabase';
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
  (errorMessage) => {
    // Ignore scan errors (camera noise, partial scans)
    // Do NOT toast here or UX will be awful
  }
);


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
        .select('*')
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

      // 2️⃣ Auth user
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

      const today = new Date().toISOString().slice(0, 10);

      // 4️⃣ Prevent duplicate check-in
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

      // 5️⃣ Insert attendance
      await supabase.from('teacher_attendance').insert({
        teacher_id: teacher.id,
        date: today,
        check_in: new Date().toISOString(),
        status: 'present',
      });

      toast.success('Check-in successful');
      router.push('/teacher/dashboard');
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
}}
