// @AI-HINT: This component renders the form for updating user profile information. It's self-contained, managing its own state, and is wrapped by the SettingsSection component for consistent styling.

'use client';

import React, { useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import SettingsSection from '../SettingsSection/SettingsSection';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import Textarea from '../../../components/Textarea/Textarea'; // Import the new Textarea component
import { mockUserProfile } from './mock-data';

import commonStyles from './ProfileSettings.common.module.css';
import lightStyles from './ProfileSettings.light.module.css';
import darkStyles from './ProfileSettings.dark.module.css';

interface UserProfile {
  fullName: string;
  email: string;
  bio: string;
}

const ProfileSettings: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile>(mockUserProfile);

  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for save logic
    alert('Saving profile changes...');
    console.log('Saving profile:', profile);
  };

  return (
    <SettingsSection
      title="Profile Information"
      description="Update your personal details here. This information will be displayed on your public profile."
    >
      <form className={styles.form} onSubmit={handleSaveChanges}>
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
          <Button type="submit" variant="primary">Save Changes</Button>
        </div>
      </form>
    </SettingsSection>
  );
};

export default ProfileSettings;
