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
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600 dark:text-gray-400">Redirecting to features...</p>
    </div>
  );
}
