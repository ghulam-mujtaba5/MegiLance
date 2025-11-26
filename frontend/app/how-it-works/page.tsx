// @AI-HINT: This page explains the step-by-step process for both clients and freelancers on the platform.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { FileText, Handshake, CheckCircle, UserCircle, Briefcase, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import StepCard from '@/app/components/Public/StepCard/StepCard';
import commonStyles from './HowItWorksPage.common.module.css';
import lightStyles from './HowItWorksPage.light.module.css';
import darkStyles from './HowItWorksPage.dark.module.css';

const clientSteps = [
  {
    stepNumber: 1,
    title: 'Post a Job',
    description: 'Describe your project, set your budget, and post it for our global network of talent to see.',
    icon: <FileText size={40} />,
  },
  {
    stepNumber: 2,
    title: 'Hire a Freelancer',
    description: 'Review proposals, check profiles, and hire the perfect freelancer for your needs. Fund the project via a secure smart contract.',
    icon: <Handshake size={40} />,
  },
  {
    stepNumber: 3,
    title: 'Approve & Pay',
    description: 'Once you are satisfied with the work, approve the milestone, and the payment is released from the smart contract.',
    icon: <CheckCircle size={40} />,
  },
];

const freelancerSteps = [
  {
    stepNumber: 1,
    title: 'Create Your Profile',
    description: 'Showcase your skills, experience, and portfolio to attract high-quality clients from around the world.',
    icon: <UserCircle size={40} />,
  },
  {
    stepNumber: 2,
    title: 'Find & Win Work',
    description: 'Browse jobs, send compelling proposals, and get hired for projects that match your expertise.',
    icon: <Briefcase size={40} />,
  },
  {
    stepNumber: 3,
    title: 'Get Paid in Crypto',
    description: 'Complete the work, get milestone approval, and receive your payment instantly and securely in your crypto wallet.',
    icon: <DollarSign size={40} />,
  },
];

const HowItWorksPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  if (!resolvedTheme) return null;

  return (
    <main id="main-content" role="main" className={cn(commonStyles.container, themeStyles.container)}>
      <header className={commonStyles.header}>
        <h1 className={cn(commonStyles.title, themeStyles.title)}>How MegiLance Works</h1>
        <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>A simple, secure, and decentralized way to get work done.</p>
      </header>

      <section className={commonStyles.main} aria-label="Process overview">
        <section className={commonStyles.section} aria-labelledby="howitworks-clients">
          <h2 id="howitworks-clients" className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>For Clients</h2>
          <div className={commonStyles.grid}>
            {clientSteps.map(step => <StepCard key={step.stepNumber} {...step} />)}
          </div>
        </section>

        <section className={commonStyles.section} aria-labelledby="howitworks-freelancers">
          <h2 id="howitworks-freelancers" className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>For Freelancers</h2>
          <div className={commonStyles.grid}>
            {freelancerSteps.map(step => <StepCard key={step.stepNumber} {...step} />)}
          </div>
        </section>
      </section>
    </main>
  );
};

export default HowItWorksPage;
