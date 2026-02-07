// @AI-HINT: Root proposals redirect - redirects to role-specific proposals page
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api';

export default function ProposalsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Get user role from localStorage or default to freelancer
    const authToken = getAuthToken();
    const userRole = localStorage.getItem('user_role') || 'freelancer';
    
    if (!authToken) {
      router.replace('/login');
      return;
    }

    // Redirect based on role
    if (userRole.toLowerCase() === 'client') {
      router.replace('/client/projects');
    } else if (userRole.toLowerCase() === 'admin') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/freelancer/proposals');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-[var(--color-primary)] rounded-full animate-spin" />
        <p className="text-sm text-[var(--text-secondary)]">Redirecting to proposals...</p>
      </div>
    </div>
  );
}
