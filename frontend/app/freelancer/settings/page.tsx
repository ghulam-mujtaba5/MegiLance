// @AI-HINT: This is the main Account Settings page for freelancers. It features a modern, clean form for updating profile information and is built to be theme-aware and responsive.
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useToaster } from '@/app/components/Toast/ToasterProvider';

import Input from '@/app/components/Input/Input';
import Button from '@/app/components/Button/Button';
import { Label } from '@/app/components/Label/Label';

import commonStyles from './Settings.common.module.css';
import lightStyles from './Settings.light.module.css';
import darkStyles from './Settings.dark.module.css';

const AccountSettingsPage = () => {
  const { theme } = useTheme();
  const styles = theme === 'dark' ? darkStyles : lightStyles;
  const toaster = useToaster();

  const [fullName, setFullName] = useState('Morgan Lee');
  const [professionalTitle, setProfessionalTitle] = useState('Senior Frontend Developer');
  const [email] = useState('morgan.lee@megilance.dev'); // Email is typically not editable
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toaster.success('Profile updated successfully!');
    }, 1500);
  };

  return (
    <div className={cn(commonStyles.formContainer, styles.formContainer)}>
      <header className={cn(commonStyles.formHeader, styles.formHeader)}>
        <h2 className={cn(commonStyles.formTitle, styles.formTitle)}>Public Profile</h2>
        <p className={cn(commonStyles.formDescription, styles.formDescription)}>
          This information will be displayed on your public profile.
        </p>
      </header>

      <form onSubmit={handleSubmit} className={commonStyles.form}>
        <div className={commonStyles.inputGroup}>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g., Alex Doe"
            className={styles.input}
          />
        </div>

        <div className={commonStyles.inputGroup}>
          <Label htmlFor="professionalTitle">Professional Title</Label>
          <Input
            id="professionalTitle"
            type="text"
            value={professionalTitle}
            onChange={(e) => setProfessionalTitle(e.target.value)}
            placeholder="e.g., Senior Product Designer"
            className={styles.input}
          />
        </div>

        <div className={commonStyles.inputGroup}>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            disabled
            className={styles.input}
            aria-describedby="email-description"
          />
          <p id="email-description" className={cn(commonStyles.inputHint, styles.inputHint)}>
            Your email address cannot be changed.
          </p>
        </div>

        <footer className={cn(commonStyles.formFooter, styles.formFooter)}>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </footer>
      </form>
    </div>
  );
};

export default AccountSettingsPage;

