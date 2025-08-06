// @AI-HINT: This is the Forgot Password page, redesigned to match the premium two-panel layout of the Login and Signup pages for a consistent user experience.
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import { MegiLanceLogo } from '@/app/components/MegiLanceLogo/MegiLanceLogo';

import styles from '../Login/Login.common.module.css';
import lightStyles from '../Login/Login.light.module.css';
import darkStyles from '../Login/Login.dark.module.css';

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

  const currentThemeStyles = theme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(styles.pageContainer, currentThemeStyles.pageContainer)}>
      <div className={cn(styles.leftPanel, currentThemeStyles.leftPanel)}>
        <div className={styles.logoContainer}>
          <MegiLanceLogo />
        </div>
        <div className={styles.brandingContainer}>
          <h1 className={styles.brandingTitle}>MegiLance</h1>
          <p className={styles.brandingSubtitle}>Your Vision, Our Talent.</p>
        </div>
      </div>
      <div className={cn(styles.rightPanel, currentThemeStyles.rightPanel)}>
        <div className={styles.formContainer}>
          <h2 className={cn(styles.title, currentThemeStyles.title)}>Forgot Password?</h2>
          {submitted ? (
            <p className={cn(styles.subtitle, currentThemeStyles.subtitle)}>
              If an account with that email exists, we&apos;ve sent instructions to reset your password.
            </p>
          ) : (
            <p className={cn(styles.subtitle, currentThemeStyles.subtitle)}>
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          )}

          {!submitted && (
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button variant="primary" fullWidth type="submit" disabled={loading || !email}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          <p className={cn(styles.footerLink, currentThemeStyles.footerLink)}>
            <Link href="/Login">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
