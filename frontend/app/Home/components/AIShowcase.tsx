// @AI-HINT: This component showcases AI-powered features using a modern, animated grid layout and highlights the underlying technology stack with premium visuals.

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { BrainCircuit, TrendingUp, ShieldCheck, MessageCircle, BarChart, Cpu, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

import AIShowcaseCard from './AIShowcaseCard';
import commonStyles from './AIShowcase.common.module.css';
import lightStyles from './AIShowcase.light.module.css';
import darkStyles from './AIShowcase.dark.module.css';

// --- SVG Logo Components ---
const TensorFlowLogo = () => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>TensorFlow</title><path d="M11.964 0L4.536 4.311v15.378l7.428 4.311 7.428-4.31V4.311zm.036 21.536L6.536 18.38V7.577l5.464-3.155 5.464 3.155v10.8l-5.428 3.156zM12 10.433l-3.103-1.792v3.584L12 14.017l3.103-1.792v-3.584zM8.897 6.845L12 5.05l3.103 1.795v3.583L12 12.22l-3.103-1.792z" fill="currentColor"/></svg>
);

const OpenAILogo = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>OpenAI</title><path d="M22.2819 12.875C22.0719 14.12 21.3919 15.23 20.4019 16.015C19.4119 16.8 18.1919 17.225 16.8919 17.225C15.5919 17.225 14.3719 16.8 13.3819 16.015C12.3919 15.23 11.7119 14.12 11.5019 12.875H16.8919V11.375H11.5019C11.7119 10.13 12.3919 9.02 13.3819 8.235C14.3719 7.45 15.5919 7.025 16.8919 7.025C18.1919 7.025 20.4019 7.45 20.4019 8.235C21.3919 9.02 22.0719 10.13 22.2819 11.375H24V12.875H22.2819ZM9.50188 12.875H1.71188V11.375H9.50188V12.875ZM9.50188 18.725H1.71188V17.225H9.50188V18.725ZM1.71188 8.525H9.50188V7.025H1.71188V8.525Z" fill="currentColor"/></svg>
);

const PyTorchLogo = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>PyTorch</title><path d="M12.01 20.312c-2.188 0-4.062-1.344-4.844-3.344l-1.844.781A6.93 6.93 0 0012.01 22a6.93 6.93 0 006.688-5.25l-1.844-.781a5.25 5.25 0 01-4.844 3.344zM4.108 12.906l1.844-.781a5.25 5.25 0 014.844-3.344c2.188 0 4.063 1.344 4.844 3.344l1.844-.781A6.93 6.93 0 0012.01 6.75a6.93 6.93 0 00-6.688 5.25zM12.01 2a.938.938 0 100 1.875.938.938 0 000-1.875zm7.5 10.031a.938.938 0 100-1.875.938.938 0 000 1.875zM4.51 12.03a.938.938 0 100-1.875.938.938 0 000 1.875z" fill="currentColor"/></svg>
);

const HuggingFaceLogo = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Hugging Face</title><path d="M20.56 17.39a8.312 8.312 0 0 1-11.752 0L12 20.561l3.28-3.17zm-1.64-1.64a6.208 6.208 0 0 0-8.784 0l.168.168c.024.024 2.544 2.592 4.224 2.592s4.2-2.568 4.224-2.592l.168-.168zM12 14.24a.84.84 0 1 1 0-1.68.84.84 0 0 1 0 1.68zm-3.36-2.52a.84.84 0 1 1 0-1.68.84.84 0 0 1 0 1.68zm6.72 0a.84.84 0 1 1 0-1.68.84.84 0 0 1 0 1.68zM17.385 3.44a8.312 8.312 0 0 1 0 11.752l-1.63-1.64a6.208 6.208 0 0 0 0-8.472l1.63-1.64zM6.615 3.44a8.312 8.312 0 0 1 10.77 0L15.755 5.08a6.208 6.208 0 0 0-7.512 0L6.615 3.44zM3.44 6.615a8.312 8.312 0 0 1 0-11.752L5.08 6.495a6.208 6.208 0 0 0 0 8.472L3.44 6.615z" fill="currentColor"/></svg>
);

const ScikitLearnLogo = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>scikit-learn</title><path d="M11.13.43a.48.48 0 00-.76.42l1.36 9.84-8.22 3.03a.48.48 0 00-.28.6l7.4 9.23a.48.48 0 00.76-.42L10.03 13.3l8.22-3.03a.48.48 0 00.28-.6L11.13.44zM24 10.1a2.88 2.88 0 00-2.88-2.88h-1.92a.96.96 0 100 1.92h1.92a.96.96 0 110 1.92h-1.92a.96.96 0 100 1.92h1.92A2.88 2.88 0 0024 10.1z" fill="currentColor"/></svg>
);

// --- Data Definitions ---
const aiFeaturesData = [
  { icon: <BrainCircuit />, title: 'Intelligent Job Matching', description: 'Our AI analyzes your skills and portfolio to match you with high-value projects, eliminating manual search.', stats: '97% Match Accuracy' },
  { icon: <TrendingUp />, title: 'Dynamic Price Modeling', description: 'Get data-driven pricing recommendations based on market trends to maximize your earnings on every project.', stats: '+25% Earning Potential' },
  { icon: <ShieldCheck />, title: 'Proactive Fraud Shield', description: 'Advanced ML algorithms protect you from scams and fraudulent activity, ensuring a secure marketplace.', stats: '99.9% Secure' },
  { icon: <MessageCircle />, title: 'Contextual AI Assist', description: '24/7 intelligent support for platform guidance, proposal generation, and dispute resolution.', stats: '<1min Response' },
  { icon: <BarChart />, title: 'Performance Analytics', description: 'AI-powered insights help you optimize your profile, track your performance, and accelerate your career growth.', stats: '3x Faster Growth' },
  { icon: <Cpu />, title: 'Automated Workflows', description: 'Smart automation handles routine tasks like invoicing and project updates, freeing you to focus on your craft.', stats: '10+ Hours Saved Weekly' },
];

const techStackData = [
  { name: 'TensorFlow', Logo: TensorFlowLogo },
  { name: 'OpenAI', Logo: OpenAILogo },
  { name: 'PyTorch', Logo: PyTorchLogo },
  { name: 'Hugging Face', Logo: HuggingFaceLogo },
  { name: 'scikit-learn', Logo: ScikitLearnLogo },
];

// --- Sub-Components ---
const BackgroundGrid = () => (
  <div className={cn(commonStyles.backgroundGrid)} />
);

const TechLogos = () => {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.techStack, themeStyles.techStack)}>
      <h3 className={cn(commonStyles.techTitle, themeStyles.techTitle)}>Built with Industry-Leading Technology</h3>
      <div className={cn(commonStyles.techLogos, themeStyles.techLogos)}>
        {techStackData.map(({ name, Logo }) => (
          <div key={name} className={cn(commonStyles.techLogo, themeStyles.techLogo)}>
            <Logo />
            <span className={cn(themeStyles.techLogoName)}>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Component ---
const AIShowcase: React.FC = () => {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <section className={cn(commonStyles.aiShowcase, themeStyles.aiShowcase)}>
      <BackgroundGrid />
      <div className={cn(commonStyles.container)}>
        <div className={cn(commonStyles.header)}>
          <div className={cn(commonStyles.badge, themeStyles.badge)}>
            <Zap className={cn(commonStyles.badgeIcon)} />
            <span>Powered by Enterprise-Grade AI</span>
          </div>
          <h2 className={cn(commonStyles.title, themeStyles.title)}>
            Your AI Co-Pilot for Freelance Success
          </h2>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            MegiLance integrates cutting-edge AI to automate the mundane and amplify your potential. Our models are trained on millions of successful projects to give you a competitive edge.
          </p>
        </div>

        <div className={cn(commonStyles.grid)}>
          {aiFeaturesData.map((feature) => (
            <AIShowcaseCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              stats={feature.stats}
            />
          ))}
        </div>

        <TechLogos />
      </div>
    </section>
  );
};

export default AIShowcase;
