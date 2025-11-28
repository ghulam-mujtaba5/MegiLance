// @AI-HINT: This is the Forgot Password page, redesigned to match the premium two-panel layout of the Login and Signup pages for a consistent user experience.
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import { FaKey } from 'react-icons/fa';
import AuthBrandingPanel from '@/app/components/Auth/BrandingPanel/BrandingPanel';

import commonStyles from './ForgotPassword.common.module.css';
import lightStyles from './ForgotPassword.light.module.css';
import darkStyles from './ForgotPassword.dark.module.css';

const forgotPasswordBranding = {
  brandIcon: FaKey,
  brandTitle: 'Secure Your Account',
  brandText: 'Enter your email to receive a secure link to reset your password and regain access to your account.',
};

const ForgotPassword: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string): boolean => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Email is required.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (trimmed.length > 254) {
      setError('Email address is too long.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;
    
    setLoading(true);
    try {
      // Call the password reset API
      const response = await fetch('/backend/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      
      // Always show success to prevent email enumeration
      setSubmitted(true);
    } catch (err) {
      // Still show success to prevent email enumeration attacks
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const styles = React.useMemo(() => {
    const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
    const merge = (key: keyof typeof commonStyles) => cn((commonStyles as any)[key], (themeStyles as any)[key]);
    return {
      loginPage: merge('loginPage'),
      brandingSlot: merge('brandingSlot'),
      brandingPanel: merge('brandingPanel'),
      brandingContent: merge('brandingContent'),
      brandingIconWrapper: merge('brandingIconWrapper'),
      brandingIcon: merge('brandingIcon'),
      brandingTitle: merge('brandingTitle'),
      brandingText: merge('brandingText'),
      brandingFooter: merge('brandingFooter'),
      formPanel: merge('formPanel'),
      formContainer: merge('formContainer'),
      formHeader: merge('formHeader'),
      formTitle: merge('formTitle'),
      formSubtitle: merge('formSubtitle'),
      socialAuth: merge('socialAuth'),
      divider: merge('divider'),
      dividerText: merge('dividerText'),
      loginForm: merge('loginForm'),
      inputGroup: merge('inputGroup'),
      passwordToggle: merge('passwordToggle'),
      formOptions: merge('formOptions'),
      forgotPasswordLink: merge('forgotPasswordLink'),
      submitButton: merge('submitButton'),
      signupPrompt: merge('signupPrompt'),
      generalError: merge('generalError'),
    } as const;
  }, [resolvedTheme]);

  return (
    <div className={styles.loginPage}>
      <div className={styles.brandingSlot}>
        <AuthBrandingPanel roleConfig={forgotPasswordBranding} />
      </div>
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Forgot Password?</h1>
            {submitted ? (
              <p className={styles.formSubtitle}>
                If an account with that email exists, we&apos;ve sent instructions to reset your password.
              </p>
            ) : (
              <p className={styles.formSubtitle}>
                No problem. Enter your email and we&apos;ll send you a reset link.
              </p>
            )}
          </div>

          {!submitted && (
            <form onSubmit={handleSubmit} noValidate className={styles.loginForm}>
              <Input
                id="email"
                name="email"
                type="email"
                label="Email Address"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                error={error}
                disabled={loading}
                aria-describedby={error ? 'email-error' : undefined}
              />
              <Button type="submit" variant="primary" fullWidth isLoading={loading} disabled={loading || !email.trim()} className={styles.submitButton}>
                {loading ? 'Sending Link...' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          <div className={styles.signupPrompt}>
            <p>Remembered your password? <Link href="/login">Back to Sign In</Link></p>
            <p className="mt-1">Or <Link href="/passwordless">sign in with a magic link</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
