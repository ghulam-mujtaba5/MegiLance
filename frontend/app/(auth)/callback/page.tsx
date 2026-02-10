// @AI-HINT: Handles OAuth2 callback from social providers. Exchanges code for tokens.
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import api, { setAuthToken, setRefreshToken } from '@/lib/api';
import Button from '@/app/components/Button/Button';

import commonStyles from './AuthCallback.common.module.css';
import lightStyles from './AuthCallback.light.module.css';
import darkStyles from './AuthCallback.dark.module.css';

export default function AuthCallbackPageWrapper() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>Authenticating...</div>
      </div>
    }>
      <AuthCallbackPage />
    </Suspense>
  );
}

function AuthCallbackPage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Authenticating...');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(`Authentication failed: ${error}`);
        showToast(`Authentication failed: ${error}`, 'error');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Invalid callback parameters.');
        showToast('Invalid callback parameters.', 'error');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      try {
        const response: any = await api.socialAuth.complete(code, state);

        if (response.success) {
          if (response.action === 'login' || response.action === 'register') {
            setAuthToken(response.access_token);
            setRefreshToken(response.refresh_token);

            if (response.user) {
              localStorage.setItem('user', JSON.stringify(response.user));
            }

            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            showToast(
              `Successfully ${response.action === 'register' ? 'registered' : 'logged in'}!`,
              'success',
            );

            const storedRole = localStorage.getItem('portal_area');
            let redirectPath = '/client/dashboard';

            if (response.user?.role) {
              redirectPath =
                response.user.role === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard';
            } else if (storedRole) {
              redirectPath =
                storedRole === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard';
            }

            localStorage.removeItem('portal_area');
            setTimeout(() => router.push(redirectPath), 1000);
          } else if (response.action === 'linked') {
            setStatus('success');
            setMessage('Account linked successfully!');
            showToast('Account linked successfully!', 'success');
            setTimeout(() => router.push('/settings/security'), 2000);
          }
        } else {
          throw new Error(response.error || 'Authentication failed');
        }
      } catch (err: any) {
        console.error('Social auth error:', err);
        setStatus('error');
        setMessage(err.message || 'Authentication failed. Please try again.');
        showToast(err.message || 'Authentication failed', 'error');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (!resolvedTheme) return null;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={cn(commonStyles.card, themeStyles.card)}>
        {status === 'loading' && (
          <>
            <div className={cn(commonStyles.spinner, themeStyles.spinner)} />
            <h2 className={cn(commonStyles.title, themeStyles.title)}>Verifying...</h2>
            <p className={cn(commonStyles.message, themeStyles.message)}>{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className={cn(commonStyles.iconWrap, themeStyles.iconWrapSuccess)}>
              <CheckCircle />
            </div>
            <h2 className={cn(commonStyles.title, themeStyles.title)}>Success!</h2>
            <p className={cn(commonStyles.message, themeStyles.message)}>{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className={cn(commonStyles.iconWrap, themeStyles.iconWrapError)}>
              <XCircle />
            </div>
            <h2 className={cn(commonStyles.title, themeStyles.title)}>Error</h2>
            <p className={cn(commonStyles.message, themeStyles.messageError)}>{message}</p>
            <div className={commonStyles.actions}>
              <Button variant="primary" size="md" onClick={() => router.push('/login')}>
                Return to Login
              </Button>
            </div>
          </>
        )}
      </div>

      {toast && (
        <div
          className={cn(
            commonStyles.toast,
            themeStyles.toast,
            toast.type === 'error' && themeStyles.toastError,
          )}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
