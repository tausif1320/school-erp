'use client';

import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

/* =========================
   IST HELPER (Inline)
========================= */
function getISTDateString() {
  return new Date().toLocaleDateString('en-CA', { 
    timeZone: 'Asia/Kolkata' 
  });
}

/* =========================
   DISTANCE CALC (METERS)
========================= */
function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function TeacherScanPage() {
  const scannedRef = useRef(false);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      // Dynamic import for Html5QrcodeScanner
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      if (!mounted) return;

      const scanner = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: 250 },
        false
      );

      scannerRef.current = scanner;

      scanner.render(
        async (text: string) => {
          // Prevent double scanning
          if (scannedRef.current) return;
          scannedRef.current = true;

          try {
            await scanner.clear(); // Stop camera immediately

            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                try {
                  const parts = text.split('|');
                  
                  // 1. Validate Format
                  if (parts.length !== 6) {
                    toast.error('Invalid QR Format');
                    scannedRef.current = false; // Allow retry
                    return;
                  }

                  const [, qrDate, qLat, qLng, qRad, sig] = parts;

                  // 2. Validate Date (RPC + Fallback)
                  let today = '';
                  const { data } = await supabase.rpc('current_ist_date').single();
                  const dbDate = data as string | null;

                  if (dbDate) {
                    today = dbDate;
                  } else {
                    today = getISTDateString();
                  }

                  if (qrDate !== today) {
                    toast.error('QR Code Expired (Old Date)');
                    scannedRef.current = false;
                    return;
                  }

                  // 3. Validate Signature
                  const secret = process.env.NEXT_PUBLIC_QR_SECRET;
                  if (!secret) {
                    toast.error('System Error: Missing Secret Key');
                    return;
                  }

                  const expected = btoa(
                    `${qrDate}|${qLat}|${qLng}|${qRad}|${secret}`
                  );

                  if (sig !== expected) {
                    toast.error('Fake QR Detected');
                    scannedRef.current = false;
                    return;
                  }

                  // 4. Validate Location
                  const dist = distanceMeters(
                    pos.coords.latitude,
                    pos.coords.longitude,
                    Number(qLat),
                    Number(qLng)
                  );

                  if (dist > Number(qRad)) {
                    toast.error(`Too far! You are ${Math.round(dist)}m away.`);
                    scannedRef.current = false;
                    return;
                  }

                  // 5. Authenticate User
                  const { data: auth } = await supabase.auth.getUser();
                  if (!auth.user) {
                    toast.error('Please login first');
                    return;
                  }

                  const { data: teacher } = await supabase
                    .from('teachers')
                    .select('id')
                    .eq('user_id', auth.user.id)
                    .single();

                  if (!teacher) {
                    toast.error('Teacher profile not found');
                    return;
                  }

                  // 6. Mark Attendance
                  const { data: existing } = await supabase
                    .from('teacher_attendance')
                    .select('*')
                    .eq('teacher_id', teacher.id)
                    .eq('date', today)
                    .maybeSingle(); // Use maybeSingle to avoid errors if null

                  const nowUTC = new Date().toISOString();

                  if (!existing) {
                    // Check In
                    const { error } = await supabase.from('teacher_attendance').insert({
                      teacher_id: teacher.id,
                      date: today,
                      check_in: nowUTC,
                      status: 'present',
                    });
                    if (error) throw error;
                    toast.success('✅ Checked IN Successfully!');
                  } else if (!existing.check_out) {
                    // Check Out
                    const { error } = await supabase
                      .from('teacher_attendance')
                      .update({ check_out: nowUTC })
                      .eq('id', existing.id);
                    if (error) throw error;
                    toast.success('👋 Checked OUT Successfully!');
                  } else {
                    toast('Attendance already completed for today.');
                  }
                  
                  // Redirect or refresh after success (Optional)
                  // window.location.href = '/teacher/dashboard';

                } catch (err) {
                  console.error(err);
                  toast.error('Attendance failed. Try again.');
                  scannedRef.current = false;
                }
              },
              (err) => {
                 toast.error('Location permission denied');
                 scannedRef.current = false;
              },
              { enableHighAccuracy: true }
            );
          } catch (err) {
            toast.error('Camera error');
            scannedRef.current = false;
          }
        },
        (errorMessage) => {
          // Parse errors are common while scanning, ignore them
        }
      );
    }

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center mt-10 space-y-4">
      <h1 className="text-xl font-bold">Scan Attendance QR</h1>
      <div id="reader" className="w-[320px] bg-black rounded-lg overflow-hidden" />
      <p className="text-sm text-gray-500">Allow Camera & Location access</p>
    </div>
  );
}