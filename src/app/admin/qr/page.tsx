'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';

export default function AdminQRPage() {
  const [qrValue, setQrValue] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('500');

  async function load() {
    const { data: settings } = await supabase
      .from('qr_settings')
      .select('*')
      .single();

    if (settings) {
      setLat(String(settings.latitude));
      setLng(String(settings.longitude));
      setRadius(String(settings.radius));
      generateQR(settings.latitude, settings.longitude, settings.radius);
    }
  }

  async function save() {
    await supabase.from('qr_settings').upsert({
      latitude: Number(lat),
      longitude: Number(lng),
      radius: Number(radius),
    });

    generateQR(Number(lat), Number(lng), Number(radius));
    toast.success('QR updated');
  }

  async function generateQR(lat: number, lng: number, rad: number) {
    const { data: today } = await supabase.rpc('current_ist_date').single();
    if (!today) return;

    const secret = process.env.NEXT_PUBLIC_QR_SECRET!;
    const sig = btoa(`${today}|${lat}|${lng}|${rad}|${secret}`);

    setQrValue(`SCHOOL|${today}|${lat}|${lng}|${rad}|${sig}`);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl">Admin QR</h1>

      <div className="grid grid-cols-3 gap-2">
        <input value={lat} onChange={e => setLat(e.target.value)} placeholder="Lat" />
        <input value={lng} onChange={e => setLng(e.target.value)} placeholder="Lng" />
        <input value={radius} onChange={e => setRadius(e.target.value)} placeholder="Radius" />
      </div>

      <button onClick={save} className="bg-green-600 px-4 py-2 rounded">
        Save & Generate
      </button>

      {qrValue && (
        <div className="bg-white p-4 w-fit">
          <QRCode value={qrValue} />
        </div>
      )}
    </div>
  );
}
