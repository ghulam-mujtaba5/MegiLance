// @AI-HINT: This component renders the form for updating user security settings, such as changing a password. It is self-contained and wrapped by the SettingsSection component for a consistent UI.

// @AI-HINT: This component renders the form for updating user security settings, such as changing a password. It is self-contained and wrapped by the SettingsSection component for a consistent UI.

'use client';

import React, { useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import SettingsSection from '../SettingsSection/SettingsSection';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';

import commonStyles from './SecuritySettings.common.module.css';
import lightStyles from './SecuritySettings.light.module.css';
import darkStyles from './SecuritySettings.dark.module.css';

const SecuritySettings: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('New passwords do not match.');
      return;
    }
    try {
      // TODO: Implement password change API call
      // await api.auth.changePassword(passwords.currentPassword, passwords.newPassword);
      alert('Password updated successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      alert('Failed to update password. Please try again.');
    }
  };

  return (
    <SettingsSection
      title="Password"
      description="Update your password regularly to help keep your account secure. We recommend a strong, unique password."
    >
      <form className={styles.form} onSubmit={handleSaveChanges}>
        <div className={styles.fieldWrapper}>
          <Input
            label="Current Password"
            name="currentPassword"
            type="password"
            value={passwords.currentPassword}
            onChange={handlePasswordChange}
            autoComplete="current-password"
            required
          />
        </div>
        <div className={styles.fieldWrapper}>
          <Input
            label="New Password"
            name="newPassword"
            type="password"
            value={passwords.newPassword}
            onChange={handlePasswordChange}
            autoComplete="new-password"
            required
          />
        </div>
        <div className={styles.fieldWrapper}>
          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={passwords.confirmPassword}
            onChange={handlePasswordChange}
            autoComplete="new-password"
            required
          />
        </div>
        <div className={styles.footer}>
          <Button type="submit" variant="primary">Change Password</Button>
        </div>
      </form>
    </SettingsSection>
  );
};

export default SecuritySettings;
