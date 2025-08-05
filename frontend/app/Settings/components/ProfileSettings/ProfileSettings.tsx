// @AI-HINT: This component renders the form for updating user profile information. It's self-contained, managing its own state, and is wrapped by the SettingsSection component for consistent styling.

import React, { useState, useEffect } from 'react';
import SettingsSection from '../SettingsSection/SettingsSection';
import Input from '../../../components/Input/Input'; // Assuming a shared Input component
import Button from '../../../components/Button/Button'; // Assuming a shared Button component
import './ProfileSettings.common.css';
import './ProfileSettings.light.css';
import './ProfileSettings.dark.css';

interface UserProfile {
  fullName: string;
  email: string;
  bio: string;
}

const ProfileSettings: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user');
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        const data: UserProfile = await response.json();
        setProfile(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => {
      if (!prev) return null;
      return { ...prev, [name]: value };
    });
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for save logic
    alert('Saving profile changes...');
    console.log('Saving profile:', profile);
  };

  if (loading) {
    return <SettingsSection title="Profile Information" description="Please wait while we load your profile."><div>Loading profile...</div></SettingsSection>;
  }

  if (error) {
    return <SettingsSection title="Profile Information" description="There was an issue loading your data."><div>Error: {error}</div></SettingsSection>;
  }

  if (!profile) {
    return <SettingsSection title="Profile Information" description="We couldn't find your profile data."><div>No profile data found.</div></SettingsSection>;
  }

  return (
    <SettingsSection
      title="Profile Information"
      description="This information will be displayed on your public profile. Keep it up to date so others can get to know you better."
    >
      <form className="ProfileSettings-form" onSubmit={handleSaveChanges}>
        <Input
          label="Full Name"
          name="fullName"
          value={profile.fullName}
          onChange={handleProfileChange}
          placeholder="Enter your full name"
        />
        <Input
          label="Email Address"
          name="email"
          type="email"
          value={profile.email}
          onChange={handleProfileChange}
          placeholder="Enter your email address"
        />
        <div className="Form-group">
          <label htmlFor="bio" className="Form-label">Your Bio</label>
          <textarea
            id="bio"
            name="bio"
            className="Form-textarea"
            value={profile.bio}
            onChange={handleProfileChange}
            rows={5}
            placeholder="Tell us a little about yourself"
          />
        </div>
        <div className="Form-actions">
            <Button type="submit" variant="primary">Save Changes</Button>
        </div>
      </form>
    </SettingsSection>
  );
};

export default ProfileSettings;
