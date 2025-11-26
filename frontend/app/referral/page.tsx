// @AI-HINT: This page allows users to find their referral link and track their rewards.
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import commonStyles from './ReferralPage.common.module.css';
import lightStyles from './ReferralPage.light.module.css';
import darkStyles from './ReferralPage.dark.module.css';

// @AI-HINT: Mock data. In a real app, this would be fetched for the logged-in user.
const referralData = {
  referralLink: 'https://megilance.io/join/user123xyz',
  rewardsEarned: 150.75, // Example in platform tokens
  successfulReferrals: 3,
};

const ReferralPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  if (!resolvedTheme) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralData.referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <header className={commonStyles.header}>
        <h1 className={cn(commonStyles.title, themeStyles.title)}>Invite Friends, Earn Crypto</h1>
        <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>Share your unique link and earn rewards for every new user who joins and completes a job.</p>
      </header>

      <main className={commonStyles.main}>
        <div className={cn(commonStyles.card, themeStyles.card)}>
          <h2 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>Your Referral Link</h2>
          <div className={commonStyles.linkWrapper}>
            <label htmlFor="referral-link" className={commonStyles.visuallyHidden}>Your referral link</label>
            <input id="referral-link" type="text" readOnly value={referralData.referralLink} className={cn(commonStyles.linkInput, themeStyles.linkInput)} />
            <Button variant="primary" onClick={handleCopyLink}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        <div className={cn(commonStyles.statsCard, themeStyles.statsCard)}>
          <h2 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>Your Stats</h2>
          <div className={commonStyles.statsGrid}>
            <div className={cn(commonStyles.statItem, themeStyles.statItem)}>
              <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{referralData.successfulReferrals}</span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Successful Referrals</span>
            </div>
            <div className={cn(commonStyles.statItem, themeStyles.statItem)}>
              <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{referralData.rewardsEarned.toFixed(2)}</span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Tokens Earned</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReferralPage;
