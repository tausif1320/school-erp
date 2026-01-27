'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { QrCode, MapPin, Zap, ShieldCheck } from 'lucide-react';

/* =========================
   IST HELPER (Logic Unchanged)
========================= */
function getISTDateString() {
  return new Date().toLocaleDateString('en-CA', { 
    timeZone: 'Asia/Kolkata' 
  });
}

/* =========================
   DISTANCE CALC (Logic Unchanged)
========================= */
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* =========================
   COMPONENT
========================= */
export default function TeacherScanPage() {
  const scannedRef = useRef(false);
  const scannerRef = useRef<any>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      // Dynamic import
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      if (!mounted) return;

      // CONFIGURATION UPDATE: Added videoConstraints for Back Camera
      const scanner = new Html5QrcodeScanner(
        'reader',
        { 
          fps: 10, 
          qrbox: 260,
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          videoConstraints: {
            facingMode: { ideal: "environment" } // Forces Back Camera
          }
        },
        false
      );

      scannerRef.current = scanner;

      scanner.render(
        async (text: string) => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          setIsScanning(false); // UI Update

          try {
            await scanner.clear(); // Stop camera

            // Show loading toast
            const toastId = toast.loading('Verifying Location & QR...');

            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                try {
                  const parts = text.split('|');
                  
                  // 1. Validate Format
                  if (parts.length !== 6) {
                    toast.error('Invalid QR Format', { id: toastId });
                    setTimeout(() => window.location.reload(), 2000);
                    return;
                  }

                  const [, qrDate, qLat, qLng, qRad, sig] = parts;

                  // 2. Validate Date
                  let today = '';
                  const { data } = await supabase.rpc('current_ist_date').single();
                  const dbDate = data as string | null;
                  if (dbDate) today = dbDate;
                  else today = getISTDateString();

                  if (qrDate !== today) {
                    toast.error('QR Code Expired', { id: toastId });
                    setTimeout(() => window.location.reload(), 2000);
                    return;
                  }

                  // 3. Validate Signature
                  const secret = process.env.NEXT_PUBLIC_QR_SECRET;
                  if (!secret) {
                    toast.error('System Error: Missing Key', { id: toastId });
                    return;
                  }
                  const expected = btoa(`${qrDate}|${qLat}|${qLng}|${qRad}|${secret}`);

                  if (sig !== expected) {
                    toast.error('Fake QR Detected', { id: toastId });
                    setTimeout(() => window.location.reload(), 2000);
                    return;
                  }

                  // 4. Validate Location
                  const dist = distanceMeters(pos.coords.latitude, pos.coords.longitude, Number(qLat), Number(qLng));

                  if (dist > Number(qRad)) {
                    toast.error(`Too far! Move ${Math.round(dist)}m closer.`, { id: toastId });
                    setTimeout(() => window.location.reload(), 2000);
                    return;
                  }

                  // 5. Authenticate
                  const { data: auth } = await supabase.auth.getUser();
                  if (!auth.user) {
                    toast.error('Session expired', { id: toastId });
                    return;
                  }

                  const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', auth.user.id).single();
                  if (!teacher) {
                    toast.error('Teacher profile not found', { id: 'verify' });
                    return;
                  }

                  // 6. Mark Attendance
                  const { data: existing } = await supabase.from('teacher_attendance').select('*').eq('teacher_id', teacher.id).eq('date', today).maybeSingle();
                  const nowUTC = new Date().toISOString();

                  if (!existing) {
                    const { error } = await supabase.from('teacher_attendance').insert({ teacher_id: teacher.id, date: today, check_in: nowUTC, status: 'present' });
                    if (error) throw error;
                    toast.success('✅ Check-In Successful!', { id: toastId });
                  } else if (!existing.check_out) {
                    const { error } = await supabase.from('teacher_attendance').update({ check_out: nowUTC }).eq('id', existing.id);
                    if (error) throw error;
                    toast.success('👋 Check-Out Successful!', { id: toastId });
                  } else {
                    toast('Attendance already completed today.', { id: toastId });
                  }
                  
                  // Redirect
                  setTimeout(() => window.location.href = '/teacher/dashboard', 1500);

                } catch (err) {
                  console.error(err);
                  toast.error('Attendance failed. Try again.', { id: toastId });
                  setTimeout(() => window.location.reload(), 2000);
                }
              },
              (err) => {
                 toast.error('Location Access Denied', { id: toastId });
                 scannedRef.current = false;
              },
              { enableHighAccuracy: true }
            );
          } catch (err) {
            toast.error('Camera error');
            scannedRef.current = false;
          }
        },
        (errorMessage) => { /* scanning... */ }
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
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 animate-fade-in-up">
      
      {/* SCANNER CONTAINER */}
      <div className="w-full max-w-sm relative">
        
        {/* Card Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-6 text-center bg-gradient-to-b from-black/80 to-transparent pt-8 rounded-t-3xl">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-400" /> 
            Scan Attendance
          </h1>
          <p className="text-xs text-zinc-300 mt-1 font-medium">Align QR code within the frame</p>
        </div>

        {/* The Actual Scanner */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-black">
          
          {/* Overlay UI (The "Professional" Look) */}
          {isScanning && (
            <div className="absolute inset-0 z-10 pointer-events-none">
              {/* Corners */}
              <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl"></div>
              <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl"></div>
              <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl"></div>
              <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-indigo-500 rounded-br-xl"></div>
              
              {/* Laser Animation */}
              <div className="absolute top-[10%] left-[10%] right-[10%] h-0.5 bg-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-scan"></div>
            </div>
          )}

          {/* Success Overlay */}
          {!isScanning && (
            <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
              <ShieldCheck className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
              <h2 className="text-xl font-bold text-white">Processing...</h2>
              <p className="text-zinc-400 text-sm mt-1">Verifying credentials</p>
            </div>
          )}

          {/* Library Mount Point */}
          <div id="reader" className="w-full aspect-square bg-zinc-900" />
        </div>

        {/* Footer Status */}
        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-white/10 text-xs font-medium text-zinc-400">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            <span>GPS Active</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-white/10 text-xs font-medium text-zinc-400">
            <Zap className="w-3.5 h-3.5 text-yellow-500" />
            <span>Auto-Focus</span>
          </div>
        </div>

      </div>

      {/* Global Styles to Override/Hide Ugly Library UI */}
      <style jsx global>{`
        /* Hide the library's default stop button and header links */
        #reader__dashboard_section_csr span, 
        #reader__dashboard_section_swaplink {
          display: none !important;
        }
        
        /* Make the camera permission button look decent just in case it shows */
        #reader__dashboard_section_csr button {
          background: #4F46E5 !important;
          color: white !important;
          border: none !important;
          padding: 10px 20px !important;
          border-radius: 12px !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          margin-top: 20px !important;
        }

        /* Ensure video fills the curved container */
        #reader video {
          object-fit: cover !important;
          border-radius: 24px !important;
        }
        
        /* Remove default borders */
        #reader {
          border: none !important;
        }

        /* Scan Animation */
        @keyframes scan {
          0% { top: 15%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 85%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}