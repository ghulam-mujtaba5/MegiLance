// @AI-HINT: This component renders the form for updating user profile information. It's self-contained, managing its own state, and is wrapped by the SettingsSection component for consistent styling.

'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

import SettingsSection from '../SettingsSection/SettingsSection';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import Textarea from '../../../components/Textarea/Textarea';

import commonStyles from './ProfileSettings.common.module.css';
import lightStyles from './ProfileSettings.light.module.css';
import darkStyles from './ProfileSettings.dark.module.css';

interface UserProfile {
  fullName: string;
  email: string;
  bio: string;
}

const defaultProfile: UserProfile = {
  fullName: '',
  email: '',
  bio: '',
};

const ProfileSettings: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.auth.me();
      setProfile({
        fullName: data.full_name || '',
        email: data.email || '',
        bio: data.bio || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setStatus({ type: 'error', message: 'Failed to load profile. Please log in.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    // Clear any previous status when user starts editing
    if (status) setStatus(null);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      await api.auth.updateProfile({
        full_name: profile.fullName,
        bio: profile.bio,
      });
      setStatus({ type: 'success', message: 'Profile saved successfully!' });
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      setStatus({ type: 'error', message: error.message || 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SettingsSection
        title="Profile Information"
        description="Update your personal details here."
      >
        <div className={styles.loading}>Loading your profile...</div>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection
      title="Profile Information"
      description="Update your personal details here. This information will be displayed on your public profile."
    >
      <form className={styles.form} onSubmit={handleSaveChanges}>
        {status && (
          <div className={cn(styles.status, status.type === 'error' ? styles.statusError : styles.statusSuccess)}>
            {status.message}
          </div>
        )}
        <div className={styles.fieldWrapper}>
          <Input
            label="Full Name"
            type="text"
            id="fullName"
            name="fullName"
            value={profile.fullName}
            onChange={handleProfileChange}
            required
          />
        </div>
        <div className={styles.fieldWrapper}>
          <Input
            label="Email Address"
            type="email"
            id="email"
            name="email"
            value={profile.email}
            onChange={handleProfileChange}
            required
            disabled // Email is not changeable
          />
        </div>
        <div className={styles.fieldWrapper}>
          <Textarea
            label="Bio"
            id="bio"
            name="bio"
            value={profile.bio}
            onChange={handleProfileChange}
            rows={5}
            placeholder="Tell us a little about yourself"
          />
        </div>
        <div className={styles.footer}>
          <Button type="submit" variant="primary" isLoading={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
};

export default ProfileSettings;
