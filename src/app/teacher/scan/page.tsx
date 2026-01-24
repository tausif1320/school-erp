'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

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
  const [debug, setDebug] = useState<string>('');

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
    const parts = text.split('|');
    const [, , latStr, lngStr, radiusStr] = parts;

    let qrLat = Number(latStr);
    let qrLng = Number(lngStr);

    if (Math.abs(qrLat) > 90) {
      [qrLat, qrLng] = [qrLng, qrLat];
    }

    const distance = getDistance(userLat, userLng, qrLat, qrLng);

    setDebug(
      `Phone: ${userLat.toFixed(6)}, ${userLng.toFixed(6)}
QR: ${qrLat.toFixed(6)}, ${qrLng.toFixed(6)}
Distance: ${Math.round(distance)} m`
    );

    if (distance > Number(radiusStr)) {
      toast.error(`Outside premises (${Math.round(distance)}m)`);
      return;
    }

    toast.success('GPS OK (rest of logic continues)');
    // Attendance logic remains same
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-xl mb-2">Scan Attendance QR</h1>
      {!gps && <p>Waiting for location permission…</p>}
      <div id="qr-reader" className="w-72 mt-4" />

      {debug && (
        <pre className="mt-4 text-xs bg-zinc-900 p-3 rounded w-80">
          {debug}
        </pre>
      )}
    </div>
  );
}
