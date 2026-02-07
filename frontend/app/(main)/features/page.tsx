// @AI-HINT: Features page - redirects to homepage features section

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FeaturesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to homepage features section
    router.replace('/#features');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-[var(--color-primary)] rounded-full animate-spin" />
        <p className="text-sm text-[var(--text-secondary)]">Redirecting to features...</p>
      </div>
    </div>
  );
}
