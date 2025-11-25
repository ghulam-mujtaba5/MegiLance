// @AI-HINT: This is the refactored Freelancer Profile page, featuring a premium layout, custom components, and full theme support.
'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { api } from '@/lib/api';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Textarea from '@/app/components/Textarea/Textarea'; // Using the reusable Textarea component
import commonStyles from './Profile.common.module.css';
import lightStyles from './Profile.light.module.css';
import darkStyles from './Profile.dark.module.css';

// Default profile for initial render and fallback
const defaultProfile = {
  name: '',
  title: '',
  rank: 'New',
  bio: '',
  skills: [] as string[],
  portfolioUrl: '',
  hourlyRate: 0,
};

interface ApiUser {
  id: number;
  email: string;
  full_name?: string;
  bio?: string;
  skills?: string[];
  hourly_rate?: number;
  profile_picture_url?: string;
  portfolio_url?: string;
  title?: string;
  role?: string;
}

const Profile: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(defaultProfile.name);
  const [title, setTitle] = useState(defaultProfile.title);
  const [bio, setBio] = useState(defaultProfile.bio);
  const [skills, setSkills] = useState(defaultProfile.skills.join(', '));
  const [portfolioUrl, setPortfolioUrl] = useState(defaultProfile.portfolioUrl);
  const [hourlyRate, setHourlyRate] = useState<number | string>(defaultProfile.hourlyRate);
  const [errors, setErrors] = useState<{ portfolioUrl?: string; hourlyRate?: string }>({});
  const [status, setStatus] = useState<string>('');
  const [rank, setRank] = useState(defaultProfile.rank);
  const [saving, setSaving] = useState(false);

  // Fetch user profile from API
  const fetchProfile = useCallback(async () => {
    try {
      const data: ApiUser = await api.auth.me();
      setName(data.full_name || '');
      setTitle(data.title || 'Freelancer');
      setBio(data.bio || '');
      setSkills(data.skills?.join(', ') || '');
      setPortfolioUrl(data.portfolio_url || '');
      setHourlyRate(data.hourly_rate || 0);
      // Determine rank based on profile completeness or other metrics
      setRank(data.skills && data.skills.length > 5 ? 'Top 10%' : 'New');
      setStatus('');
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      if (error.message?.includes('401')) {
        setStatus('Session expired. Please log in again.');
      } else {
        setStatus('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Draft load (after API fetch to allow override)
  useEffect(() => {
    if (loading) return;
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('freelancer_profile_draft') : null;
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.name) setName(draft.name);
        if (draft.title) setTitle(draft.title);
        if (typeof draft.bio === 'string') setBio(draft.bio);
        if (typeof draft.skills === 'string') setSkills(draft.skills);
        if (draft.portfolioUrl) setPortfolioUrl(draft.portfolioUrl);
        if (draft.hourlyRate !== undefined) setHourlyRate(draft.hourlyRate);
        setStatus('Draft loaded - save to apply changes');
      }
    } catch {
      // ignore
    }
  }, [loading]);

  const saveDraft = () => {
    try {
      const payload = { name, title, bio, skills, portfolioUrl, hourlyRate };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('freelancer_profile_draft', JSON.stringify(payload));
        setStatus('Draft saved');
      }
    } catch {
      setStatus('Failed to save draft');
    }
  };

  const resetForm = () => {
    fetchProfile();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('freelancer_profile_draft');
    }
    setErrors({});
    setStatus('Reset to saved profile');
  };

  const validate = () => {
    const next: typeof errors = {};
    // URL validation
    try {
      if (portfolioUrl && String(portfolioUrl).trim().length > 0) {
        // eslint-disable-next-line no-new
        new URL(String(portfolioUrl));
      }
    } catch {
      next.portfolioUrl = 'Please enter a valid URL';
    }
    // hourly rate
    const rateNum = Number(hourlyRate);
    if (Number.isNaN(rateNum) || rateNum < 0) {
      next.hourlyRate = 'Hourly rate must be a positive number';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setStatus('Please fix the highlighted fields');
      return;
    }

    setSaving(true);
    try {
      await api.auth.updateProfile({
        full_name: name,
        title: title,
        bio: bio,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        portfolio_url: portfolioUrl || null,
        hourly_rate: Number(hourlyRate) || null,
      });

      setStatus('Profile saved successfully!');
      // Clear draft after successful save
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('freelancer_profile_draft');
      }
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      setStatus(error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  if (loading) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <header className={styles.header}>
        <UserAvatar name={name} size="large" />
        <div className={styles.headerInfo}>
          <h1 className={styles.name}>{name || 'Your Name'}</h1>
          <p className={styles.title}>{title || 'Your Title'}</p>
          <span className={styles.rank}>Freelancer Rank: {rank}</span>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" type="button" onClick={saveDraft} title="Save profile draft">Save Draft</Button>
        </div>
      </header>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {status && <div className={styles.status} role="status" aria-live="polite">{status}</div>}

        <div className={styles.inlineSection}>
          <Input
            label="Full Name"
            type="text"
            value={name}
            title="Enter your full name"
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Professional Title"
            type="text"
            value={title}
            title="Enter your professional headline (publicly visible)"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>About Me</h2>
          <Textarea
            id="bio-textarea"
            value={bio}
            rows={6}
            label="Profile Bio"
            hideLabel
            title="Write a short bio (publicly visible)"
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Skills</h2>
          <Input
            label="Skills"
            type="text"
            value={skills}
            hideLabel
            title="Enter comma-separated skills"
            aria-describedby="skills-help"
            onChange={(e) => setSkills(e.target.value)}
          />
          <small id="skills-help" className={styles.skillsInfo}>Separate skills with a comma.</small>
        </div>

        <div className={styles.inlineSection}>
          <Input
            label="Hourly Rate ($/hr)"
            type="number"
            value={hourlyRate}
            aria-invalid={errors.hourlyRate ? 'true' : undefined}
            aria-describedby={errors.hourlyRate ? 'hourlyRate-error' : undefined}
            title="Enter your hourly rate in USD"
            onChange={(e) => setHourlyRate(e.target.value)}
          />
          <Input
            label="Portfolio URL"
            type="text"
            value={portfolioUrl}
            aria-invalid={errors.portfolioUrl ? 'true' : undefined}
            aria-describedby={errors.portfolioUrl ? 'portfolioUrl-error' : undefined}
            title="Link to your portfolio or website"
            onChange={(e) => setPortfolioUrl(e.target.value)}
          />
        </div>

        {(errors.hourlyRate || errors.portfolioUrl) && (
          <div className={styles.errors} role="alert">
            {errors.hourlyRate && <p id="hourlyRate-error" className={styles.errorText}>{errors.hourlyRate}</p>}
            {errors.portfolioUrl && <p id="portfolioUrl-error" className={styles.errorText}>{errors.portfolioUrl}</p>}
          </div>
        )}

        <div className={styles.actions}>
          <Button variant="secondary" type="button" onClick={resetForm} title="Reset to defaults">Reset</Button>
          <Button variant="primary" type="submit" title="Save profile changes" isLoading={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
