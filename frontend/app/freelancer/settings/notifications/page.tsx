// @AI-HINT: This is the Notifications settings page for freelancers. It uses the reusable SettingsSection and the new premium ToggleSwitch component.
'use client';

import React from 'react';
import SettingsSection from '@/app/Settings/components/SettingsSection/SettingsSection';
import ToggleSwitch from '@/app/components/ToggleSwitch/ToggleSwitch';
import Button from '@/app/components/Button/Button';

const NotificationSettingsPage = () => {
  return (
    <SettingsSection
      title="Notifications"
      description="Manage how you receive notifications from MegiLance."
    >
      <div className="space-y-6 max-w-md">
        <ToggleSwitch
          id="project-notifications"
          label="Email me about new projects"
          defaultChecked
        />
        <ToggleSwitch
          id="account-activity"
          label="Email me about account activity"
          defaultChecked
        />
        <ToggleSwitch
          id="message-notifications"
          label="Push notifications for new messages"
        />
      </div>
      <div className="pt-6">
        <Button variant="primary">Save Preferences</Button>
      </div>
    </SettingsSection>
  );
};

export default NotificationSettingsPage;
