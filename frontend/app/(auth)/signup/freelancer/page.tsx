// @AI-HINT: Redirect page for /signup/freelancer to /signup with freelancer role pre-selected
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupFreelancerPage() {
  const router = useRouter();

  useEffect(() => {
    // Store the role preference and redirect
    try {
      window.localStorage.setItem('signup_role', 'freelancer');
    } catch (e) {
      // localStorage not available
    }
    router.replace('/signup?role=freelancer');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}
