// @AI-HINT: This is the Reset Password page, redesigned to match the premium two-panel layout for a consistent authentication experience.
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import { FaShieldAlt } from 'react-icons/fa';
import AuthBrandingPanel from '@/app/components/Auth/BrandingPanel/BrandingPanel';

import commonStyles from './ResetPassword.common.module.css';
import lightStyles from './ResetPassword.light.module.css';
import darkStyles from './ResetPassword.dark.module.css';

const resetPasswordBranding = {
  brandIcon: FaShieldAlt,
  brandTitle: 'Strengthen Your Security',
  brandText: 'Create a new, strong password to protect your account. Make sure it&apos;s at least 8 characters long.',
};

const ResetPassword: React.FC = () => {
  const { resolvedTheme } = useTheme();
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

  const styles = React.useMemo(() => {
    const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  return (
    <div className={styles.loginPage}>
      <div className={styles.brandingSlot}>
        <AuthBrandingPanel roleConfig={resetPasswordBranding} />
      </div>
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Set a New Password</h1>
            {submitted ? (
              <p className={styles.formSubtitle}>
                Your password has been successfully reset.
              </p>
            ) : (
              <p className={styles.formSubtitle}>Create a new, strong password for your account.</p>
            )}
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} noValidate className={styles.loginForm}>
              <Input
                id="password"
                name="password"
                type="password"
                label="New Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                disabled={loading}
              />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirm New Password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                disabled={loading}
              />
              <Button type="submit" variant="primary" fullWidth isLoading={loading} disabled={loading} className={styles.submitButton}>
                {loading ? 'Resetting Password...' : 'Set New Password'}
              </Button>
            </form>
          ) : (
            <Link href="/login">
              <Button variant="primary" fullWidth className={styles.submitButton}>
                Return to Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
