'use client';

import QRCode from 'react-qr-code';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function QRManagementPage() {
  const [payload, setPayload] = useState<string>('');

  // regenerate QR every 30 seconds
  useEffect(() => {
    generateQR();
    const interval = setInterval(generateQR, 30_000);
    return () => clearInterval(interval);
  }, []);

  function generateQR() {
    const data = {
      type: 'teacher_attendance',
      issuedAt: Date.now(),
    };
    setPayload(JSON.stringify(data));
  }

  return (
    <div>
      <h1 className="text-2xl mb-6">QR Management</h1>

      <div className="bg-zinc-900 p-6 rounded-xl flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-lg">
          <QRCode size={220} value={payload} />
        </div>

        <p className="text-sm text-zinc-400">
          QR auto-refreshes every 30 seconds
        </p>

        <button
          onClick={() => {
            generateQR();
            toast.success('QR refreshed');
          }}
          className="bg-blue-600 px-4 py-2 rounded"
        >
          Refresh QR
        </button>
      </div>
    </div>
  );
}
