// @AI-HINT: This is the Reset Password page, redesigned to match the premium two-panel layout for a consistent authentication experience.
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

const ResetPassword: React.FC = () => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const newErrors = { password: '', confirmPassword: '' };
    let isValid = true;

    if (!formData.password) {
      newErrors.password = 'Password is required.';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      console.log('Password reset submitted');
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        setSubmitted(true);
      }, 1500);
    }
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
          <h2 className={cn(styles.title, currentThemeStyles.title)}>Reset Your Password</h2>
          {submitted ? (
            <p className={cn(styles.subtitle, currentThemeStyles.subtitle)}>
              Your password has been successfully reset.
            </p>
          ) : (
            <p className={cn(styles.subtitle, currentThemeStyles.subtitle)}>Create a new, strong password.</p>
          )}

          {!submitted ? (
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
              />
              <Button variant="primary" fullWidth type="submit" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          ) : (
            <Link href="/Login" className={styles.fullWidthLink}>
              <Button variant="primary" fullWidth>Back to Login</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
