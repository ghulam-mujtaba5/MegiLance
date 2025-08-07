// @AI-HINT: This is the Forgot Password page, redesigned to match the premium two-panel layout of the Login and Signup pages for a consistent user experience.
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import { FaKey } from 'react-icons/fa';

import commonStyles from '../Login/Login.common.module.css';
import lightStyles from '../Login/Login.light.module.css';
import darkStyles from '../Login/Login.dark.module.css';

// @AI-HINT: A static branding panel for consistency across auth pages.
const BrandingPanel: React.FC<{ styles: any }> = ({ styles }) => {
  return (
    <div className={styles.brandingPanel}>
      <div className={styles.brandingContent}>
        <div className={styles.brandingIconWrapper}>
          <FaKey className={styles.brandingIcon} />
        </div>
        <h2 className={styles.brandingTitle}>Secure Your Account</h2>
        <p className={styles.brandingText}>Enter your email to receive a secure link to reset your password and regain access to your account.</p>
      </div>
      <div className={styles.brandingFooter}>
        <p>&copy; {new Date().getFullYear()} MegiLance. All rights reserved.</p>
      </div>
    </div>
  );
};

const ForgotPassword: React.FC = () => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    console.log('Password reset requested for:', email);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  const styles = React.useMemo(() => {
    const themeStyles = theme === 'light' ? lightStyles : darkStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  return (
    <div className={styles.loginPage}>
      <BrandingPanel styles={styles} />
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
                No problem. Enter your email and we'll send you a reset link.
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
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <Button type="submit" variant="primary" fullWidth isLoading={loading} disabled={loading || !email} className={styles.submitButton}>
                {loading ? 'Sending Link...' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          <div className={styles.signupPrompt}>
            <p>Remembered your password? <Link href="/login">Back to Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
