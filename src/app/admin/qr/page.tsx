'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

type QRSettings = {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
};

export default function AdminQRPage() {
  const [settings, setSettings] = useState<QRSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    latitude: '',
    longitude: '',
    radius: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);

    const { data, error } = await supabase
      .from('qr_settings')
      .select('*')
      .limit(1)
      .single();

    if (data) {
      setSettings(data);
      setForm({
        latitude: String(data.latitude),
        longitude: String(data.longitude),
        radius: String(data.radius),
      });
    }

    setLoading(false);
  }

  async function saveSettings() {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    const rad = Number(form.radius);

    if (!lat || !lng || !rad) {
      toast.error('Fill all fields');
      return;
    }

    if (settings) {
      // UPDATE existing row
      await supabase
        .from('qr_settings')
        .update({
          latitude: lat,
          longitude: lng,
          radius: rad,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);
    } else {
      // INSERT first row
      await supabase.from('qr_settings').insert({
        latitude: lat,
        longitude: lng,
        radius: rad,
      });
    }

    toast.success('QR location saved');
    loadSettings();
  }

  function useCurrentLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm({
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
          radius: form.radius || '150',
        });
      },
      () => toast.error('Location permission denied'),
      { enableHighAccuracy: true }
    );
  }

  if (loading) return <p>Loading QR settings…</p>;
  if (!settings) return <p>No QR settings found</p>;

  const today = new Date().toISOString().slice(0, 10);
  const secret = process.env.NEXT_PUBLIC_QR_SECRET!;

  const signature = btoa(
    `${today}|${settings.latitude}|${settings.longitude}|${settings.radius}|${secret}`
  );

  const qrValue = `SCHOOL_CHECKIN|${today}|${settings.latitude}|${settings.longitude}|${settings.radius}|${signature}`;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl mb-4">Daily Attendance QR</h1>

      <div className="bg-zinc-900 p-4 rounded-xl space-y-2 mb-6">
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
          <button
            onClick={useCurrentLocation}
            className="bg-blue-600 px-3 py-2 rounded"
          >
            Use Current Location
          </button>
          <button
            onClick={saveSettings}
            className="bg-green-600 px-3 py-2 rounded"
          >
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
