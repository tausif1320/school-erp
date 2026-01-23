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
     START QR SCAN
  ========================= */
  async function startScan() {
    if (qrRef.current) return;

    const qr = new Html5Qrcode('qr-reader');
    qrRef.current = qr;
    setScanning(true);

    try {
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await handleScan(decodedText);
        },
        () => {}
      );
    } catch {
      toast.error('Camera permission denied');
      setScanning(false);
    }
  }

  /* =========================
     STOP SCAN
  ========================= */
  async function stopScan() {
    if (!qrRef.current) return;

    try {
      await qrRef.current.stop();
      await qrRef.current.clear();
    } catch {}

    qrRef.current = null;
    setScanning(false);
  }

  /* =========================
     HANDLE SCAN RESULT
  ========================= */
  async function handleScan(token: string) {
    await stopScan();
    const toastId = toast.loading('Validating QR...');

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.email) {
        throw new Error('Session expired. Please login again.');
      }

      // 🔴 ONE location request only (mobile-safe)
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

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
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      const text = await res.text();
      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error('Invalid server response');
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
        toast.error(err.message || 'Something went wrong');
      }
    } finally {
      toast.dismiss(toastId);
    }
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
