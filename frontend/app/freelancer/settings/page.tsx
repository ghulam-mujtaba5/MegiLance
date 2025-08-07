// @AI-HINT: This is the Account settings page for freelancers. It uses the reusable SettingsSection component for a consistent, premium layout.
'use client';

import React from 'react';
import SettingsSection from '@/app/Settings/components/SettingsSection/SettingsSection';
import Input from '@/app/components/Input/Input';
import Button from '@/app/components/Button/Button';

const AccountSettingsPage = () => {
  return (
    <SettingsSection
      title="Account"
      description="Update your account information."
    >
      <div className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          id="fullName"
          defaultValue="John Doe"
          className="max-w-md"
        />
        <Input
          label="Email Address"
          type="email"
          id="email"
          defaultValue="john.doe@example.com"
          className="max-w-md"
          disabled
        />
      </div>
      <div className="pt-6">
        <Button variant="primary">Save Changes</Button>
      </div>
    </SettingsSection>
  );
};

export default AccountSettingsPage;

