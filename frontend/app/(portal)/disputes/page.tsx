// @AI-HINT: Root disputes page - redirects to role-specific disputes view
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api';

export default function DisputesRedirect() {
  const router = useRouter();

  useEffect(() => {
    const authToken = getAuthToken();
    if (!authToken) {
      router.replace('/login?returnTo=/disputes');
      return;
    }

    const portalArea = localStorage.getItem('portal_area') || 'client';
    if (portalArea === 'admin') {
      router.replace('/admin/disputes');
    } else {
      router.replace('/disputes/create');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[var(--color-primary)] rounded-full animate-spin" />
        <p className="text-sm text-[var(--text-secondary)]">Loading disputes...</p>
      </div>
    </div>
  );
}
