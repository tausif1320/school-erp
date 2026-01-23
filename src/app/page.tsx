import { Suspense } from 'react';
import RoleSelectClient from './role-select-client';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RoleSelectClient />
    </Suspense>
  );
}
