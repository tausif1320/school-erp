'use client';

import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

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
      // ✅ dynamic import (browser-only)
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      if (!mounted) return;

      const scanner = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: 250 },
        false
      );

      scannerRef.current = scanner;

      // ✅ MUST PROVIDE TWO CALLBACKS
      scanner.render(
        async (text: string) => {
          // ---------- SUCCESS ----------
          if (scannedRef.current) return;
          scannedRef.current = true;

          try {
            // stop camera immediately
            await scanner.clear();

            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                try {
                  const parts = text.split('|');
                  if (parts.length !== 6) {
                    toast.error('Invalid QR');
                    return;
                  }

                  const [, qrDate, qLat, qLng, qRad, sig] = parts;

                  // IST date from DB
                  const { data: today } = await supabase
                    .rpc('current_ist_date')
                    .single();

                  if (qrDate !== today) {
                    toast.error('QR expired');
                    return;
                  }

                  const secret = process.env.NEXT_PUBLIC_QR_SECRET!;
                  const expected = btoa(
                    `${qrDate}|${qLat}|${qLng}|${qRad}|${secret}`
                  );

                  if (sig !== expected) {
                    toast.error('Invalid QR');
                    return;
                  }

                  const dist = distanceMeters(
                    pos.coords.latitude,
                    pos.coords.longitude,
                    Number(qLat),
                    Number(qLng)
                  );

                  if (dist > Number(qRad)) {
                    toast.error('Outside school premises');
                    return;
                  }

                  const { data: auth } = await supabase.auth.getUser();
                  if (!auth.user) {
                    toast.error('Not logged in');
                    return;
                  }

                  const { data: teacher } = await supabase
                    .from('teachers')
                    .select('id')
                    .eq('user_id', auth.user.id)
                    .single();

                  if (!teacher) {
                    toast.error('Teacher not found');
                    return;
                  }

                  const { data: existing } = await supabase
                    .from('teacher_attendance')
                    .select('*')
                    .eq('teacher_id', teacher.id)
                    .eq('date', today)
                    .single();

                  if (!existing?.check_in) {
                    await supabase.from('teacher_attendance').upsert({
                      teacher_id: teacher.id,
                      date: today,
                      check_in: new Date().toISOString(),
                      status: 'present',
                    });
                    toast.success('Checked in');
                  } else if (!existing.check_out) {
                    await supabase
                      .from('teacher_attendance')
                      .update({
                        check_out: new Date().toISOString(),
                      })
                      .eq('id', existing.id);
                    toast.success('Checked out');
                  } else {
                    toast('Attendance already completed');
                  }
                } catch {
                  toast.error('Scan failed');
                }
              },
              () => toast.error('Location permission required'),
              { enableHighAccuracy: true }
            );
          } catch {
            toast.error('Scan failed');
          }
        },
        () => {
          // ---------- FAILURE (ignore frame errors) ----------
          // Do nothing. Required by API.
        }
      );
    }

    startScanner();

    return () => {
      mounted = false;
      scannerRef.current?.clear?.().catch(() => {});
    };
  }, []);

  return (
    <div className="flex justify-center mt-10">
      <div id="reader" className="w-[320px]" />
    </div>
  );
}
