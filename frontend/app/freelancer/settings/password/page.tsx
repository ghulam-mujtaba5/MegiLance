// @AI-HINT: This is the Password settings page for freelancers. It uses the reusable SettingsSection component for a consistent, premium layout.
'use client';

import React from 'react';
import SettingsSection from '@/app/Settings/components/SettingsSection/SettingsSection';
import Input from '@/app/components/Input/Input';
import Button from '@/app/components/Button/Button';

const PasswordSettingsPage = () => {
  return (
    <SettingsSection
      title="Password"
      description="Update your password. Choose a strong one!"
    >
      <div className="space-y-4">
        <Input
          label="Current Password"
          type="password"
          id="currentPassword"
          placeholder="Enter current password"
          className="max-w-md"
        />
        <Input
          label="New Password"
          type="password"
          id="newPassword"
          placeholder="Enter new password"
          className="max-w-md"
        />
        <Input
          label="Confirm New Password"
          type="password"
          id="confirmNewPassword"
          placeholder="Confirm new password"
          className="max-w-md"
        />
      </div>
      <div className="pt-6">
        <Button variant="primary">Change Password</Button>
      </div>
    </SettingsSection>
  );
};

export default PasswordSettingsPage;
