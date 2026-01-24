'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { supabase } from '@/lib/supabase';

export default function AdminQRPage() {
  const [settings, setSettings] = useState<{
    latitude: number;
    longitude: number;
    radius: number;
  } | null>(null);

  const [form, setForm] = useState({
    latitude: '',
    longitude: '',
    radius: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data } = await supabase
      .from('qr_settings')
      .select('latitude, longitude, radius')
      .single();

    if (data) {
      setSettings(data);
      setForm({
        latitude: String(data.latitude),
        longitude: String(data.longitude),
        radius: String(data.radius),
      });
    }
  }

  async function saveSettings() {
    const payload = {
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      radius: Number(form.radius),
      updated_at: new Date().toISOString(),
    };

    await supabase.from('qr_settings').upsert(payload);
    loadSettings();
  }

  function useCurrentLocation() {
    navigator.geolocation.getCurrentPosition((pos) => {
      setForm({
        ...form,
        latitude: String(pos.coords.latitude),
        longitude: String(pos.coords.longitude),
      });
    });
  }

  if (!settings) return <p>Loading QR settings...</p>;

  const today = new Date().toISOString().slice(0, 10);
  const secret = process.env.NEXT_PUBLIC_QR_SECRET!;
  const signature = btoa(
    `${today}|${settings.latitude}|${settings.longitude}|${settings.radius}|${secret}`
  );

  const qrValue = `SCHOOL_CHECKIN|${today}|${settings.latitude}|${settings.longitude}|${settings.radius}|${signature}`;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl mb-4">Daily Attendance QR</h1>

      <div className="bg-zinc-900 p-4 rounded-xl mb-6 space-y-2">
        <input
          className="p-2 bg-zinc-800 rounded w-full"
          placeholder="Latitude"
          value={form.latitude}
          onChange={(e) => setForm({ ...form, latitude: e.target.value })}
        />
        <input
          className="p-2 bg-zinc-800 rounded w-full"
          placeholder="Longitude"
          value={form.longitude}
          onChange={(e) => setForm({ ...form, longitude: e.target.value })}
        />
        <input
          className="p-2 bg-zinc-800 rounded w-full"
          placeholder="Radius (meters)"
          value={form.radius}
          onChange={(e) => setForm({ ...form, radius: e.target.value })}
        />

        <div className="flex gap-2">
          <button onClick={useCurrentLocation} className="bg-blue-600 px-3 py-2 rounded">
            Use Current Location
          </button>
          <button onClick={saveSettings} className="bg-green-600 px-3 py-2 rounded">
            Save
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl flex justify-center">
        <QRCode value={qrValue} size={256} />
      </div>

      <p className="text-center text-zinc-400 mt-2">
        Valid only for today ({today})
      </p>
    </div>
  );
}
