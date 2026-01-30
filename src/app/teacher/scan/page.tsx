'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { QrCode, MapPin, Zap, ShieldCheck, Wifi, Maximize } from 'lucide-react';

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
          qrbox: 280, // Slightly larger box
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
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* --- PREMIUM BACKGROUND (Same as Profile) --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-20%] w-[100%] h-[60%] rounded-full bg-gradient-to-br from-indigo-600/20 to-purple-600/20 blur-[100px] animate-pulse-slow"></div>
         <div className="absolute bottom-[-10%] right-[-20%] w-[100%] h-[60%] rounded-full bg-emerald-600/20 blur-[100px] animate-pulse-slow delay-1000"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 mix-blend-overlay"></div>
      </div>

      {/* --- MAIN CARD --- */}
      <div className="relative z-10 w-full max-w-md bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-[40px] shadow-2xl overflow-hidden animate-fade-in-up">
        
        {/* HEADER */}
        <div className="p-8 pb-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">System Active</span>
          </div>
          
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Scan Attendance</h1>
          <p className="text-zinc-400 text-sm">Align the classroom QR code within the frame.</p>
        </div>

        {/* SCANNER VIEWPORT */}
        <div className="px-6 pb-8">
          <div className="relative aspect-square rounded-[32px] overflow-hidden border-2 border-white/10 bg-black shadow-inner group">
            
            {/* 1. The Camera Feed ID (Library mounts here) */}
            <div id="reader" className="w-full h-full object-cover" />

            {/* 2. HUD Overlay (Visible only when scanning) */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {/* Darken edges for focus */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.8)_100%)]" />
                
                {/* Scanner Laser */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-scan-laser opacity-80" />

                {/* Corner Brackets */}
                <div className="absolute top-6 left-6 w-16 h-16 border-t-[3px] border-l-[3px] border-emerald-500 rounded-tl-2xl opacity-80" />
                <div className="absolute top-6 right-6 w-16 h-16 border-t-[3px] border-r-[3px] border-emerald-500 rounded-tr-2xl opacity-80" />
                <div className="absolute bottom-6 left-6 w-16 h-16 border-b-[3px] border-l-[3px] border-emerald-500 rounded-bl-2xl opacity-80" />
                <div className="absolute bottom-6 right-6 w-16 h-16 border-b-[3px] border-r-[3px] border-emerald-500 rounded-br-2xl opacity-80" />

                {/* Center Reticle */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <Maximize className="w-12 h-12 text-white stroke-[1]" />
                </div>
              </div>
            )}

            {/* 3. Processing Overlay (When logic runs) */}
            {!isScanning && (
              <div className="absolute inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                  <ShieldCheck className="relative w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Verifying Credentials</h2>
                <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400 font-mono bg-white/5 px-3 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ENCRYPTED CONNECTION
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER STATUS BARS */}
        <div className="px-8 pb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 backdrop-blur-sm">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Location</span>
              <span className="text-xs font-medium text-white">High Accuracy</span>
            </div>
            <div className="bg-zinc-900/50 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 backdrop-blur-sm">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Network</span>
              <span className="text-xs font-medium text-white">Online</span>
            </div>
          </div>
        </div>

      </div>

      {/* --- GLOBAL STYLE OVERRIDES FOR LIBRARY --- */}
      <style jsx global>{`
        /* Hide all library UI junk */
        #reader__dashboard_section_csr span, 
        #reader__dashboard_section_swaplink,
        #reader__dashboard_section_csr select {
          display: none !important;
        }
        
        /* Container cleanup */
        #reader {
          border: none !important;
          background: #000 !important;
        }

        /* Video Feed Fit */
        #reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 32px !important; /* Match container */
        }

        /* Scan Animation */
        @keyframes scan-laser {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-laser {
          animation: scan-laser 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}