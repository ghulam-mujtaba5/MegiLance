// @AI-HINT: This page explains the step-by-step process for both clients and freelancers on the platform.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { FileText, Handshake, CheckCircle, UserCircle, Briefcase, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import StepCard from '@/app/components/Public/StepCard/StepCard';
import './HowItWorksPage.common.css';
import './HowItWorksPage.light.css';
import './HowItWorksPage.dark.css';

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
  const themeClass = resolvedTheme === 'dark' ? 'dark' : 'light';

  return (
    <main id="main-content" role="main" className={cn('HowItWorksPage-container', themeClass)}>
      <header className="HowItWorksPage-header">
        <h1 className="HowItWorksPage-title">How MegiLance Works</h1>
        <p className="HowItWorksPage-subtitle">A simple, secure, and decentralized way to get work done.</p>
      </header>

      <section className="HowItWorksPage-main" aria-label="Process overview">
        <section className="HowItWorksPage-section" aria-labelledby="howitworks-clients">
          <h2 id="howitworks-clients" className="HowItWorksPage-section-title">For Clients</h2>
          <div className="HowItWorksPage-grid">
            {clientSteps.map(step => <StepCard key={step.stepNumber} {...step} />)}
          </div>
        </section>

        <section className="HowItWorksPage-section" aria-labelledby="howitworks-freelancers">
          <h2 id="howitworks-freelancers" className="HowItWorksPage-section-title">For Freelancers</h2>
          <div className="HowItWorksPage-grid">
            {freelancerSteps.map(step => <StepCard key={step.stepNumber} {...step} />)}
          </div>
        </section>
      </section>
    </main>
  );
};

export default HowItWorksPage;
