// @AI-HINT: Client Hire flow. Theme-aware, accessible multi-step UI with animated sections.
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import common from './Hire.common.module.css';
import light from './Hire.light.module.css';
import dark from './Hire.dark.module.css';
import { loadHireDraft, saveHireDraft, submitHire, clearHireDraft } from '@/app/mocks/hires';

const STEPS = ['Freelancer', 'Scope', 'Terms', 'Review'] as const;

type Step = typeof STEPS[number];

const Hire: React.FC = () => {
  const { theme } = useTheme();
  const themed = theme === 'dark' ? dark : light;
  const params = useSearchParams();

  const [step, setStep] = useState<Step>('Freelancer');
  const [freelancerId, setFreelancerId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rateType, setRateType] = useState<'Hourly' | 'Fixed'>('Hourly');
  const [rate, setRate] = useState('');
  const [startDate, setStartDate] = useState('');

  useEffect(() => {
    const f = params.get('freelancer');
    if (f) setFreelancerId(f);
  }, [params]);

  const headerRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const sectionVisible = useIntersectionObserver(sectionRef, { threshold: 0.1 });

  const currentIndex = useMemo(() => STEPS.indexOf(step), [step]);
  const progress = useMemo(() => Math.round(((currentIndex + 1) / STEPS.length) * 100), [currentIndex]);

  const canNext = useMemo(() => {
    switch (step) {
      case 'Freelancer':
        return Boolean(freelancerId);
      case 'Scope':
        return title.trim().length > 2 && description.trim().length > 10;
      case 'Terms':
        return rate.trim().length > 0 && Number(rate) > 0 && Boolean(startDate);
      case 'Review':
        return true;
    }
  }, [step, freelancerId, title, description, rate, startDate]);

  const goNext = () => {
    if (!canNext) return;
    if (currentIndex < STEPS.length - 1) setStep(STEPS[currentIndex + 1]);
  };

  const goBack = () => {
    if (currentIndex > 0) setStep(STEPS[currentIndex - 1]);
  };

  // Draft persistence via mock API
  const [liveMessage, setLiveMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const d = loadHireDraft();
    if (d) {
      if (d.freelancerId) setFreelancerId(d.freelancerId);
      if (d.title) setTitle(d.title);
      if (d.description) setDescription(d.description);
      if (d.rateType) setRateType(d.rateType);
      if (typeof d.rate === 'number' && !Number.isNaN(d.rate)) setRate(String(d.rate));
      if (d.startDate) setStartDate(d.startDate);
      setLiveMessage('Loaded your saved draft.');
    }
  }, []);

  const saveDraft = () => {
    saveHireDraft({
      freelancerId,
      title,
      description,
      rateType,
      rate: rate ? Number(rate) : null,
      startDate,
      status: 'draft',
    });
    setLiveMessage('Draft saved.');
  };

  const resetForm = () => {
    setFreelancerId('');
    setTitle('');
    setDescription('');
    setRateType('Hourly');
    setRate('');
    setStartDate('');
    setStep('Freelancer');
    clearHireDraft();
    setLiveMessage('Draft cleared.');
  };

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <header ref={headerRef} className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}>
          <div>
            <h1 className={common.title}>Hire a Freelancer</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Complete the steps to send a hiring request.</p>
          </div>
          <div className={common.progressBar} role="progressbar" aria-label="Hire progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <div className={common.progressTrack}>
              <div className={common.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <span className={common.progressText}>{progress}%</span>
          </div>
          <nav className={common.steps} aria-label="Progress">
            {STEPS.map((s) => (
              <span
                key={s}
                className={cn(common.step, themed.step, s === step && cn(common.stepActive, themed.stepActive))}
                aria-current={s === step ? 'step' : undefined}
              >
                {s}
              </span>
            ))}
          </nav>
        </header>

        {liveMessage && (
          <div role="status" aria-live="polite" aria-atomic="true" className={cn(common.subtitle, themed.subtitle)}>
            {liveMessage}
          </div>
        )}

        <section ref={sectionRef} className={cn(common.section, themed.section, sectionVisible ? common.isVisible : common.isNotVisible)}>
          {step === 'Freelancer' && (
            <div role="group" aria-labelledby="freelancer-title">
              <h2 id="freelancer-title" className={cn(common.sectionTitle, themed.sectionTitle)}>Select Freelancer</h2>
              <label htmlFor="freelancer" className={common.srOnly}>Freelancer ID</label>
              <input
                id="freelancer"
                className={cn(common.input, themed.input)}
                placeholder="Enter Freelancer ID or paste from profiles"
                value={freelancerId}
                onChange={(e) => setFreelancerId(e.target.value)}
                aria-describedby="freelancer-help"
                aria-invalid={!freelancerId || undefined}
              />
              <div id="freelancer-help" className={common.help}>Paste from a profile or type the known ID.</div>
            </div>
          )}

          {step === 'Scope' && (
            <div role="group" aria-labelledby="scope-title">
              <h2 id="scope-title" className={cn(common.sectionTitle, themed.sectionTitle)}>Define Scope</h2>
              <label htmlFor="title" className={common.srOnly}>Title</label>
              <input
                id="title"
                className={cn(common.input, themed.input)}
                placeholder="e.g., Build a mobile app MVP"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-describedby="title-help title-count"
                aria-invalid={!(title.trim().length > 2) || undefined}
              />
              <div className={common.counters}>
                <span id="title-help" className={common.help}>Add a clear, descriptive summary.</span>
                <span id="title-count" className={common.count}>{title.trim().length} chars</span>
              </div>
              <label htmlFor="desc" className={common.srOnly}>Description</label>
              <textarea
                id="desc"
                className={cn(common.textarea, themed.textarea)}
                placeholder="Describe scope, deliverables, timelines, and constraints."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                aria-describedby="desc-help desc-count"
                aria-invalid={!(description.trim().length > 10) || undefined}
              />
              <div className={common.counters}>
                <span id="desc-help" className={common.help}>Minimum 10 characters. Add milestones for clarity.</span>
                <span id="desc-count" className={common.count}>{description.trim().length} chars</span>
              </div>
            </div>
          )}

          {step === 'Terms' && (
            <div role="group" aria-labelledby="terms-title">
              <h2 id="terms-title" className={cn(common.sectionTitle, themed.sectionTitle)}>Terms</h2>
              <div className={common.row}>
                <div>
                  <label htmlFor="rateType" className={common.srOnly}>Rate Type</label>
                  <select id="rateType" className={cn(common.select, themed.select)} value={rateType} onChange={(e) => setRateType(e.target.value as any)}>
                    <option>Hourly</option>
                    <option>Fixed</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="rate" className={common.srOnly}>Rate</label>
                  <input
                    id="rate"
                    className={cn(common.input, themed.input)}
                    placeholder={rateType === 'Hourly' ? '$/hr' : 'Total $'}
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    aria-describedby="rate-help"
                    aria-invalid={!(Number(rate) > 0) || undefined}
                    inputMode="decimal"
                  />
                  <div id="rate-help" className={common.help}>Enter a positive number. Example: 45 or 1500</div>
                </div>
              </div>
              <div className={common.row}>
                <div>
                  <label htmlFor="start" className={common.srOnly}>Start Date</label>
                  <input id="start" className={cn(common.input, themed.input)} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} aria-invalid={!startDate || undefined} />
                </div>
                <div aria-hidden="true" />
              </div>
            </div>
          )}

          {step === 'Review' && (
            <div role="group" aria-labelledby="review-title">
              <h2 id="review-title" className={cn(common.sectionTitle, themed.sectionTitle)}>Review & Confirm</h2>
              <ul role="list">
                <li role="listitem">Freelancer ID: {freelancerId || '—'}</li>
                <li role="listitem">Title: {title || '—'}</li>
                <li role="listitem">Rate: {rateType} {rate || '—'}</li>
                <li role="listitem">Start: {startDate || '—'}</li>
              </ul>
            </div>
          )}

          <div className={common.actions}>
            <button type="button" className={cn(common.button, themed.button)} onClick={saveDraft}>Save Draft</button>
            <button type="button" className={cn(common.button, 'secondary', themed.button)} onClick={resetForm}>Reset</button>
            <button type="button" className={cn(common.button, 'secondary', themed.button)} onClick={goBack} disabled={currentIndex === 0} aria-disabled={currentIndex === 0 || undefined}>
              Back
            </button>
            {step !== 'Review' ? (
              <button type="button" className={cn(common.button, 'primary', themed.button)} onClick={goNext} disabled={!canNext} aria-disabled={!canNext || undefined}>
                Continue
              </button>
            ) : (
              <button
                type="button"
                className={cn(common.button, 'primary', themed.button)}
                onClick={async () => {
                  if (!canNext) return;
                  setSubmitting(true);
                  setLiveMessage('Sending hire request…');
                  try {
                    const res = await submitHire({
                      freelancerId,
                      title,
                      description,
                      rateType,
                      rate: Number(rate),
                      startDate,
                    });
                    setLiveMessage(`Success: ${res.message} (id: ${res.id})`);
                    resetForm();
                  } catch (e) {
                    setLiveMessage('Error sending request. Please try again.');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={submitting}
              >
                {submitting ? 'Sending…' : 'Send Request'}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Hire;
