// @AI-HINT: This is the refactored Freelancer Profile page, featuring a premium layout, custom components, and full theme support.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Textarea from '@/app/components/Textarea/Textarea'; // Using the reusable Textarea component
import commonStyles from './Profile.common.module.css';
import lightStyles from './Profile.light.module.css';
import darkStyles from './Profile.dark.module.css';

// Mock data for the profile page
const userProfile = {
  name: 'Alexandria Doe',
  title: 'Senior AI & Full-Stack Developer',
  rank: 'Top 5%',
  bio: '10+ years of experience building scalable web applications and AI-powered solutions. Expert in React, Node.js, Python, and cloud-native architectures. Passionate about creating intuitive user experiences that are both beautiful and functional.',
  skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'Prisma'],
  portfolioUrl: 'https://alexandriadoe.dev',
  hourlyRate: 95,
};

const Profile: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  return (
    <div className={styles.profileContainer}>
      <header className={styles.header}>
        <UserAvatar name={userProfile.name} size="large" />
        <div className={styles.headerInfo}>
          <h1 className={styles.name}>{userProfile.name}</h1>
          <p className={styles.title}>{userProfile.title}</p>
          <span className={styles.rank}>Freelancer Rank: {userProfile.rank}</span>
        </div>
        <Button variant="secondary">Edit Profile</Button>
      </header>

      <form className={styles.form}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>About Me</h2>
          <Textarea
            id="bio-textarea"
            defaultValue={userProfile.bio}
            rows={6}
            label="Profile Bio"
            hideLabel
          />
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Skills</h2>
          <Input
            label="Skills"
            type="text"
            defaultValue={userProfile.skills.join(', ')}
            hideLabel
          />
          <small className={styles.skillsInfo}>Separate skills with a comma.</small>
        </div>

        <div className={styles.inlineSection}>
          <Input
            label="Hourly Rate ($/hr)"
            type="number"
            defaultValue={userProfile.hourlyRate}
          />
          <Input
            label="Portfolio URL"
            type="text"
            defaultValue={userProfile.portfolioUrl}
          />
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" type="button">Cancel</Button>
          <Button variant="primary" type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
