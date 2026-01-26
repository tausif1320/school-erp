'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { QrCode, MapPin, Camera, AlertCircle, CheckCircle2, ScanLine } from 'lucide-react';

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

/* =========================
   COMPONENT
========================= */
export default function TeacherScanPage() {
  const scannedRef = useRef(false);
  const scannerRef = useRef<any>(null);
  const [cameraActive, setCameraActive] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      // Dynamic import for Html5QrcodeScanner
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      if (!mounted) return;

      const scanner = new Html5QrcodeScanner(
        'reader',
        { 
          fps: 10, 
          qrbox: 280,
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true 
        },
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
            setCameraActive(false);

            toast.loading('Verifying location...', { id: 'verify' });

            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                try {
                  const parts = text.split('|');
                  
                  // 1. Validate Format
                  if (parts.length !== 6) {
                    toast.error('Invalid QR Format', { id: 'verify' });
                    setTimeout(() => window.location.reload(), 2000); 
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
                    toast.error('QR Code Expired (Old Date)', { id: 'verify' });
                    setTimeout(() => window.location.reload(), 2000);
                    return;
                  }

                  // 3. Validate Signature
                  const secret = process.env.NEXT_PUBLIC_QR_SECRET;
                  if (!secret) {
                    toast.error('System Error: Missing Secret Key', { id: 'verify' });
                    return;
                  }

                  const expected = btoa(
                    `${qrDate}|${qLat}|${qLng}|${qRad}|${secret}`
                  );

                  if (sig !== expected) {
                    toast.error('Fake QR Detected', { id: 'verify' });
                    setTimeout(() => window.location.reload(), 2000);
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
                    toast.error(`Too far! You are ${Math.round(dist)}m away.`, { id: 'verify' });
                    setTimeout(() => window.location.reload(), 2000);
                    return;
                  }

                  // 5. Authenticate User
                  const { data: auth } = await supabase.auth.getUser();
                  if (!auth.user) {
                    toast.error('Please login first', { id: 'verify' });
                    return;
                  }

                  const { data: teacher } = await supabase
                    .from('teachers')
                    .select('id')
                    .eq('user_id', auth.user.id)
                    .single();

                  if (!teacher) {
                    toast.error('Teacher profile not found', { id: 'verify' });
                    return;
                  }

                  // 6. Mark Attendance
                  const { data: existing } = await supabase
                    .from('teacher_attendance')
                    .select('*')
                    .eq('teacher_id', teacher.id)
                    .eq('date', today)
                    .maybeSingle(); 

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
                    toast.success('✅ Checked IN Successfully!', { id: 'verify' });
                  } else if (!existing.check_out) {
                    // Check Out
                    const { error } = await supabase
                      .from('teacher_attendance')
                      .update({ check_out: nowUTC })
                      .eq('id', existing.id);
                    if (error) throw error;
                    toast.success('👋 Checked OUT Successfully!', { id: 'verify' });
                  } else {
                    toast('Attendance already completed today.', { id: 'verify' });
                  }
                  
                  // Optional: Redirect
                  setTimeout(() => window.location.href = '/teacher/dashboard', 1500);

                } catch (err) {
                  console.error(err);
                  toast.error('Attendance failed. Try again.', { id: 'verify' });
                  setTimeout(() => window.location.reload(), 2000);
                }
              },
              (err) => {
                 toast.error('Location permission denied', { id: 'verify' });
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
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 animate-fade-in-up">
      
      {/* SCANNER CARD */}
      <div className="w-full max-w-md bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 text-center border-b border-white/5 bg-white/5">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-3 shadow-lg shadow-indigo-500/10">
            <QrCode className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Attendance Scanner</h1>
          <p className="text-zinc-400 text-sm mt-1">Align the campus QR code within the frame</p>
        </div>

        {/* Camera Area */}
        <div className="relative bg-black min-h-[350px] flex items-center justify-center">
          {!cameraActive && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-sm text-center p-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
              <h3 className="text-lg font-bold text-white">Scan Complete</h3>
              <p className="text-zinc-400 text-sm">Processing your attendance...</p>
            </div>
          )}
          
          {/* The Scanner Library Mount Point */}
          <div id="reader" className="w-full h-full [&_video]:object-cover [&_div]:!border-none" />
          
          {/* Custom Overlay (Visual Only) */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-indigo-500/50 rounded-3xl relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-500 -mt-1 -ml-1 rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-500 -mt-1 -mr-1 rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-500 -mb-1 -ml-1 rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-500 -mb-1 -mr-1 rounded-br-xl"></div>
                
                {/* Scanning Animation Line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-400/80 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-scan"></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Status */}
        <div className="p-4 bg-zinc-950/50 border-t border-white/5">
          <div className="flex items-center justify-center gap-6 text-xs font-medium text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-indigo-400" />
              <span>Camera Active</span>
            </div>
            <div className="w-px h-3 bg-white/10"></div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Locating...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Helper Text */}
      <div className="mt-6 flex items-start gap-3 max-w-sm px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-500/80 text-xs">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <p>Ensure you are within the school premises and have allowed location access to mark attendance successfully.</p>
      </div>

      {/* Global CSS for Scanner Customization */}
      <style jsx global>{`
        #reader { border: none !important; }
        #reader__scan_region { display: none !important; }
        #reader__dashboard_section_csr button { 
          color: white; 
          background: rgba(255,255,255,0.1); 
          border: 1px solid rgba(255,255,255,0.2); 
          padding: 6px 12px; 
          border-radius: 8px; 
          margin-top: 10px;
          font-size: 12px;
        }
        #reader__dashboard_section_swaplink { display: none !important; }
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}