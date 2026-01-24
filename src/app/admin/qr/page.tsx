'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';

type QRSession = {
  token: string;
  expires_at: string;
};

export default function AdminQRPage() {
  const [qr, setQr] = useState<QRSession | null>(null);
  const [loading, setLoading] = useState(false);

  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    latitude: '',
    longitude: '',
    radius: '',
  });

  /* =========================
     LOAD LATEST QR
  ========================= */
  async function loadLatestQR() {
    const { data, error } = await supabase
      .from('qr_sessions')
      .select('token, expires_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error) {
      setQr(data ?? null);
    }
  }

  /* =========================
     LOAD OR CREATE SETTINGS
  ========================= */
  async function loadSettings() {
    const { data } = await supabase
      .from('qr_settings')
      .select('id, latitude, longitude, radius')
      .single();

    if (data) {
      setSettingsId(data.id);
      setSettings({
        latitude: String(data.latitude),
        longitude: String(data.longitude),
        radius: String(data.radius),
      });
      return;
    }

    // create default settings
    const { data: created, error } = await supabase
      .from('qr_settings')
      .insert({
        latitude: 0,
        longitude: 0,
        radius: 50,
      })
      .select()
      .single();

    if (error || !created) {
      toast.error('Failed to initialize QR settings');
      return;
    }

    setSettingsId(created.id);
    setSettings({
      latitude: String(created.latitude),
      longitude: String(created.longitude),
      radius: String(created.radius),
    });
  }

  /* =========================
     GENERATE QR
  ========================= */
  async function generateQR() {
    setLoading(true);

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 1000).toISOString(); // 1 min

    const { error } = await supabase.from('qr_sessions').insert({
      token,
      expires_at: expiresAt,
    });

    if (error) {
      toast.error('Failed to generate QR');
      setLoading(false);
      return;
    }

    toast.success('New QR generated');
    await loadLatestQR();
    setLoading(false);
  }

  /* =========================
     USE CURRENT LOCATION
  ========================= */
  function useCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSettings({
          ...settings,
          latitude: pos.coords.latitude.toString(),
          longitude: pos.coords.longitude.toString(),
        });
        toast.success('Location fetched');
      },
      () => toast.error('Location permission denied')
    );
  }

  /* =========================
     SAVE SETTINGS
  ========================= */
  async function saveSettings() {
    if (!settingsId) {
      toast.error('Settings not ready');
      return;
    }

    const { error } = await supabase
      .from('qr_settings')
      .update({
        latitude: Number(settings.latitude),
        longitude: Number(settings.longitude),
        radius: Number(settings.radius),
      })
      .eq('id', settingsId);

    if (error) {
      toast.error('Failed to save settings');
      return;
    }

    toast.success('Location settings saved');
  }

  /* =========================
     INIT
  ========================= */
  useEffect(() => {
    loadLatestQR();
    loadSettings();
  }, []);

  /* =========================
     UI
  ========================= */
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl mb-6">QR Management</h1>

      {/* QR STATUS */}
      <div className="bg-zinc-900 p-4 rounded-xl mb-6">
        <p className="text-sm text-zinc-400">QR Status</p>
        <p className="font-bold text-green-500">
          {qr ? 'Active QR' : 'No QR Generated'}
        </p>
        {qr && (
          <p className="text-xs text-zinc-400">
            Expires at: {new Date(qr.expires_at).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* QR CODE */}
      <div className="bg-zinc-900 p-6 rounded-xl flex flex-col items-center mb-6">
        {qr ? (
          <div className="bg-white p-4 rounded-lg">
            {/* IMPORTANT: TOKEN ONLY */}
            <QRCode value={qr.token} size={200} />
          </div>
        ) : (
          <p className="text-zinc-400">Generate a QR</p>
        )}

        <button
          onClick={generateQR}
          disabled={loading}
          className="mt-4 px-4 py-2 bg-blue-600 rounded"
        >
          {loading ? 'Generating…' : 'Generate QR'}
        </button>
      </div>

      {/* LOCATION SETTINGS */}
      <div className="bg-zinc-900 p-6 rounded-xl">
        <h2 className="text-lg mb-4">Location Settings</h2>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <input
            className="p-2 bg-zinc-800 rounded"
            placeholder="Latitude"
            value={settings.latitude}
            onChange={(e) =>
              setSettings({ ...settings, latitude: e.target.value })
            }
          />
          <input
            className="p-2 bg-zinc-800 rounded"
            placeholder="Longitude"
            value={settings.longitude}
            onChange={(e) =>
              setSettings({ ...settings, longitude: e.target.value })
            }
          />
          <input
            className="p-2 bg-zinc-800 rounded"
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
            className="px-4 py-2 bg-zinc-700 rounded"
          >
            Use Current Location
          </button>
          <button
            onClick={saveSettings}
            className="px-4 py-2 bg-green-600 rounded"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
