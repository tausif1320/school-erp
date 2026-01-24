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

  /* =========================
     LOAD LATEST QR
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
     GENERATE QR (TOKEN ONLY)
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

    toast.success('New QR generated');
    await loadQRSession();
    setLoading(false);
  }

  useEffect(() => {
    loadQRSession();
  }, []);

  /* =========================
     UI
  ========================= */
  return (
    <div>
      <h1 className="text-2xl mb-6">QR Management</h1>

      <div className="bg-zinc-900 p-6 rounded-xl flex flex-col items-center gap-4">
        {session ? (
          <>
            <div className="bg-white p-4 rounded-lg">
              <QRCode value={session.token} size={220} />
            </div>

            <p className="text-sm text-zinc-400">
              Expires at{' '}
              <span className="text-zinc-200">
                {new Date(session.expires_at).toLocaleTimeString()}
              </span>
            </p>
          </>
        ) : (
          <p className="text-zinc-400">No active QR</p>
        )}

        <button
          onClick={generateQR}
          disabled={loading}
          className="bg-blue-600 px-4 py-2 rounded"
        >
          {loading ? 'Generating…' : 'Generate New QR'}
        </button>
      </div>
    </div>
  );
}
