// @AI-HINT: Root proposals redirect - redirects to role-specific proposals page
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api';

export default function ProposalsRedirect() {
  const router = useRouter();

  useEffect(() => {
    const authToken = getAuthToken();
    const portalArea = localStorage.getItem('portal_area') || 'freelancer';
    
    if (!authToken) {
      router.replace('/login');
      return;
    }

    // Redirect based on role
    if (portalArea.toLowerCase() === 'client') {
      router.replace('/client/projects');
    } else if (portalArea.toLowerCase() === 'admin') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/freelancer/proposals');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[var(--color-primary)] rounded-full animate-spin" />
        <p className="text-sm text-[var(--text-secondary)]">Redirecting to proposals...</p>
      </div>
    </div>
  );
}
