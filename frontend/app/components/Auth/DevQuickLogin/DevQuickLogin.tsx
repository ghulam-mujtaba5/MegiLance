// @AI-HINT: Quick login component for MegiLance demo. Shows role-based buttons that auto-fill credentials for rapid testing. ONLY visible in development mode.
'use client';

import React from 'react';
import { ShieldCheck, UserCheck, Briefcase, Rocket, type LucideIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import commonStyles from './DevQuickLogin.common.module.css';
import lightStyles from './DevQuickLogin.light.module.css';
import darkStyles from './DevQuickLogin.dark.module.css';

const IS_DEV = process.env.NODE_ENV === 'development';

interface DevCredential {
  email: string;
  password: string;
  role: 'admin' | 'freelancer' | 'client';
  label: string;
  icon: LucideIcon;
}

// @AI-HINT: Demo credentials loaded from environment variables only — nothing hardcoded
// Configure via NEXT_PUBLIC_DEV_*_EMAIL and NEXT_PUBLIC_DEV_*_PASSWORD in .env.local
const DEV_CREDENTIALS: DevCredential[] = IS_DEV
  ? [
      {
        email: process.env.NEXT_PUBLIC_DEV_ADMIN_EMAIL || '',
        password: process.env.NEXT_PUBLIC_DEV_ADMIN_PASSWORD || '',
        role: 'admin' as const,
        label: 'Admin',
        icon: ShieldCheck,
      },
      {
        email: process.env.NEXT_PUBLIC_DEV_FREELANCER_EMAIL || '',
        password: process.env.NEXT_PUBLIC_DEV_FREELANCER_PASSWORD || '',
        role: 'freelancer' as const,
        label: 'Freelancer',
        icon: UserCheck,
      },
      {
        email: process.env.NEXT_PUBLIC_DEV_CLIENT_EMAIL || '',
        password: process.env.NEXT_PUBLIC_DEV_CLIENT_PASSWORD || '',
        role: 'client' as const,
        label: 'Client',
        icon: Briefcase,
      },
    ].filter(c => c.email && c.password)
  : [];

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

  // Only show in development mode
  if (!mounted || !IS_DEV || DEV_CREDENTIALS.length === 0) {
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
        <Rocket className={styles.title} size={18} />
        <h3 className={styles.title}>Quick Demo Login</h3>
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
