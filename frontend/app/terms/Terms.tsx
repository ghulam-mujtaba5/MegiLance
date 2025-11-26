// @AI-HINT: This is the Terms of Service page root component. All styles are per-component only. See LegalPage CSS modules for theming.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from '@/app/styles/LegalPage.common.module.css';
import lightStyles from '@/app/styles/LegalPage.light.module.css';
import darkStyles from '@/app/styles/LegalPage.dark.module.css';

const Terms: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  if (!resolvedTheme) return null;

  return (
    <main id="main-content" role="main" className={cn(commonStyles.page, themeStyles.page)}>
      <div className={commonStyles.container}>
        <header className={commonStyles.header}>
          <h1 className={commonStyles.title}>Terms of Service</h1>
          <p className={commonStyles.subtitle}>Last Updated: August 4, 2025</p>
        </header>

        <section className={commonStyles.section} aria-labelledby="terms-1">
          <h2 id="terms-1" className={commonStyles.sectionTitle}>1. Acceptance of Terms</h2>
          <p className={commonStyles.sectionContent}>By accessing or using the MegiLance platform, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you may not access the platform.</p>
        </section>

        <section className={commonStyles.section} aria-labelledby="terms-2">
          <h2 id="terms-2" className={commonStyles.sectionTitle}>2. Platform Services</h2>
          <p className={commonStyles.sectionContent}>MegiLance provides a marketplace connecting clients and freelancers. We use AI for matching and ranking and blockchain for payments. We are not a party to any agreements entered into between clients and freelancers.</p>
        </section>

        <section className={commonStyles.section} aria-labelledby="terms-3">
          <h2 id="terms-3" className={commonStyles.sectionTitle}>3. User Obligations</h2>
          <p className={commonStyles.sectionContent}>You agree to provide accurate information, comply with all applicable laws, and not engage in any fraudulent or harmful activities on the platform. You are responsible for the security of your account and wallet.</p>
        </section>

        <section className={commonStyles.section} aria-labelledby="terms-4">
          <h2 id="terms-4" className={commonStyles.sectionTitle}>4. Payments and Fees</h2>
          <p className={commonStyles.sectionContent}>Clients agree to pay a 5% platform fee on all project payments. All payments are made in USDC and are held in a smart contract escrow until the project is completed to the client&apos;s satisfaction.</p>
        </section>

        <section className={commonStyles.section} aria-labelledby="terms-5">
          <h2 id="terms-5" className={commonStyles.sectionTitle}>5. Disclaimers</h2>
          <p className={commonStyles.sectionContent}>The platform is provided &apos;as is&apos;. We make no warranties regarding the quality of services provided by freelancers or the accuracy of our AI-powered recommendations.</p>
        </section>

        {/* Add more sections as required */}
      </div>
    </main>
  );
};

export default Terms;
