// @AI-HINT: This is the Onboarding page root component. It guides new users through setup. All styles are per-component only.
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/app/components/Button/Button';
import { PageTransition } from '@/app/components/Animations/PageTransition';

import commonStyles from './Onboarding.common.module.css';
import lightStyles from './Onboarding.light.module.css';
import darkStyles from './Onboarding.dark.module.css';

const Onboarding: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [step, setStep] = useState(1);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  if (!resolvedTheme) return null;

  const nextStep = () => setStep(prev => prev + 1);
  const finishOnboarding = () => {
    // Redirect to dashboard or another page
    console.log('Onboarding complete!');
  };

  const renderStep = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className={commonStyles.step}
        >
          {step === 1 && (
            <>
              <h2 className={cn(commonStyles.stepTitle, themeStyles.stepTitle)}>Welcome to MegiLance!</h2>
              <p className={cn(commonStyles.stepDescription, themeStyles.stepDescription)}>The AI-powered platform for the future of work. Let&apos;s get your profile set up.</p>
              <Button onClick={nextStep}>Get Started</Button>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className={cn(commonStyles.stepTitle, themeStyles.stepTitle)}>How Our AI Works For You</h2>
              <p className={cn(commonStyles.stepDescription, themeStyles.stepDescription)}>Our AI helps you find the perfect projects by analyzing your skills and ranking your profile. A higher rank means more visibility to clients!</p>
              <Button onClick={nextStep}>Next</Button>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className={cn(commonStyles.stepTitle, themeStyles.stepTitle)}>Connect Your Wallet</h2>
              <p className={cn(commonStyles.stepDescription, themeStyles.stepDescription)}>Securely connect your crypto wallet to receive USDC payments directly. All transactions are handled via smart contracts for your security.</p>
              <Button onClick={finishOnboarding}>Connect Wallet & Finish</Button>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <PageTransition className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.innerContainer}>
        {renderStep()}
        <div className={commonStyles.progress}>
          <div className={cn(commonStyles.progressDot, step >= 1 && commonStyles.progressDotActive, step >= 1 && themeStyles.progressDotActive, themeStyles.progressDot)}></div>
          <div className={cn(commonStyles.progressDot, step >= 2 && commonStyles.progressDotActive, step >= 2 && themeStyles.progressDotActive, themeStyles.progressDot)}></div>
          <div className={cn(commonStyles.progressDot, step >= 3 && commonStyles.progressDotActive, step >= 3 && themeStyles.progressDotActive, themeStyles.progressDot)}></div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Onboarding;
