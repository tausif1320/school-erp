'use client';

import { useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function TeacherScanPage() {
  const router = useRouter();
  const qrRef = useRef<Html5Qrcode | null>(null);

  const [scanning, setScanning] = useState(false);

  /* =========================
     START SCAN
  ========================= */
  async function startScan() {
    if (scanning) return;

    try {
      // 1️⃣ Ask location permission FIRST
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
    } catch {
      toast.error('Location permission is required');
      return;
    }

    // 2️⃣ Start camera + QR scanner
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
    } catch (err) {
      toast.error('Camera permission is required');
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
        throw new Error('Session expired. Please login again.');
      }

      // get location AGAIN for payload (safe + fast)
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

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
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Check-in failed');
      }

      toast.success('Check-in successful');
      router.push('/teacher/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      toast.dismiss(toastId);
    }
  }

  /* =========================
     UI
  ========================= */
  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-xl">Teacher Attendance</h1>

      {!scanning && (
        <button
          onClick={startScan}
          className="px-4 py-2 bg-green-600 rounded"
        >
          Start Scan
        </button>
      )}

      <div id="qr-reader" className="w-72 h-72 bg-black rounded-xl" />
    </div>
  );
}
