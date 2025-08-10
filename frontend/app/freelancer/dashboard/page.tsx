// @AI-HINT: This is the Next.js route file for the Freelancer Dashboard. It delegates to the Dashboard component.
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// @AI-HINT: This public route used to render under the website layout. Redirect to portal-scoped /dashboard instead.
export default function FreelancerDashboardPublicRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);
  return null;
}
