// @AI-HINT: Root refunds page - redirects to refund creation
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api';

export default function RefundsRedirect() {
  const router = useRouter();

  useEffect(() => {
    const authToken = getAuthToken();
    if (!authToken) {
      router.replace('/login?returnTo=/refunds');
      return;
    }

    const portalArea = localStorage.getItem('portal_area') || 'client';
    if (portalArea === 'admin') {
      router.replace('/admin/refunds');
    } else {
      router.replace('/refunds/create');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[var(--color-primary)] rounded-full animate-spin" />
        <p className="text-sm text-[var(--text-secondary)]">Loading refunds...</p>
      </div>
    </div>
  );
}
