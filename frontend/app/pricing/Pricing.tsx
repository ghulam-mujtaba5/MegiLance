// @AI-HINT: This is the Pricing page component. It displays pricing tiers, features, a monthly/yearly toggle, and an FAQ section. It is designed to be responsive and themeable, following the MegiLance brand playbook.
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Button from '@/app/components/Button/Button';
import { FaCheckCircle, FaChevronDown, FaUser, FaBuilding, FaRocket } from 'react-icons/fa';
import './Pricing.common.css';
import './Pricing.light.css';
import './Pricing.dark.css';

// --- COMPONENT PROPS --- //
interface PricingProps {
  theme?: 'light' | 'dark';
}

// --- MOCK DATA --- //
const pricingTiers = [
  {
    name: 'Freelancer',
    icon: <FaUser />,
    description: 'For talented individuals ready to take on their next project.',
    price: { monthly: 0, yearly: 0 },
    features: [
      'Create a professional profile',
      'Browse and apply for unlimited projects',
      'Receive secure crypto payments (USDC)',
      'Benefit from AI-powered profile ranking',
    ],
    button: { text: 'Get Started for Free', href: '/signup', variant: 'secondary' as const },
  },
  {
    name: 'Client',
    icon: <FaBuilding />,
    description: 'For businesses looking to hire top-tier, AI-vetted talent.',
    price: { monthly: 49, yearly: 499 },
    features: [
      'Post unlimited job opportunities',
      'Access our pool of AI-vetted freelancers',
      'Secure project funding with smart contracts',
      'Utilize AI-analyzed performance reviews',
      'Dedicated account manager',
    ],
    button: { text: 'Start Hiring', href: '/signup?plan=client', variant: 'primary' as const },
    isPopular: true,
  },
  {
    name: 'Enterprise',
    icon: <FaRocket />,
    description: 'Custom solutions for large-scale teams and agencies.',
    price: 'Custom',
    features: [
      'All features from the Client plan',
      'Advanced team management tools',
      'Custom compliance & security features',
      'API access & third-party integrations',
      'Priority, 24/7 dedicated support',
    ],
    button: { text: 'Contact Sales', href: '/contact', variant: 'outline' as const },
  },
];

const faqItems = [
  {
    question: 'Can I try MegiLance before committing?',
    answer: 'Absolutely! Our Freelancer plan is completely free and allows you to explore the platform, create a profile, and browse projects. For clients, we offer a 14-day money-back guarantee on your first month.'
  },
  {
    question: 'What are the benefits of the yearly plan?',
    answer: 'By choosing the yearly plan, you get a significant discount, equivalent to two months free compared to the monthly subscription. It\'s the best value for clients planning to hire consistently.'
  },
  {
    question: 'How does the AI vetting process work?',
    answer: 'Our proprietary AI analyzes a freelancer\'s portfolio, skills, past project success, and client feedback to provide a comprehensive vetting score. This helps you hire with confidence, knowing you\'re getting top talent.'
  },
  {
    question: 'What kind of payment methods are supported?',
    answer: 'All payments on MegiLance are handled securely on the blockchain using USDC (USD Coin), a stablecoin pegged to the US dollar. This ensures fast, transparent, and low-fee transactions for both clients and freelancers.'
  }
];

// --- FAQ Item Sub-component --- //
const FaqItem = ({ item, isOpen, onClick }: { item: { question: string; answer: string }, isOpen: boolean, onClick: () => void }) => {
  return (
    <div className="Faq-item">
      <button className="Faq-question" onClick={onClick}>
        <span>{item.question}</span>
        <FaChevronDown className={`Faq-chevron ${isOpen ? 'open' : ''}`} />
      </button>
      <div className={`Faq-answer ${isOpen ? 'open' : ''}`}>
        <p>{item.answer}</p>
      </div>
    </div>
  );
};

// --- Main Pricing Component --- //
const Pricing: React.FC<PricingProps> = ({ theme = 'light' }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(0); // Keep the first FAQ item open by default

  const handleFaqToggle = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className={`Pricing Pricing--${theme}`}>
      <div className="Pricing-container">
        <header className="Pricing-header">
          <span className="Pricing-header-eyebrow">Pricing Plans</span>
          <h1>Find the Perfect Plan for Your Needs</h1>
          <p className="Pricing-header-description">From individual freelancers to large enterprises, MegiLance offers a tailored solution to achieve your goals with the power of AI and secure payments.</p>
        </header>

        <div className="Pricing-toggle-wrapper">
          <span className={`Pricing-toggle-label ${billingCycle === 'monthly' ? 'active' : ''}`}>Monthly</span>
          <div className="Pricing-toggle">
            <input
              type="checkbox"
              id="billing-toggle"
              className="Pricing-toggle-checkbox"
              checked={billingCycle === 'yearly'}
              onChange={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              aria-label="Billing cycle toggle"
            />
            <label htmlFor="billing-toggle" className="Pricing-toggle-slider"></label>
          </div>
          <span className={`Pricing-toggle-label ${billingCycle === 'yearly' ? 'active' : ''}`}>Yearly</span>
          <span className="Pricing-toggle-discount">Save 20%</span>
        </div>

        <div className="Pricing-grid">
          {pricingTiers.map(tier => (
            <div key={tier.name} className={`Pricing-card ${tier.isPopular ? 'popular' : ''}`}>
              {tier.isPopular && <div className="Pricing-card-popular-badge">Most Popular</div>}
              <div className="Pricing-card-header">
                <div className="Pricing-card-icon">{tier.icon}</div>
                <h2 className="Pricing-card-tier">{tier.name}</h2>
              </div>
              <div className="Pricing-card-price-section">
                {typeof tier.price === 'string' ? (
                  <div className="Pricing-card-price custom">{tier.price}</div>
                ) : (
                  <div className="Pricing-card-price">
                    <span className="price-amount">${billingCycle === 'monthly' ? tier.price.monthly : tier.price.yearly}</span>
                    <span className="price-period">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                )}
                <p className="Pricing-card-description">{tier.description}</p>
              </div>
              <ul className="Pricing-card-features">
                {tier.features.map(feature => (
                  <li key={feature} className="Pricing-card-feature-item">
                    <FaCheckCircle className="Pricing-card-feature-icon" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="Pricing-card-cta">
                <Link href={tier.button.href} passHref>
                  <Button theme={theme} variant={tier.button.variant} fullWidth>{tier.button.text}</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <section className="Pricing-faq">
          <div className="Pricing-faq-header">
            <h2>Frequently Asked Questions</h2>
            <p>Have questions? We've got answers. If you can't find what you're looking for, feel free to contact us.</p>
          </div>
          <div className="Pricing-faq-list">
            {faqItems.map((item, index) => (
              <FaqItem 
                key={item.question} 
                item={item} 
                isOpen={openFaq === index}
                onClick={() => handleFaqToggle(index)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Pricing;
