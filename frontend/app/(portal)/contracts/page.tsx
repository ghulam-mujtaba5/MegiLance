// @AI-HINT: Root contracts page - redirects to role-specific contracts view
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api';

export default function ContractsRedirect() {
  const router = useRouter();

  useEffect(() => {
    const authToken = getAuthToken();
    if (!authToken) {
      router.replace('/login?returnTo=/contracts');
      return;
    }

    const portalArea = localStorage.getItem('portal_area') || 'client';
    if (portalArea === 'freelancer') {
      router.replace('/freelancer/contracts');
    } else if (portalArea === 'admin') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/client/contracts');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-[var(--color-primary)] rounded-full animate-spin" />
        <p className="text-sm text-[var(--text-secondary)]">Loading contracts...</p>
      </div>
    </div>
  );
}
