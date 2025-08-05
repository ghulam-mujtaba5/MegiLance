// @AI-HINT: This component renders the form for updating user security settings, such as changing a password. It is self-contained and wrapped by the SettingsSection component for a consistent UI.

import React, { useState } from 'react';
import SettingsSection from '../SettingsSection/SettingsSection';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import './SecuritySettings.common.css';
import './SecuritySettings.light.css';
import './SecuritySettings.dark.css';

const SecuritySettings: React.FC = () => {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for save logic
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('New passwords do not match.');
      return;
    }
    alert('Changing password...');
    console.log('Saving new password');
  };

  return (
    <SettingsSection
      title="Password"
      description="Update your password regularly to help keep your account secure. We recommend a strong, unique password."
    >
      <form className="SecuritySettings-form" onSubmit={handleSaveChanges}>
        <Input
          label="Current Password"
          name="currentPassword"
          type="password"
          value={passwords.currentPassword}
          onChange={handlePasswordChange}
          autoComplete="current-password"
        />
        <Input
          label="New Password"
          name="newPassword"
          type="password"
          value={passwords.newPassword}
          onChange={handlePasswordChange}
          autoComplete="new-password"
        />
        <Input
          label="Confirm New Password"
          name="confirmPassword"
          type="password"
          value={passwords.confirmPassword}
          onChange={handlePasswordChange}
          autoComplete="new-password"
        />
        <div className="Form-actions">
            <Button type="submit" variant="primary">Change Password</Button>
        </div>
      </form>
    </SettingsSection>
  );
};

export default SecuritySettings;
