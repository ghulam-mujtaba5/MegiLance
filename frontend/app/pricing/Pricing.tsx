/* AI-HINT: This is the main component for the public-facing pricing page. It orchestrates the layout, data, and state for the entire page, integrating reusable components like BillingToggle, PricingCard, and FaqItem to create a modern, theme-aware, and interactive user experience. */

'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';

// Modular Components
import { BillingToggle } from '@/components/pricing/BillingToggle/BillingToggle';
import { PricingCard, PricingCardProps } from '@/components/pricing/PricingCard/PricingCard';
import { FaqItem } from '@/components/pricing/FaqItem/FaqItem';

// Page-specific Styles
import styles from './Pricing.common.module.css';
import lightStyles from './Pricing.light.module.css';
import darkStyles from './Pricing.dark.module.css';

// --- Data Definitions ---
const pricingData: Omit<PricingCardProps, 'price' | 'pricePeriod' | 'ctaText' | 'ctaLink'>[] = [
  {
    tier: 'Freelancer',
    description: 'For talented individuals ready to take on their next project.',
    features: [
      'Create a professional profile',
      'Browse and apply for unlimited projects',
      'Receive secure crypto payments (USDC)',
      'Benefit from AI-powered profile ranking',
    ],
  },
  {
    tier: 'Client',
    description: 'For businesses looking to hire top-tier, AI-vetted talent.',
    features: [
      'Post unlimited job opportunities',
      'Access our pool of AI-vetted freelancers',
      'Secure project funding with smart contracts',
      'Utilize AI-analyzed performance reviews',
      'Dedicated account manager',
    ],
    isPopular: true,
  },
  {
    tier: 'Enterprise',
    description: 'Custom solutions for large-scale teams and agencies.',
    features: [
      'All features from the Client plan',
      'Advanced team management tools',
      'Custom compliance & security features',
      'API access & third-party integrations',
      'Priority, 24/7 dedicated support',
    ],
  },
];

const faqData = [
  {
    question: 'Can I try MegiLance before committing?',
    answer: 'Absolutely! Our Freelancer plan is completely free and allows you to explore the platform, create a profile, and browse projects. For clients, we offer a 14-day money-back guarantee on your first month.'
  },
  {
    question: 'What are the benefits of the yearly plan?',
    answer: 'By choosing the yearly plan, you get a significant discount, equivalent to two months free compared to the monthly subscription. It is the best value for clients planning to hire consistently.'
  },
  {
    question: 'How does the AI vetting process work?',
    answer: 'Our proprietary AI analyzes a freelancer\'s portfolio, skills, past project success, and client feedback to provide a comprehensive vetting score. This helps you hire with confidence, knowing you are getting top talent.'
  },
  {
    question: 'What kind of payment methods are supported?',
    answer: 'All payments on MegiLance are handled securely on the blockchain using USDC (USD Coin), a stablecoin pegged to the US dollar. This ensures fast, transparent, and low-fee transactions for both clients and freelancers.'
  }
];

// --- Animated Section Wrapper ---
const AnimatedSection = ({ children }: { children: React.ReactNode }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.1 });

  return (
    <div ref={ref} className={`${styles.isNotVisible} ${isVisible ? styles.isVisible : ''}`}>
      {children}
    </div>
  );
};

// --- Main Pricing Page Component ---
const PricingPage = () => {
  const { theme } = useTheme();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  const getTierProps = (tier: string): Pick<PricingCardProps, 'price' | 'pricePeriod' | 'ctaText' | 'ctaLink'> => {
    const isMonthly = billingCycle === 'monthly';
    switch (tier) {
      case 'Freelancer':
        return { price: '$0', pricePeriod: '', ctaText: 'Get Started for Free', ctaLink: '/signup' };
      case 'Client':
        return { price: isMonthly ? '$49' : '$499', pricePeriod: isMonthly ? '/mo' : '/yr', ctaText: 'Start Hiring', ctaLink: '/signup?plan=client' };
      case 'Enterprise':
        return { price: 'Custom', pricePeriod: '', ctaText: 'Contact Sales', ctaLink: '/contact' };
      default:
        return { price: '', pricePeriod: '', ctaText: '', ctaLink: '#' }; // Should not happen
    }
  };

  return (
    <div className={`${styles.page} ${themeStyles.page}`}>
      <div className={styles.container}>
        <AnimatedSection>
          <header className={styles.header}>
            <h1 className={`${styles.title} ${themeStyles.title}`}>Find the perfect plan for your needs</h1>
            <p className={`${styles.subtitle} ${themeStyles.subtitle}`}>
              Whether you&apos;re a solo freelancer or a growing enterprise, MegiLance offers flexible pricing to help you succeed.
            </p>
          </header>
        </AnimatedSection>

        <AnimatedSection>
          <div className={styles.billingToggleWrapper}>
            <BillingToggle billingCycle={billingCycle} setBillingCycle={setBillingCycle} />
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <div className={styles.grid}>
            {pricingData.map((tier) => (
              <PricingCard
                key={tier.tier}
                {...tier}
                {...getTierProps(tier.tier)}
              />
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <section className={styles.faqSection} aria-labelledby="faq-heading">
            <header className={styles.faqHeader}>
              <h2 id="faq-heading" className={`${styles.faqTitle} ${themeStyles.faqTitle}`}>Frequently Asked Questions</h2>
              <p className={`${styles.faqSubtitle} ${themeStyles.faqSubtitle}`}>
                Have questions? We&apos;ve got answers. If you can&apos;t find what you&apos;re looking for, feel free to contact us.
              </p>
            </header>
            <div className={`${styles.faqList} ${themeStyles.faqList}`}>
              {faqData.map((faq, index) => (
                <FaqItem key={index} question={faq.question}>
                  <p>{faq.answer}</p>
                </FaqItem>
              ))}
            </div>
          </section>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default PricingPage;
