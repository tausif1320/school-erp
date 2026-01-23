import { Suspense } from 'react';
import LoginClient from './LoginClient';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginClient />
    </Suspense>
  );
}

function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center text-zinc-400">
      Loading login…
    </div>
  );
}
