'use client';
import React from 'react';
import { FaRocket, FaShieldAlt, FaRobot, FaWallet } from 'react-icons/fa';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './Features.common.module.css';
import lightStyles from './Features.light.module.css';
import darkStyles from './Features.dark.module.css';

const features = [
  {
    icon: <FaRobot />,
    title: 'AI-Powered Tools',
    description: 'Leverage our suite of AI tools to estimate project costs, generate proposals, and automate your workflow.',
  },
  {
    icon: <FaShieldAlt />,
    title: 'Secure Crypto Payments',
    description: 'Get paid instantly and securely in USDC with our transparent, low-fee payment system.',
  },
  {
    icon: <FaRocket />,
    title: 'Global Opportunities',
    description: 'Connect with a global network of clients and find projects that match your skills and passion.',
  },
  {
    icon: <FaWallet />,
    title: 'Integrated Wallet',
    description: 'Manage your earnings with a built-in, secure wallet that gives you full control over your funds.',
  },
];

const Features: React.FC = () => {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  return (
    <section className={cn(commonStyles.homeFeatures, themeStyles.homeFeatures)}>
      <div className={commonStyles.container}>
        <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Why Choose MegiLance?</h2>
        <p className={cn(commonStyles.sectionSubtitle, themeStyles.sectionSubtitle)}>The platform designed for the future of freelancing.</p>
        <div className={commonStyles.homeFeaturesGrid}>
          {features.map((feature) => (
            <div key={feature.title} className={cn(commonStyles.homeFeatureCard, themeStyles.homeFeatureCard)}>
              <div className={cn(commonStyles.homeFeatureIcon, themeStyles.homeFeatureIcon)} aria-hidden="true">{feature.icon}</div>
              <h3 className={cn(commonStyles.homeFeatureTitle, themeStyles.homeFeatureTitle)}>{feature.title}</h3>
              <p className={cn(commonStyles.homeFeatureDescription, themeStyles.homeFeatureDescription)}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
