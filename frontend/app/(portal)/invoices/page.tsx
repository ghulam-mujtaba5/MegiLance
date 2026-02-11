// @AI-HINT: Root invoices page - redirects to role-specific invoices view
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api';

export default function InvoicesRedirect() {
  const router = useRouter();

  useEffect(() => {
    const authToken = getAuthToken();
    if (!authToken) {
      router.replace('/login?returnTo=/invoices');
      return;
    }

    const portalArea = localStorage.getItem('portal_area') || 'client';
    if (portalArea === 'freelancer') {
      router.replace('/freelancer/invoices');
    } else if (portalArea === 'admin') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/client/invoices');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[var(--color-primary)] rounded-full animate-spin" />
        <p className="text-sm text-[var(--text-secondary)]">Loading invoices...</p>
      </div>
    </div>
  );
}
