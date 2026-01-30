'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { 
  QrCode, MapPin, Zap, ShieldCheck, Maximize, 
  AlertCircle, RefreshCw, Camera, CheckCircle // <--- Added CheckCircle here
} from 'lucide-react';

/* =========================
   IST HELPER
========================= */
function getISTDateString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

/* =========================
   DISTANCE CALC
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
  
  // UI States
  const [status, setStatus] = useState<'scanning' | 'processing' | 'success' | 'error'>('scanning');
  const [errorDetails, setErrorDetails] = useState<{ title: string; msg: string } | null>(null);

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      // Dynamic import
      const { Html5QrcodeScanner, Html5QrcodeScanType } = await import('html5-qrcode');
      if (!mounted) return;

      const scanner = new Html5QrcodeScanner(
        'reader',
        { 
          fps: 15,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          // Fixed: Removed file upload, force camera only
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          videoConstraints: {
            facingMode: { ideal: "environment" } // Fixed: Removed focusMode to solve TS error
          }
        },
        false
      );

      scannerRef.current = scanner;

      scanner.render(
        async (text: string) => {
          if (scannedRef.current) return;
          
          scannedRef.current = true;
          setStatus('processing'); 

          try {
            const toastId = toast.loading('Verifying Credentials...');

            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                try {
                  const parts = text.split('|');
                  
                  if (parts.length !== 6) {
                    throw { title: 'Invalid QR Code', msg: 'This is not a valid Project Aalu code.' };
                  }

                  const [, qrDate, qLat, qLng, qRad, sig] = parts;

                  let today = '';
                  const { data } = await supabase.rpc('current_ist_date').single();
                  const dbDate = data as string | null;
                  if (dbDate) today = dbDate;
                  else today = getISTDateString();

                  if (qrDate !== today) {
                    throw { title: 'Session Expired', msg: 'This QR code is from a past date.' };
                  }

                  const secret = process.env.NEXT_PUBLIC_QR_SECRET;
                  if (!secret) throw { title: 'System Error', msg: 'Security key missing.' };
                  
                  const expected = btoa(`${qrDate}|${qLat}|${qLng}|${qRad}|${secret}`);
                  if (sig !== expected) {
                    throw { title: 'Security Alert', msg: 'Counterfeit QR code detected.' };
                  }

                  const dist = distanceMeters(pos.coords.latitude, pos.coords.longitude, Number(qLat), Number(qLng));
                  if (dist > Number(qRad)) {
                    throw { title: 'Location Mismatch', msg: `You are ${Math.round(dist)}m away. Move closer.` };
                  }

                  const { data: auth } = await supabase.auth.getUser();
                  if (!auth.user) throw { title: 'Session Timeout', msg: 'Please login again.' };

                  const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', auth.user.id).single();
                  if (!teacher) throw { title: 'Access Denied', msg: 'Teacher profile not found.' };

                  const { data: existing } = await supabase.from('teacher_attendance').select('*').eq('teacher_id', teacher.id).eq('date', today).maybeSingle();
                  const nowUTC = new Date().toISOString();

                  if (!existing) {
                    const { error } = await supabase.from('teacher_attendance').insert({ teacher_id: teacher.id, date: today, check_in: nowUTC, status: 'present' });
                    if (error) throw error;
                    toast.success('Check-In Verified!', { id: toastId });
                  } else if (!existing.check_out) {
                    const { error } = await supabase.from('teacher_attendance').update({ check_out: nowUTC }).eq('id', existing.id);
                    if (error) throw error;
                    toast.success('Check-Out Verified!', { id: toastId });
                  } else {
                    toast.success('Already Recorded', { id: toastId });
                  }
                  
                  await scanner.clear();
                  setStatus('success');
                  setTimeout(() => window.location.href = '/teacher/dashboard', 1500);

                } catch (err: any) {
                  console.error(err);
                  toast.dismiss(toastId);
                  setErrorDetails({ 
                    title: err.title || 'Verification Failed', 
                    msg: err.msg || 'An unknown error occurred.' 
                  });
                  setStatus('error'); 
                }
              },
              (err) => {
                 toast.error('GPS Required', { id: toastId });
                 setErrorDetails({ title: 'Location Error', msg: 'Please enable GPS access to scan.' });
                 setStatus('error');
              },
              { enableHighAccuracy: true }
            );
          } catch (err) {
            setStatus('error');
            setErrorDetails({ title: 'Camera Error', msg: 'Could not access camera feed.' });
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

  const handleScanAgain = () => {
    setStatus('scanning');
    setErrorDetails(null);
    scannedRef.current = false;
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* --- PREMIUM BACKGROUND --- */}
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
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === 'error' ? 'bg-red-500' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${status === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
              {status === 'scanning' ? 'Live Feed' : status === 'processing' ? 'Verifying...' : status === 'error' ? 'Scan Failed' : 'Success'}
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Scan Attendance</h1>
          <p className="text-zinc-400 text-sm">Align the classroom QR code within the frame.</p>
        </div>

        {/* SCANNER VIEWPORT */}
        <div className="px-6 pb-8">
          <div className="relative aspect-square rounded-[32px] overflow-hidden border-2 border-white/10 bg-black shadow-inner group">
            
            {/* 1. Camera Feed (Library Mount) */}
            <div id="reader" className="w-full h-full object-cover" />

            {/* 2. HUD: Active Scanning */}
            {status === 'scanning' && (
              <div className="absolute inset-0 pointer-events-none z-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.8)_100%)]" />
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-scan-laser opacity-80" />
                
                {/* Corners */}
                <div className="absolute top-6 left-6 w-16 h-16 border-t-[3px] border-l-[3px] border-emerald-500 rounded-tl-2xl opacity-80" />
                <div className="absolute top-6 right-6 w-16 h-16 border-t-[3px] border-r-[3px] border-emerald-500 rounded-tr-2xl opacity-80" />
                <div className="absolute bottom-6 left-6 w-16 h-16 border-b-[3px] border-l-[3px] border-emerald-500 rounded-bl-2xl opacity-80" />
                <div className="absolute bottom-6 right-6 w-16 h-16 border-b-[3px] border-r-[3px] border-emerald-500 rounded-br-2xl opacity-80" />
                
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <Maximize className="w-12 h-12 text-white stroke-[1]" />
                </div>
              </div>
            )}

            {/* 3. HUD: Processing */}
            {status === 'processing' && (
              <div className="absolute inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                  <ShieldCheck className="relative w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Verifying...</h2>
              </div>
            )}

            {/* 4. HUD: Error / Retry */}
            {status === 'error' && errorDetails && (
              <div className="absolute inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center animate-in zoom-in duration-300 p-6 text-center">
                <div className="bg-red-500/10 p-4 rounded-full mb-4 ring-1 ring-red-500/20">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{errorDetails.title}</h2>
                <p className="text-zinc-400 text-sm mb-6 max-w-[200px] leading-relaxed">{errorDetails.msg}</p>
                
                <button 
                  onClick={handleScanAgain}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-white/10"
                >
                  <RefreshCw className="w-4 h-4" /> Scan Again
                </button>
              </div>
            )}

            {/* 5. HUD: Success */}
            {status === 'success' && (
              <div className="absolute inset-0 z-50 bg-emerald-500/90 backdrop-blur-md flex flex-col items-center justify-center animate-in zoom-in duration-300">
                <CheckCircle className="w-20 h-20 text-white mb-4 drop-shadow-lg" />
                <h2 className="text-2xl font-bold text-white">Verified!</h2>
              </div>
            )}

          </div>
        </div>

        {/* Footer Status Bars */}
        <div className="px-8 pb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 backdrop-blur-sm">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Location</span>
              <span className="text-xs font-medium text-white">Active</span>
            </div>
            <div className="bg-zinc-900/50 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 backdrop-blur-sm">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Mode</span>
              <span className="text-xs font-medium text-white">Camera Only</span>
            </div>
          </div>
        </div>

      </div>

      {/* --- GLOBAL STYLE OVERRIDES --- */}
      <style jsx global>{`
        #reader__dashboard_section_csr span, 
        #reader__dashboard_section_swaplink,
        #reader__dashboard_section_csr select,
        #reader__filescan_input_label,
        #reader__camera_permission_button {
          display: none !important;
        }
        
        #reader {
          border: none !important;
          background: #000 !important;
        }

        #reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 32px !important;
        }

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