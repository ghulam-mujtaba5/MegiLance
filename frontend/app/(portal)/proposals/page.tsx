// @AI-HINT: Root proposals redirect - redirects to role-specific proposals page
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProposalsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Get user role from localStorage or default to freelancer
    const authToken = localStorage.getItem('auth_token');
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
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Redirecting to proposals...</p>
      </div>
    </div>
  );
}
