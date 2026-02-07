// @AI-HINT: Freelancer root page - redirects to freelancer dashboard
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FreelancerRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/freelancer/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-[var(--color-primary)] rounded-full animate-spin" />
        <p className="text-sm text-[var(--text-secondary)]">Loading dashboard...</p>
      </div>
    </div>
  );
}
