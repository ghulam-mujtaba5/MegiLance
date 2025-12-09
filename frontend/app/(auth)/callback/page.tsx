'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api, { setAuthToken, setRefreshToken } from '@/lib/api';
import { toast } from 'react-hot-toast';

// @AI-HINT: Handles OAuth2 callback from social providers. Exchanges code for tokens.
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Authenticating...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(`Authentication failed: ${error}`);
        toast.error(`Authentication failed: ${error}`);
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Invalid callback parameters.');
        toast.error('Invalid callback parameters.');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      try {
        const response: any = await api.socialAuth.complete(code, state);

        if (response.success) {
          if (response.action === 'login' || response.action === 'register') {
            // Store tokens
            setAuthToken(response.access_token);
            setRefreshToken(response.refresh_token);
            
            // Store user info if needed
            if (response.user) {
              localStorage.setItem('user', JSON.stringify(response.user));
            }

            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            toast.success(`Successfully ${response.action === 'register' ? 'registered' : 'logged in'}!`);

            // Determine redirect path
            // Check for stored role preference from signup/login flow
            const storedRole = localStorage.getItem('portal_area');
            let redirectPath = '/client/dashboard'; // Default
            
            if (response.user.role) {
               // If backend returns role, use it
               redirectPath = response.user.role === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard';
            } else if (storedRole) {
               // Fallback to stored preference
               redirectPath = storedRole === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard';
            }

            // Clear temp storage
            localStorage.removeItem('portal_area');

            setTimeout(() => router.push(redirectPath), 1000);
          } else if (response.action === 'linked') {
             // Handle account linking scenario (if triggered from settings)
             setStatus('success');
             setMessage('Account linked successfully!');
             toast.success('Account linked successfully!');
             setTimeout(() => router.push('/settings/security'), 2000);
          }
        } else {
          throw new Error(response.error || 'Authentication failed');
        }
      } catch (err: any) {
        console.error('Social auth error:', err);
        setStatus('error');
        setMessage(err.message || 'Authentication failed. Please try again.');
        toast.error(err.message || 'Authentication failed');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Verifying...</h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 text-2xl">✓</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Success!</h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 text-2xl">✕</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error</h2>
            <p className="text-red-600 dark:text-red-400 mb-4">{message}</p>
            <button 
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
