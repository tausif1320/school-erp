'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';

type QRSession = {
  token: string;
  expires_at: string;
};

export default function QRManagementPage() {
  const [session, setSession] = useState<QRSession | null>(null);
  const [loading, setLoading] = useState(false);

  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    latitude: '',
    longitude: '',
    radius: '',
  });

  /* =========================
     LOAD LATEST QR SESSION
  ========================= */
  async function loadQRSession() {
    const { data } = await supabase
      .from('qr_sessions')
      .select('token, expires_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setSession(data ?? null);
  }

  /* =========================
     LOAD OR INIT QR SETTINGS
  ========================= */
  async function loadSettings() {
    const { data } = await supabase
      .from('qr_settings')
      .select('id, latitude, longitude, radius')
      .single();

    if (data) {
      setSettingsId(data.id);
      setSettings({
        latitude: String(data.latitude ?? ''),
        longitude: String(data.longitude ?? ''),
        radius: String(data.radius ?? ''),
      });
      return;
    }

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
    const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();

    const { error } = await supabase.from('qr_sessions').insert({
      token,
      expires_at: expiresAt,
    });

    if (error) {
      toast.error('Failed to generate QR');
      setLoading(false);
      return;
    }

    toast.success('QR generated');
    await loadQRSession();
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
      () => {
        toast.error('Location permission denied');
      }
    );
  }

  /* =========================
     SAVE SETTINGS
  ========================= */
  async function saveSettings() {
    if (!settingsId) {
      toast.error('QR settings not ready');
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
    loadQRSession();
    loadSettings();
  }, []);

  /* =========================
     UI
  ========================= */
  return (
    <div>
      <h1 className="text-2xl mb-4">QR Management</h1>

      {/* STATUS */}
      <div className="bg-zinc-900 p-4 rounded-xl mb-6">
        <p className="text-sm text-zinc-400">Current QR Status</p>
        <p className="font-bold text-green-500">
          {session ? 'Active (Latest QR)' : 'No QR Generated'}
        </p>
        {session && (
          <p className="text-xs text-zinc-400">
            Expires at: {new Date(session.expires_at).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* QR */}
      <div className="bg-zinc-900 p-6 rounded-xl mb-6 flex flex-col items-center">
        {session ? (
          <div className="bg-white p-4 rounded-lg">
            <QRCode
              size={200}
              value={JSON.stringify({
                token: session.token,
                type: 'teacher_attendance',
              })}
            />
          </div>
        ) : (
          <p className="text-zinc-400">Generate a new QR</p>
        )}

        <button
          onClick={generateQR}
          disabled={loading}
          className="mt-4 bg-blue-600 px-4 py-2 rounded"
        >
          {loading ? 'Generating…' : 'Refresh QR'}
        </button>
      </div>

      {/* LOCATION SETTINGS */}
      <div className="bg-zinc-900 p-6 rounded-xl">
        <h2 className="text-lg mb-4">Location Settings</h2>

        <div className="grid grid-cols-3 gap-4 mb-4">
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
            className="bg-zinc-700 px-4 py-2 rounded"
          >
            Use Current Location
          </button>

          <button
            onClick={saveSettings}
            className="bg-green-600 px-4 py-2 rounded"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
