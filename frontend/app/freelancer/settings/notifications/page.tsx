// @AI-HINT: This is the Notifications Settings page. It allows freelancers to manage their notification preferences using a clean, modern interface with reusable components.
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useToaster } from '@/app/components/Toast/ToasterProvider';

import Button from '@/app/components/Button/Button';
import NotificationOption from './components/NotificationOption/NotificationOption';

import commonStyles from '../Settings.common.module.css';
import lightStyles from '../Settings.light.module.css';
import darkStyles from '../Settings.dark.module.css';

// In a real app, this would come from an API
const initialSettings = {
  newJobAlerts: true,
  proposalStatusUpdates: true,
  messageNotifications: true,
  paymentConfirmations: true,
  weeklySummary: false,
};

const NotificationSettingsPage = () => {
  const { theme } = useTheme();
  const styles = theme === 'dark' ? darkStyles : lightStyles;
  const toaster = useToaster();

  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toaster.notify({ title: 'Saved', description: 'Notification settings saved!', variant: 'success' });
      // Here you would persist the `settings` object
    }, 1500);
  };

  return (
    <div className={cn(commonStyles.formContainer, styles.formContainer)}>
      <header className={cn(commonStyles.formHeader, styles.formHeader)}>
        <h2 className={cn(commonStyles.formTitle, styles.formTitle)}>Notifications</h2>
        <p className={cn(commonStyles.formDescription, styles.formDescription)}>
          Choose how you want to be notified about activity on MegiLance.
        </p>
      </header>

      <form onSubmit={handleSubmit} className={commonStyles.form}>
        <div className={commonStyles.inputGroup}>
          <NotificationOption
            id="new-job-alerts"
            title="New Job Alerts"
            description="Receive an email when a new job matches your skills."
            checked={settings.newJobAlerts}
            onChange={(value) => handleSettingChange('newJobAlerts', value)}
          />
          <NotificationOption
            id="proposal-status-updates"
            title="Proposal Status Updates"
            description="Get notified when a client views or responds to your proposal."
            checked={settings.proposalStatusUpdates}
            onChange={(value) => handleSettingChange('proposalStatusUpdates', value)}
          />
          <NotificationOption
            id="message-notifications"
            title="Direct Message Notifications"
            description="Receive a push notification for new direct messages."
            checked={settings.messageNotifications}
            onChange={(value) => handleSettingChange('messageNotifications', value)}
          />
          <NotificationOption
            id="payment-confirmations"
            title="Payment Confirmations"
            description="Get an email when a payment is processed to your account."
            checked={settings.paymentConfirmations}
            onChange={(value) => handleSettingChange('paymentConfirmations', value)}
          />
          <NotificationOption
            id="weekly-summary"
            title="Weekly Summary"
            description="Receive a weekly digest of your activity and earnings."
            checked={settings.weeklySummary}
            onChange={(value) => handleSettingChange('weeklySummary', value)}
          />
        </div>

        <footer className={cn(commonStyles.formFooter, styles.formFooter)}>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </footer>
      </form>
    </div>
  );
};

export default NotificationSettingsPage;
