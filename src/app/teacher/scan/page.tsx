'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function TeacherScanPage() {
  const scanLock = useRef(false);

  const router = useRouter();
  const qrRef = useRef<Html5Qrcode | null>(null);

  const [cameras, setCameras] = useState<any[]>([]);
  const [cameraId, setCameraId] = useState<string>('');
  const [scanning, setScanning] = useState(false);

  /* =========================
     LOAD CAMERAS (ONCE)
  ========================= */
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!devices || devices.length === 0) {
          toast.error('No camera found');
          return;
        }
        setCameras(devices);
        setCameraId(devices[devices.length - 1].id); // back camera
      })
      .catch(() => toast.error('Camera permission denied'));
  }, []);

  /* =========================
     START SCANNING
  ========================= */
  async function startScan() {
    if (!cameraId) {
      toast.error('Camera not ready');
      return;
    }

    if (qrRef.current) return;

    qrRef.current = new Html5Qrcode('qr-reader');
    setScanning(true);

    try {
      await qrRef.current.start(
        cameraId,
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (decodedText) => {
          await stopScan();
          await handleScan(decodedText.trim());
        },
        () => {
          // ignore scan noise
        }
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to start camera');
      setScanning(false);
    }
  }

  /* =========================
     STOP SCANNING
  ========================= */
  async function stopScan() {
    if (qrRef.current) {
      try {
        await qrRef.current.stop();
        await qrRef.current.clear();
      } catch {}
      qrRef.current = null;
    }
    setScanning(false);
  }

  /* =========================
     HANDLE QR RESULT
  ========================= */
  async function handleScan(raw: string) {
  try {
    toast.loading('Validating...', { id: 'qr' });

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      toast.error('Invalid QR format', { id: 'qr' });
      return;
    }

    if (payload.type !== 'teacher_attendance') {
      toast.error('Invalid QR type', { id: 'qr' });
      return;
    }

    // ⏱️ Time validation (2 minutes)
    const now = Date.now();
    if (now - payload.issuedAt > 2 * 60 * 1000) {
      toast.error('QR expired', { id: 'qr' });
      return;
    }

    // 👤 Auth user
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error('Not logged in', { id: 'qr' });
      return;
    }

    // 👨‍🏫 Teacher lookup
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', auth.user.id)
      .single();

    if (!teacher) {
      toast.error('Teacher profile not found', { id: 'qr' });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    // 🚫 Prevent duplicate
    const { data: existing } = await supabase
      .from('teacher_attendance')
      .select('id')
      .eq('teacher_id', teacher.id)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      toast.error('Already checked in', { id: 'qr' });
      return;
    }

    // ✅ Insert attendance
    await supabase.from('teacher_attendance').insert({
      teacher_id: teacher.id,
      date: today,
      check_in: new Date().toISOString(),
      status: 'present',
    });

    toast.success('Check-in successful', { id: 'qr' });
    router.push('/teacher/dashboard');
  } catch (err) {
    console.error(err);
    toast.error('Check-in failed', { id: 'qr' });
  }
}


  /* =========================
     CLEANUP
  ========================= */
  useEffect(() => {
    return () => {
      stopScan();
    };
  }, []);

  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
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
