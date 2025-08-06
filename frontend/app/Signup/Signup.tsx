// @AI-HINT: This is the fully redesigned Signup page, architected for a premium user experience. It features the same two-panel layout as the Login page for brand consistency and uses the sophisticated Tabs component for role selection.
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { FaGoogle, FaGithub, FaUserTie, FaBriefcase, FaEye, FaEyeSlash } from 'react-icons/fa';
import { cn } from '@/lib/utils';

import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Checkbox from '@/app/components/Checkbox/Checkbox';
import Tabs from '@/app/components/Tabs/Tabs';
import Tab from '@/app/components/Tabs/Tab';

import styles from '../Login/Login.common.module.css'; // Re-use login styles for consistency
import lightStyles from '../Login/Login.light.module.css';
import darkStyles from '../Login/Login.dark.module.css';

type UserRole = 'client' | 'freelancer';

const roleConfig = {
  client: {
    id: 'client' as UserRole,
    label: 'Client',
    icon: FaUserTie,
    brandTitle: 'Find Top-Tier Talent',
    brandText: 'Post projects, evaluate proposals, and collaborate with the world’s best freelancers, all in one place.',
  },
  freelancer: {
    id: 'freelancer' as UserRole,
    label: 'Freelancer',
    icon: FaBriefcase,
    brandTitle: 'Build Your Freelance Career',
    brandText: 'Showcase your skills, bid on exciting projects, and get paid securely for your expert work.',
  },
};

const Signup: React.FC = () => {
  const { theme } = useTheme();
  const [selectedRole, setSelectedRole] = useState<UserRole>('freelancer');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required.';
    if (!formData.email) newErrors.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email address is invalid.';
    if (!formData.password) newErrors.password = 'Password is required.';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    if (!formData.agreedToTerms) newErrors.agreedToTerms = 'You must agree to the terms and conditions.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      console.log('Creating account for:', selectedRole, formData);
      setTimeout(() => setLoading(false), 2000);
    }
  };

  const currentBranding = roleConfig[selectedRole];
  const themeStyles = theme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(styles.loginPage, themeStyles.loginPage)}>
      <aside className={cn(styles.brandingPanel, themeStyles.brandingPanel)}>
        <div className={styles.brandingContent}>
          <div className={styles.brandingIconWrapper}>
            <currentBranding.icon className={styles.brandingIcon} />
          </div>
          <h1 className={styles.brandingTitle}>{currentBranding.brandTitle}</h1>
          <p className={styles.brandingText}>{currentBranding.brandText}</p>
        </div>
        <footer className={styles.brandingFooter}>MegiLance © 2024</footer>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Create Your Account</h2>
            <p className={styles.formSubtitle}>Let's get started on your journey.</p>
          </div>

          <Tabs defaultIndex={Object.keys(roleConfig).indexOf(selectedRole)} onTabChange={(index) => setSelectedRole(Object.keys(roleConfig)[index] as UserRole)}>
            <Tabs.List className={styles.roleSelector}>
              {Object.values(roleConfig).map((role) => (
                <Tabs.Tab key={role.id} icon={<role.icon />}>
                  {role.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>

          <div className={styles.socialAuth}>
            <Button variant="outline" fullWidth onClick={() => {}} disabled={loading}><FaGoogle /><span>Sign up with Google</span></Button>
            <Button variant="outline" fullWidth onClick={() => {}} disabled={loading}><FaGithub /><span>Sign up with GitHub</span></Button>
          </div>

          <div className={styles.divider}><span className={styles.dividerText}>OR</span></div>

          <form onSubmit={handleSubmit} noValidate className={styles.loginForm}>
            <Input name="fullName" type="text" label="Full Name" placeholder="John Doe" value={formData.fullName} onChange={handleChange} error={errors.fullName} disabled={loading} />
            <Input name="email" type="email" label="Email" placeholder="you@example.com" value={formData.email} onChange={handleChange} error={errors.email} disabled={loading} />
            <Input 
              name="password" 
              type={showPassword ? 'text' : 'password'}
              label="Password" 
              placeholder="8+ characters" 
              value={formData.password} 
              onChange={handleChange} 
              error={errors.password} 
              disabled={loading} 
              iconAfter={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.passwordToggle} aria-label="Toggle password visibility">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              }
            />
            <Input 
              name="confirmPassword" 
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirm Password" 
              placeholder="Re-enter password" 
              value={formData.confirmPassword} 
              onChange={handleChange} 
              error={errors.confirmPassword} 
              disabled={loading} 
              iconAfter={
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={styles.passwordToggle} aria-label="Toggle password visibility">
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              }
            />
            
            <div className={cn(styles.rememberMe, 'mt-2')}>
              <Checkbox id="terms" name="agreedToTerms" checked={formData.agreedToTerms} onChange={handleChange} error={errors.agreedToTerms} />
              <label htmlFor="terms">
                I agree to the <Link href="/terms" className={styles.forgotPasswordLink}>Terms</Link> & <Link href="/privacy" className={styles.forgotPasswordLink}>Privacy Policy</Link>.
              </label>
            </div>
            {errors.agreedToTerms && <p className={cn(styles.generalError, styles.generalErrorLeft)}>{errors.agreedToTerms}</p>}

            <Button type="submit" variant="primary" fullWidth className={styles.submitButton} disabled={loading}>
              {loading ? 'Creating Account...' : `Create ${roleConfig[selectedRole].label} Account`}
            </Button>
          </form>

          <p className={styles.signupPrompt}>
            Already have an account?
            <Link href="/Login">Log In</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Signup;
