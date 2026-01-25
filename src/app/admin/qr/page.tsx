'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import { getISTDateString } from '@/lib/time';

export default function AdminQRPage() {
  const [loading, setLoading] = useState(true);
  const [qrValue, setQrValue] = useState('');
  
  // Form State
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('500');

  useEffect(() => {
    load();
  }, []);

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

  async function save() {
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
      return;
    }

    // Pass the NEW values directly to generateQR
    await generateQR(latNum, lngNum, radNum);
    toast.success('QR Code Updated & Saved');
  }

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

  if (loading) return <div>Loading Settings...</div>;

  return (
    <div className="space-y-6 max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold">Admin QR Generator</h1>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-sm text-gray-500">Latitude</label>
          <input 
            className="w-full border p-2 rounded" 
            value={lat} 
            onChange={e => setLat(e.target.value)} 
            placeholder="Latitude" 
          />
        </div>
        <div>
          <label className="text-sm text-gray-500">Longitude</label>
          <input 
            className="w-full border p-2 rounded" 
            value={lng} 
            onChange={e => setLng(e.target.value)} 
            placeholder="Longitude" 
          />
        </div>
        <div>
          <label className="text-sm text-gray-500">Radius (Meters)</label>
          <input 
            className="w-full border p-2 rounded" 
            value={radius} 
            onChange={e => setRadius(e.target.value)} 
            placeholder="Radius" 
          />
        </div>
      </div>

      <button 
        onClick={save} 
        className="w-full bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition"
      >
        Save Settings & Regenerate QR
      </button>

      {qrValue && (
        <div className="flex flex-col items-center justify-center bg-white p-6 border rounded-xl shadow-sm">
          <QRCode value={qrValue} size={200} />
          <p className="mt-4 text-xs text-gray-400 font-mono break-all text-center max-w-[250px]">
            {qrValue}
          </p>
        </div>
      )}
    </div>
  );
}