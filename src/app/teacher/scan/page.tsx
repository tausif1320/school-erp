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
    toast.loading('Validating QR...');

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user?.email) {
      toast.dismiss();
      toast.error('Not authenticated');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/teacher-checkin`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                token,
                email: auth.user.email,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              }),
            }
          );

          const result = await res.json();
          toast.dismiss();

          if (!res.ok) {
            toast.error(result.error || 'Check-in failed');
            return;
          }

          toast.success('Check-in successful');
          router.push('/teacher/dashboard');
        } catch {
          toast.dismiss();
          toast.error('Network error');
        }
      },
      () => {
        toast.dismiss();
        toast.error('Location permission denied');
      }
    );
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
