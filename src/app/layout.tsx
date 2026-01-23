import './globals.css';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100">
        {children}

        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 2500,
            style: {
              background: '#18181b', // zinc-900
              color: '#fafafa',
            },
            success: {
              style: {
                border: '1px solid #22c55e',
              },
            },
            error: {
              style: {
                border: '1px solid #ef4444',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
