'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import { getISTDateString } from '@/lib/time';
import { 
  QrCode, Save, MapPin, Navigation, Radius, Loader2, Globe, ScanLine 
} from 'lucide-react';

export default function AdminQRPage() {
  /* =========================
     STATE (Logic Kept Intact)
  ========================= */
  const [loading, setLoading] = useState(true);
  const [qrValue, setQrValue] = useState('');
  
  // Form State
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('500');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  /* =========================
     LOGIC: LOAD
  ========================= */
  async function load() {
    setLoading(true);
    const { data: settings } = await supabase
      .from('qr_settings')
      .select('*')
      .single();

    if (settings) {
      setLat(String(settings.latitude));
      setLng(String(settings.longitude));
      setRadius(String(settings.radius));
      // Generate QR with the loaded data immediately
      generateQR(settings.latitude, settings.longitude, settings.radius);
    }
    setLoading(false);
  }

  /* =========================
     LOGIC: SAVE
  ========================= */
  async function save() {
    setSaving(true);
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radNum = Number(radius);

    const { error } = await supabase.from('qr_settings').upsert({
      id: '7e59c292-5fc1-4476-be4a-030f4f520a4d', // Ensure we update the specific row
      latitude: latNum,
      longitude: lngNum,
      radius: radNum,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      toast.error('Failed to save settings');
      setSaving(false);
      return;
    }

    // Pass the NEW values directly to generateQR
    await generateQR(latNum, lngNum, radNum);
    toast.success('QR Code Updated & Saved');
    setSaving(false);
  }

  /* =========================
     LOGIC: GENERATE QR
  ========================= */
  async function generateQR(lat: number, lng: number, rad: number) {
    // 1. Try to get DB server time (More secure)
    let todayDate = '';

    // FIX: We explicitly tell TypeScript that 'data' is a string
    const { data } = await supabase.rpc('current_ist_date').single();
    const dbDate = data as string | null;
    
    // 2. Fallback to JS client time if RPC fails or is null
    if (dbDate) {
      todayDate = dbDate;
    } else {
      todayDate = getISTDateString();
    }

    const secret = process.env.NEXT_PUBLIC_QR_SECRET;
    if (!secret) {
      toast.error('QR Secret missing in .env');
      return;
    }

    // Create signature
    const sig = btoa(`${todayDate}|${lat}|${lng}|${rad}|${secret}`);
    
    // Format: SCHOOL|DATE|LAT|LNG|RADIUS|SIGNATURE
    setQrValue(`SCHOOL|${todayDate}|${lat}|${lng}|${rad}|${sig}`);
  }

  /* =========================
     PREMIUM UI RENDER
  ========================= */
  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      <p className="text-zinc-500 text-sm font-medium animate-pulse">Syncing QR Settings...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in-up pb-20 md:pb-10 max-w-5xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">QR Attendance</h1>
          <p className="text-zinc-500 text-sm mt-1">Configure geo-fencing for smart attendance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- LEFT: SETTINGS FORM --- */}
        <div className="space-y-6">
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-6 md:p-8 rounded-3xl relative z-10 shadow-xl">
            
            <div className="flex items-center gap-2 mb-6 text-indigo-400">
               <Globe className="w-5 h-5" />
               <span className="text-sm font-bold uppercase tracking-wider">Location Config</span>
            </div>

            <div className="space-y-5">
              
              {/* Latitude */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-semibold ml-1 uppercase">Latitude</label>
                <div className="relative group">
                  <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                  <input 
                    className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:bg-black/40 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600 font-mono"
                    value={lat} 
                    onChange={e => setLat(e.target.value)} 
                    placeholder="e.g. 12.9716" 
                  />
                </div>
              </div>

              {/* Longitude */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-semibold ml-1 uppercase">Longitude</label>
                <div className="relative group">
                  <Navigation className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                  <input 
                    className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:bg-black/40 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600 font-mono"
                    value={lng} 
                    onChange={e => setLng(e.target.value)} 
                    placeholder="e.g. 77.5946" 
                  />
                </div>
              </div>

              {/* Radius */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-semibold ml-1 uppercase">Geofence Radius (Meters)</label>
                <div className="relative group">
                  <Radius className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                  <input 
                    className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:bg-black/40 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-600 font-mono"
                    value={radius} 
                    onChange={e => setRadius(e.target.value)} 
                    placeholder="e.g. 500" 
                  />
                </div>
                <p className="text-[11px] text-zinc-500 text-right">Allowed range for student check-in.</p>
              </div>

              <div className="pt-4">
                <button 
                  onClick={save} 
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                  <span>Save Configuration</span>
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* --- RIGHT: QR PREVIEW --- */}
        <div className="flex flex-col h-full">
           <div className="flex-1 bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-6 md:p-8 rounded-3xl relative z-10 shadow-xl flex flex-col items-center justify-center text-center space-y-6">
              
              <div className="flex items-center gap-2 mb-2 text-emerald-400 self-start w-full border-b border-white/5 pb-4">
                 <ScanLine className="w-5 h-5" />
                 <span className="text-sm font-bold uppercase tracking-wider">Live Preview</span>
              </div>

              {qrValue ? (
                <div className="relative group cursor-pointer">
                  {/* White Card for QR to ensure contrast */}
                  <div className="bg-white p-4 rounded-2xl shadow-2xl shadow-black/50 transition-transform duration-300 group-hover:scale-105">
                    <QRCode value={qrValue} size={220} />
                  </div>
                  
                  <div className="mt-8 space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Active & Live
                    </div>
                    <p className="text-xs text-zinc-500 font-mono break-all max-w-[280px] mx-auto opacity-40 hover:opacity-100 transition-opacity">
                      {qrValue.substring(0, 40)}...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-zinc-500 flex flex-col items-center gap-2">
                  <QrCode className="w-12 h-12 opacity-20" />
                  <p>QR Code will appear here after saving.</p>
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}