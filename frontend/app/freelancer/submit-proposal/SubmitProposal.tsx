// @AI-HINT: Orchestrator for the multi-step proposal submission flow. Manages state, validation, and navigation between steps.
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertTriangle } from 'lucide-react';

import { ProposalData, ProposalErrors } from './SubmitProposal.types';

import Button from '@/app/components/Button/Button';
import StepIndicator from './components/StepIndicator/StepIndicator';
import StepDetails from './components/StepDetails/StepDetails';
import StepTerms from './components/StepTerms/StepTerms';
import StepReview from './components/StepReview/StepReview';

import common from './SubmitProposal.common.module.css';
import light from './SubmitProposal.light.module.css';
import dark from './SubmitProposal.dark.module.css';

const STEPS = ['Details', 'Terms', 'Review'] as const;
type Step = typeof STEPS[number];

const SubmitProposal: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  const [data, setData] = useState<ProposalData>({
    jobId: '',
    coverLetter: '',
    estimatedHours: null,
    hourlyRate: null,
    availability: 'immediate',
    attachments: [],
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<ProposalErrors>({});
  const [currentStep, setCurrentStep] = useState<Step>('Details');
  const [submitting, setSubmitting] = useState(false);
  const [submissionState, setSubmissionState] = useState<'idle' | 'success' | 'error'>('idle');

  const updateData = useCallback((update: Partial<ProposalData>) => {
    setData(prev => ({ ...prev, ...update }));
  }, []);

  const validateStep = (step: Step): boolean => {
    const newErrors: ProposalErrors = {};
    switch (step) {
      case 'Details':
        if (!data.coverLetter.trim()) newErrors.coverLetter = 'Cover letter is required.';
        if (data.coverLetter.trim().length < 100) newErrors.coverLetter = 'Cover letter must be at least 100 characters.';
        if (!data.estimatedHours || data.estimatedHours <= 0) newErrors.estimatedHours = 'Please enter valid estimated hours.';
        if (!data.hourlyRate || data.hourlyRate <= 0) newErrors.hourlyRate = 'Please enter a valid hourly rate.';
        break;
      case 'Terms':
        if (!data.termsAccepted) newErrors.termsAccepted = 'You must accept the terms to continue.';
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const currentIndex = STEPS.indexOf(currentStep);
      if (currentIndex < STEPS.length - 1) {
        setCurrentStep(STEPS[currentIndex + 1]);
      }
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const goToStep = (step: Step) => {
    const currentIndex = STEPS.indexOf(currentStep);
    const targetIndex = STEPS.indexOf(step);
    if (targetIndex < currentIndex) {
      setCurrentStep(step);
    }
  };

  const onSubmit = async () => {
    for (const step of STEPS) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }
    }
    setSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubmissionState('success');
    } catch (err) {
      setSubmissionState('error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'Details': return <StepDetails data={data} updateData={updateData} errors={errors} />;
      case 'Terms': return <StepTerms data={data} updateData={updateData} errors={errors} />;
      case 'Review': return <StepReview data={data} />;
      default: return null;
    }
  };

  if (submissionState === 'success') {
    return (
      <div className={cn(common.centered_container, themed.centered_container)}>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className={common.result_card}>
          <CheckCircle className={cn(common.result_icon, common.success_icon, themed.success_icon)} size={48} />
          <h2 className={cn(common.result_title, themed.result_title)}>Proposal Submitted Successfully!</h2>
          <p className={cn(common.result_message, themed.result_message)}>Your proposal has been submitted. The client will review it and get back to you soon.</p>
          <Button onClick={() => window.location.reload()}>Submit Another Proposal</Button>
        </motion.div>
      </div>
    );
  }

  if (submissionState === 'error') {
    return (
      <div className={cn(common.centered_container, themed.centered_container)}>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className={common.result_card}>
          <AlertTriangle className={cn(common.result_icon, common.error_icon, themed.error_icon)} size={48} />
          <h2 className={cn(common.result_title, themed.result_title)}>Submission Failed</h2>
          <p className={cn(common.result_message, themed.result_message)}>Something went wrong. Please try submitting again.</p>
          <Button onClick={() => setSubmissionState('idle')}>Try Again</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <main className={cn(common.main, themed.main)}>
      <div className={common.container}>
        <header className={common.header}>
          <h1 className={cn(common.title, themed.title)}>Submit a Proposal</h1>
          <p className={cn(common.subtitle, themed.subtitle)}>Follow the steps to submit your proposal for this job.</p>
        </header>

        <div className={common.step_indicator_container}>
          <StepIndicator steps={STEPS} currentStep={currentStep} />
        </div>

        <div className={common.content_container}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className={cn(common.footer, themed.footer)}>
          <Button
            variant="secondary"
            onClick={prevStep}
            disabled={currentStep === 'Details'}
            className={cn(currentStep === 'Details' && common.hidden)}
          >
            Back
          </Button>
          {currentStep !== 'Review' ? (
            <Button onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button onClick={onSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Proposal'}
            </Button>
          )}
        </footer>
      </div>
    </main>
  );
};

export default SubmitProposal;