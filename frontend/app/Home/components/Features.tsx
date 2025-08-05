'use client';
import React from 'react';
import { FaRocket, FaShieldAlt, FaRobot, FaWallet } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeContext';
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
    <section className={`${commonStyles['Home-features']} ${themeStyles['Home-features']}`}>
      <div className={commonStyles['Home-container']}>
        <h2 className={commonStyles['Home-section-title']}>Why Choose MegiLance?</h2>
        <p className={commonStyles['Home-section-subtitle']}>The platform designed for the future of freelancing.</p>
        <div className={commonStyles['Home-features-grid']}>
          {features.map((feature, index) => (
            <div key={index} className={`${commonStyles['Home-feature-card']} ${themeStyles['Home-feature-card']}`}>
              <div className={`${commonStyles['Home-feature-icon']} ${themeStyles['Home-feature-icon']}`}>{feature.icon}</div>
              <h3 className={`${commonStyles['Home-feature-title']} ${themeStyles['Home-feature-title']}`}>{feature.title}</h3>
              <p className={`${commonStyles['Home-feature-description']} ${themeStyles['Home-feature-description']}`}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
