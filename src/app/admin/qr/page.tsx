'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function AdminQRPage() {
  const [payload, setPayload] = useState('');
  const [settings, setSettings] = useState({
    latitude: '',
    longitude: '',
    radius: '50',
  });

  useEffect(() => {
    regenerateQR();
    loadSettings();
    const interval = setInterval(regenerateQR, 30_000);
    return () => clearInterval(interval);
  }, []);

  function regenerateQR() {
    setPayload(
      JSON.stringify({
        type: 'teacher_attendance',
        issuedAt: Date.now(),
      })
    );
  }

  async function loadSettings() {
    const { data } = await supabase
      .from('qr_settings')
      .select('*')
      .single();

    if (data) {
      setSettings({
        latitude: String(data.latitude),
        longitude: String(data.longitude),
        radius: String(data.radius),
      });
    }
  }

  function useCurrentLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSettings({
          ...settings,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        });
        toast.success('Location fetched');
      },
      () => toast.error('Location permission denied')
    );
  }

  async function saveSettings() {
    await supabase.from('qr_settings').upsert({
      id: 1,
      latitude: Number(settings.latitude),
      longitude: Number(settings.longitude),
      radius: Number(settings.radius),
    });
    toast.success('QR location settings saved');
  }

  return (
    <div>
      <h1 className="text-2xl mb-6">QR Management</h1>

      <div className="bg-zinc-900 p-6 rounded-xl flex flex-col items-center gap-4 mb-6">
        <div className="bg-white p-4 rounded">
          <QRCode value={payload} size={220} />
        </div>

        <button
          onClick={regenerateQR}
          className="bg-blue-600 px-4 py-2 rounded"
        >
          Refresh QR
        </button>
      </div>

      <div className="bg-zinc-900 p-6 rounded-xl">
        <h2 className="mb-4">Location Validation</h2>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <input
            className="bg-zinc-800 p-2 rounded"
            placeholder="Latitude"
            value={settings.latitude}
            onChange={(e) =>
              setSettings({ ...settings, latitude: e.target.value })
            }
          />
          <input
            className="bg-zinc-800 p-2 rounded"
            placeholder="Longitude"
            value={settings.longitude}
            onChange={(e) =>
              setSettings({ ...settings, longitude: e.target.value })
            }
          />
          <input
            className="bg-zinc-800 p-2 rounded"
            placeholder="Radius (meters)"
            value={settings.radius}
            onChange={(e) =>
              setSettings({ ...settings, radius: e.target.value })
            }
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={useCurrentLocation}
            className="bg-zinc-700 px-4 py-2 rounded"
          >
            Use Current Location
          </button>
          <button
            onClick={saveSettings}
            className="bg-green-600 px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
