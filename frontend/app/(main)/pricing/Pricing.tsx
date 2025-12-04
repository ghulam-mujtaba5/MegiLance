// @AI-HINT: This is the primary pricing page component. It includes a monthly/annual toggle and uses the reusable PricingCard component to display different tiers.
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PricingCard } from '@/components/pricing/PricingCard/PricingCard';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import commonStyles from './Pricing.common.module.css';
import lightStyles from './Pricing.light.module.css';
import darkStyles from './Pricing.dark.module.css';

const pricingData = {
  monthly: [
    {
      tier: 'Starter',
      description: 'For individuals and hobbyists getting started.',
      price: '$0',
      pricePeriod: '/ forever',
      features: ['Unlimited project browsing', 'Standard messaging tools', 'Access to community forum'],
      ctaText: 'Start for Free',
      ctaLink: '/signup?plan=starter',
    },
    {
      tier: 'Pro',
      description: 'For professional freelancers and small businesses.',
      price: '$29',
      pricePeriod: '/ month',
      features: ['Everything in Starter', 'Priority project invites', 'Advanced search filters', 'Verified freelancer badge', 'AI-powered proposal assistant'],
      isPopular: true,
      ctaText: 'Start Your Trial',
      ctaLink: '/signup?plan=pro',
    },
    {
      tier: 'Teams',
      description: 'For agencies and teams collaborating on projects.',
      price: '$99',
      pricePeriod: '/ month',
      features: ['Everything in Pro', 'Up to 5 team seats', 'Shared team wallet', 'Dedicated account manager', 'Priority support'],
      ctaText: 'Contact Sales',
      ctaLink: '/contact?plan=teams',
    },
  ],
  annually: [
    {
      tier: 'Starter',
      description: 'For individuals and hobbyists getting started.',
      price: '$0',
      pricePeriod: '/ forever',
      features: ['Unlimited project browsing', 'Standard messaging tools', 'Access to community forum'],
      ctaText: 'Start for Free',
      ctaLink: '/signup?plan=starter',
    },
    {
      tier: 'Pro',
      description: 'For professional freelancers and small businesses.',
      price: '$24',
      pricePeriod: '/ month',
      features: ['Everything in Starter', 'Priority project invites', 'Advanced search filters', 'Verified freelancer badge', 'AI-powered proposal assistant'],
      isPopular: true,
      ctaText: 'Start Your Trial',
      ctaLink: '/signup?plan=pro-annual',
    },
    {
      tier: 'Teams',
      description: 'For agencies and teams collaborating on projects.',
      price: '$83',
      pricePeriod: '/ month',
      features: ['Everything in Pro', 'Up to 5 team seats', 'Shared team wallet', 'Dedicated account manager', 'Priority support'],
      ctaText: 'Contact Sales',
      ctaLink: '/contact?plan=teams-annual',
    },
  ],
};

const Pricing: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const { resolvedTheme } = useTheme();
  const styles = {
    ...commonStyles,
    ...(resolvedTheme === 'dark' ? darkStyles : lightStyles),
  };

  return (
    <PageTransition>
      <main id="main-content" className={styles.root}>
        <ScrollReveal>
          <div className={styles.header}>
            <h1 className={styles.title}>Find the perfect plan</h1>
            <p className={styles.subtitle}>Start for free, then upgrade or downgrade anytime. No hidden fees.</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className={styles.toggleContainer}>
            <span className={cn(styles.toggleLabel, billingCycle === 'monthly' && styles.activeLabel)}>Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')}
              className={styles.toggleSwitch}
              aria-label={`Switch to ${billingCycle === 'monthly' ? 'annual' : 'monthly'} billing`}
            >
              <motion.div className={styles.toggleHandle} layout transition={{ type: 'spring', stiffness: 700, damping: 30 }} />
            </button>
            <span className={cn(styles.toggleLabel, billingCycle === 'annually' && styles.activeLabel)}>
              Annually <span className={styles.discountBadge}>Save 15%</span>
            </span>
          </div>
        </ScrollReveal>

        <StaggerContainer className={styles.grid}>
          {pricingData[billingCycle].map((tier) => (
            <StaggerItem key={tier.tier}>
              <PricingCard {...tier} />
            </StaggerItem>
          ))}
        </StaggerContainer>

        <ScrollReveal delay={0.4}>
          <p className={styles.note}>All prices in USD. Applicable taxes may be added at checkout. Contact us for enterprise solutions.</p>
        </ScrollReveal>
      </main>
    </PageTransition>
  );
};

export default Pricing;
