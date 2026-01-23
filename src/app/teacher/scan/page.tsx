'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function TeacherScanPage() {
  const router = useRouter();
  const qrRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    startScan();

    return () => {
      stopScan();
    };
  }, []);

  /* =========================
     START SCANNING
  ========================= */
  async function startScan() {
    if (qrRef.current) return;

    const qr = new Html5Qrcode('qr-reader');
    qrRef.current = qr;
    setScanning(true);

    try {
      await qr.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          await handleScan(decodedText);
        },
        () => {}
      );
    } catch (err) {
      toast.error('Camera access failed');
      setScanning(false);
    }
  }

  /* =========================
     STOP SCANNING
  ========================= */
  async function stopScan() {
    if (!qrRef.current) return;

    try {
      await qrRef.current.stop();
      await qrRef.current.clear();
    } catch (_) {
      // ignore
    }

    qrRef.current = null;
    setScanning(false);
  }

  /* =========================
     HANDLE QR RESULT
  ========================= */
  async function handleScan(token: string) {
  await stopScan();

  const toastId = toast.loading('Validating QR...');

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) {
      throw new Error('Session lost. Please login again.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s hard timeout

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/teacher-checkin`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          token,
          email: session.user.email,
          latitude: await getLatitude(),
          longitude: await getLongitude(),
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    const text = await res.text(); // ← IMPORTANT

    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error('Invalid response from server');
    }

    if (!res.ok) {
      throw new Error(data.error || 'Check-in failed');
    }

    toast.success('Check-in successful');
    router.push('/teacher/dashboard');
  } catch (err: any) {
    if (err.name === 'AbortError') {
      toast.error('Request timed out');
    } else {
      toast.error(err.message || 'Unknown error');
    }
  } finally {
    toast.dismiss(toastId);
  }
}

function getLatitude(): Promise<number> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords.latitude),
      () => reject(new Error('Location permission denied'))
    );
  });
}

function getLongitude(): Promise<number> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords.longitude),
      () => reject(new Error('Location permission denied'))
    );
  });
}



  /* =========================
     UI
  ========================= */
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-xl mb-4">Scan Attendance QR</h1>

      <div
        id="qr-reader"
        className="w-72 h-72 bg-black rounded-xl"
      />

      {!scanning && (
        <button
          onClick={startScan}
          className="mt-4 px-4 py-2 bg-blue-600 rounded"
        >
          Restart Scan
        </button>
      )}
    </div>
  );
}
