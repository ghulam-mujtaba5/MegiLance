// @AI-HINT: Quick login component for MegiLance demo. Shows role-based buttons that auto-fill real credentials for rapid testing. Now works in both development and production for live demo purposes.
'use client';

import React from 'react';
import { FaUserShield, FaUserTie, FaBriefcase, FaRocket } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import commonStyles from './DevQuickLogin.common.module.css';
import lightStyles from './DevQuickLogin.light.module.css';
import darkStyles from './DevQuickLogin.dark.module.css';

interface DevCredential {
  email: string;
  password: string;
  role: 'admin' | 'freelancer' | 'client';
  label: string;
  icon: IconType;
}

// @AI-HINT: Demo credentials for quick login. These are real accounts in the database.
// Updated to match actual demo users in local_dev.db
const DEV_CREDENTIALS: DevCredential[] = [
  {
    email: 'admin@megilance.com',
    password: 'Password123',
    role: 'admin',
    label: 'Admin',
    icon: FaUserShield,
  },
  {
    email: 'freelancer@demo.com',
    password: 'Password123',
    role: 'freelancer',
    label: 'Freelancer',
    icon: FaUserTie,
  },
  {
    email: 'client@demo.com',
    password: 'Password123',
    role: 'client',
    label: 'Client',
    icon: FaBriefcase,
  },
];

interface DevQuickLoginProps {
  onCredentialSelect: (email: string, password: string, role: 'admin' | 'freelancer' | 'client') => void;
  onAutoLogin?: (email: string, password: string, role: 'admin' | 'freelancer' | 'client') => void;
}

const DevQuickLogin: React.FC<DevQuickLoginProps> = ({ onCredentialSelect, onAutoLogin }) => {
  const { resolvedTheme } = useTheme();
  const [autoLoginMode, setAutoLoginMode] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  const styles = React.useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    const merge = (key: keyof typeof commonStyles) =>
      cn((commonStyles as any)[key], (themeStyles as any)[key]);
    return {
      container: merge('container'),
      header: merge('header'),
      title: merge('title'),
      subtitle: merge('subtitle'),
      toggleContainer: merge('toggleContainer'),
      toggleLabel: merge('toggleLabel'),
      buttonGrid: merge('buttonGrid'),
      roleButton: merge('roleButton'),
      roleIcon: merge('roleIcon'),
      roleLabel: merge('roleLabel'),
      roleEmail: merge('roleEmail'),
    } as const;
  }, [resolvedTheme]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Show after mounting (both dev and production for demo)
  if (!mounted) {
    return null;
  }

  const handleQuickLogin = (credential: DevCredential) => {
    if (autoLoginMode && onAutoLogin) {
      onAutoLogin(credential.email, credential.password, credential.role);
    } else {
      onCredentialSelect(credential.email, credential.password, credential.role);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <FaRocket className={styles.title} />
        <h3 className={styles.title}>🚀 Quick Demo Login</h3>
        <p className={styles.subtitle}>
          {autoLoginMode ? 'Click to instantly login' : 'Click to auto-fill credentials'}
        </p>
        <div className={styles.toggleContainer}>
          <input
            type="checkbox"
            id="autoLoginMode"
            checked={autoLoginMode}
            onChange={(e) => setAutoLoginMode(e.target.checked)}
          />
          <label htmlFor="autoLoginMode" className={styles.toggleLabel}>
            Auto-login on click
          </label>
        </div>
      </div>
      <div className={styles.buttonGrid}>
        {DEV_CREDENTIALS.map((credential) => {
          const Icon = credential.icon;
          return (
            <button
              key={credential.email}
              type="button"
              onClick={() => handleQuickLogin(credential)}
              className={styles.roleButton}
              aria-label={`Quick login as ${credential.label}`}
            >
              <div className={styles.roleIcon}>
                <Icon />
              </div>
              <span className={styles.roleLabel}>{credential.label}</span>
              <span className={styles.roleEmail}>{credential.email}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DevQuickLogin;
