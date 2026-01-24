'use client';

import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

/* =========================
   IST DATE HELPER
========================= */
function getISTDate() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  return ist.toISOString().slice(0, 10);
}

export default function AdminQRPage() {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('');
  const [qrValue, setQrValue] = useState('');

  /* =========================
     LOAD SETTINGS
  ========================= */
  async function loadSettings() {
    const { data, error } = await supabase
      .from('qr_settings')
      .select('*')
      .single();

    if (error || !data) {
      toast.error('QR settings not found');
      return;
    }

    setLatitude(String(data.latitude));
    setLongitude(String(data.longitude));
    setRadius(String(data.radius));

    generateQR(data.latitude, data.longitude, data.radius);
  }

  /* =========================
     GENERATE QR (IST)
  ========================= */
  function generateQR(lat: number, lng: number, rad: number) {
    const today = getISTDate();
    const secret = process.env.NEXT_PUBLIC_QR_SECRET!;

    const signature = btoa(
      `${today}|${lat}|${lng}|${rad}|${secret}`
    );

    const value = `SCHOOL_QR|${today}|${lat}|${lng}|${rad}|${signature}`;
    setQrValue(value);
  }

  /* =========================
     SAVE SETTINGS
  ========================= */
  async function saveSettings() {
    if (!latitude || !longitude || !radius) {
      toast.error('All fields required');
      return;
    }

    const { error } = await supabase
      .from('qr_settings')
      .upsert({
        id: 1,
        latitude: Number(latitude),
        longitude: Number(longitude),
        radius: Number(radius),
      });

    if (error) {
      toast.error('Failed to save settings');
      return;
    }

    generateQR(Number(latitude), Number(longitude), Number(radius));
    toast.success('QR settings saved');
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
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
      },
      () => toast.error('Location permission denied'),
      { enableHighAccuracy: true }
    );
  }

  useEffect(() => {
    loadSettings();
  }, []);

  /* =========================
     UI
  ========================= */
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl mb-4">QR Management</h1>

      <div className="bg-zinc-900 p-4 rounded-xl space-y-3">
        <input
          className="p-2 bg-zinc-800 rounded w-full"
          placeholder="Latitude"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
        />

        <input
          className="p-2 bg-zinc-800 rounded w-full"
          placeholder="Longitude"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
        />

        <input
          className="p-2 bg-zinc-800 rounded w-full"
          placeholder="Radius (meters)"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
        />

        <div className="flex gap-2">
          <button
            onClick={useCurrentLocation}
            className="flex-1 bg-zinc-700 py-2 rounded"
          >
            Use Current Location
          </button>

          <button
            onClick={saveSettings}
            className="flex-1 bg-green-600 py-2 rounded"
          >
            Save & Generate
          </button>
        </div>
      </div>

      {qrValue && (
        <div className="mt-6 bg-white p-4 rounded-xl flex justify-center">
          <QRCode value={qrValue} size={220} />
        </div>
      )}

      <p className="text-sm text-zinc-400 mt-2">
        QR valid for: <b>{getISTDate()}</b> (IST)
      </p>
    </div>
  );
}
