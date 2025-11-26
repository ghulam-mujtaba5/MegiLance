// @AI-HINT: This is the PWA Install page root component. It prompts the user to install the app. All styles are per-component only.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';

import commonStyles from './Install.common.module.css';
import lightStyles from './Install.light.module.css';
import darkStyles from './Install.dark.module.css';

const Install: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  if (!resolvedTheme) return null;

  // In a real implementation, we would check if the app can be installed
  // and handle the beforeinstallprompt event.
  const handleInstallClick = () => {
    alert('PWA installation would be triggered here.');
  };

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.innerContainer}>
        <header className={commonStyles.header}>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Install MegiLance</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>Get the best experience by installing the MegiLance app on your device.</p>
        </header>

        <div className={commonStyles.features}>
          <div className={cn(commonStyles.feature, themeStyles.feature)}>
            <h3 className={cn(commonStyles.featureTitle, themeStyles.featureTitle)}>Faster Access</h3>
            <p className={cn(commonStyles.featureDescription, themeStyles.featureDescription)}>Launch the app directly from your home screen.</p>
          </div>
          <div className={cn(commonStyles.feature, themeStyles.feature)}>
            <h3 className={cn(commonStyles.featureTitle, themeStyles.featureTitle)}>Offline Capabilities</h3>
            <p className={cn(commonStyles.featureDescription, themeStyles.featureDescription)}>Access key features even without an internet connection.</p>
          </div>
          <div className={cn(commonStyles.feature, themeStyles.feature)}>
            <h3 className={cn(commonStyles.featureTitle, themeStyles.featureTitle)}>Push Notifications</h3>
            <p className={cn(commonStyles.featureDescription, themeStyles.featureDescription)}>Stay updated on project updates and messages.</p>
          </div>
        </div>

        <Button variant="primary" onClick={handleInstallClick}>
          Install App
        </Button>
      </div>
    </div>
  );
};

export default Install;
