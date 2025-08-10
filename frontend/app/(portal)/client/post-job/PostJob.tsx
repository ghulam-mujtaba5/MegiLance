// @AI-HINT: Client Post Job page. Theme-aware, accessible multi-section form with validation and entry animations.
'use client';

import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import common from './PostJob.common.module.css';
import light from './PostJob.light.module.css';
import dark from './PostJob.dark.module.css';
import { loadDraft, saveDraft, submitJob, clearDraft } from '@/app/mocks/jobs';

const CATEGORIES = ['Web Development', 'Mobile Apps', 'UI/UX Design', 'Data Science', 'AI/ML', 'DevOps'] as const;
const BUDGET_TYPES = ['Fixed', 'Hourly'] as const;

const PostJob: React.FC = () => {
  const { theme } = useTheme();
  const themed = theme === 'dark' ? dark : light;

  const headerRef = useRef<HTMLDivElement | null>(null);
  const jobRef = useRef<HTMLDivElement | null>(null);
  const detailsRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const jobVisible = useIntersectionObserver(jobRef, { threshold: 0.1 });
  const detailsVisible = useIntersectionObserver(detailsRef, { threshold: 0.1 });

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number] | ''>('');
  const [budgetType, setBudgetType] = useState<(typeof BUDGET_TYPES)[number]>('Fixed');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('React, TypeScript');
  const [timeline, setTimeline] = useState('2-4 weeks');

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [liveMessage, setLiveMessage] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = 'Title is required';
    if (!category) next.category = 'Select a category';
    if (!budget.trim() || Number.isNaN(Number(budget))) next.budget = 'Enter a valid budget';
    if (!description.trim() || description.trim().length < 20) next.description = 'Description should be at least 20 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // Load existing draft on mount
  useEffect(() => {
    const d = loadDraft();
    if (d) {
      setTitle(d.title ?? '');
      setCategory((d.category as any) ?? '');
      setBudgetType((d.budgetType as any) ?? 'Fixed');
      setBudget(d.budget != null ? String(d.budget) : '');
      setDescription(d.description ?? '');
      setSkills(d.skills?.join(', ') ?? '');
      setTimeline(d.timeline ?? '');
      setLiveMessage('Loaded your saved draft.');
    }
  }, []);

  const persistDraft = () => {
    saveDraft({
      title,
      category,
      budgetType,
      budget: budget ? Number(budget) : null,
      description,
      skills: skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      timeline,
      status: 'draft',
    });
    setLiveMessage('Draft saved.');
  };

  const discardDraft = () => {
    clearDraft();
    setLiveMessage('Draft discarded.');
  };

  const nextStep = () => {
    if (step === 1) {
      // Partial validation for basics
      const next: Record<string, string> = {};
      if (!title.trim()) next.title = 'Title is required';
      if (!category) next.category = 'Select a category';
      setErrors(next);
      if (Object.keys(next).length > 0) return;
      persistDraft();
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!validate()) return;
      persistDraft();
      setStep(3);
      return;
    }
  };

  const prevStep = () => {
    setStep((s) => (s === 3 ? 2 : 1));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setStep(2);
      return;
    }
    setSubmitting(true);
    setLiveMessage('Submitting your job…');
    try {
      const result = await submitJob({
        title,
        category,
        budgetType,
        budget: Number(budget),
        description,
        skills: skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        timeline,
      });
      setLiveMessage(`Success: ${result.message} (id: ${result.id})`);
      // Reset local state to fresh form
      setTitle('');
      setCategory('');
      setBudgetType('Fixed');
      setBudget('');
      setDescription('');
      setSkills('');
      setTimeline('');
      setErrors({});
      setStep(1);
    } catch (err) {
      setLiveMessage('Error submitting job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <div ref={headerRef} className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}>
          <div>
            <h1 className={common.title}>Post a Job</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Create a new job with clear requirements so the best freelancers can apply.</p>
          </div>
        </div>

        <form className={common.form} onSubmit={onSubmit} noValidate>
          {/* Step indicator */}
          <div className={common.progress} aria-live="polite">
            Step {step} of 3
          </div>

          {step === 1 && (
          <section ref={jobRef} className={cn(common.section, themed.section, jobVisible ? common.isVisible : common.isNotVisible)} aria-labelledby="job-basics">
            <h2 id="job-basics" className={cn(common.sectionTitle, themed.sectionTitle)}>Job Basics</h2>
            <div className={common.field}>
              <label htmlFor="title" className={common.label}>Title</label>
              <input
                id="title"
                className={cn(common.input, themed.input)}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                aria-invalid={Boolean(errors.title) || undefined}
                aria-describedby={errors.title ? 'error-title' : undefined}
                placeholder="e.g., Build a Next.js marketing site"
              />
              {errors.title && (
                <div id="error-title" className={common.error} role="status" aria-live="polite">{errors.title}</div>
              )}
            </div>
            <div className={common.row}>
              <div className={common.field}>
                <label htmlFor="category" className={common.label}>Category</label>
                <select
                  id="category"
                  className={cn(common.select, themed.select)}
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  required
                  aria-invalid={Boolean(errors.category) || undefined}
                  aria-describedby={errors.category ? 'error-category' : undefined}
                >
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && (
                  <div id="error-category" className={common.error} role="status" aria-live="polite">{errors.category}</div>
                )}
              </div>
              <div className={common.field}>
                <label htmlFor="budgetType" className={common.label}>Budget Type</label>
                <select id="budgetType" className={cn(common.select, themed.select)} value={budgetType} onChange={(e) => setBudgetType(e.target.value as any)}>
                  {BUDGET_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                </select>
              </div>
            </div>
            <div className={common.row}>
              <div className={common.field}>
                <label htmlFor="budget" className={common.label}>{budgetType === 'Fixed' ? 'Budget (USD)' : 'Hourly Rate (USD)'}</label>
                <input
                  id="budget"
                  className={cn(common.input, themed.input)}
                  inputMode="decimal"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                  aria-invalid={Boolean(errors.budget) || undefined}
                  aria-describedby={errors.budget ? 'error-budget' : undefined}
                  placeholder={budgetType === 'Fixed' ? 'e.g., 1500' : 'e.g., 45'}
                />
                {errors.budget && (
                  <div id="error-budget" className={common.error} role="status" aria-live="polite">{errors.budget}</div>
                )}
              </div>
              <div className={common.field}>
                <label htmlFor="timeline" className={common.label}>Timeline</label>
                <input id="timeline" className={cn(common.input, themed.input)} value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder="e.g., 2-4 weeks" />
                <div className={cn(common.help, themed.help)}>Provide a rough timeframe.</div>
              </div>
            </div>
            <div className={common.stickyBar}>
              <button type="button" className={cn(common.button, 'secondary', themed.button)} onClick={persistDraft}>Save Draft</button>
              <div>
                <button type="button" className={cn(common.button, 'secondary', themed.button)} onClick={discardDraft}>Discard</button>
                <button type="button" className={cn(common.button, 'primary', themed.button)} onClick={nextStep}>Next</button>
              </div>
            </div>
          </section>
          )}

          {step === 2 && (
          <section ref={detailsRef} className={cn(common.section, themed.section, detailsVisible ? common.isVisible : common.isNotVisible)} aria-labelledby="job-details">
            <h2 id="job-details" className={cn(common.sectionTitle, themed.sectionTitle)}>Details</h2>
            <div className={common.field}>
              <label htmlFor="description" className={common.label}>Description</label>
              <textarea
                id="description"
                className={cn(common.textarea, themed.textarea)}
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                aria-invalid={Boolean(errors.description) || undefined}
                aria-describedby={errors.description ? 'error-description' : undefined}
                placeholder="Describe the scope, deliverables, and any constraints."
              />
              {errors.description && (
                <div id="error-description" className={common.error} role="status" aria-live="polite">{errors.description}</div>
              )}
            </div>
            <div className={common.field}>
              <label htmlFor="skills" className={common.label}>Skills</label>
              <input id="skills" className={cn(common.input, themed.input)} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Comma-separated skills (e.g., React, Tailwind)" />
              <div className={cn(common.help, themed.help)}>We’ll suggest top freelancers based on these skills.</div>
            </div>
            <div className={common.stickyBar}>
              <button type="button" className={cn(common.button, 'secondary', themed.button)} onClick={prevStep}>Back</button>
              <div>
                <button type="button" className={cn(common.button, 'secondary', themed.button)} onClick={persistDraft}>Save Draft</button>
                <button type="button" className={cn(common.button, 'primary', themed.button)} onClick={nextStep}>Preview</button>
              </div>
            </div>
          </section>
          )}

          {step === 3 && (
            <section className={cn(common.section, themed.section)} aria-labelledby="job-preview">
              <h2 id="job-preview" className={cn(common.sectionTitle, themed.sectionTitle)}>Preview</h2>
              <div className={common.card}>
                <h3 className={common.cardTitle}>{title || 'Untitled job'}</h3>
                <p className={common.meta}><strong>Category:</strong> {category || '—'}</p>
                <p className={common.meta}><strong>Budget:</strong> {budgetType} {budget ? `$${budget}` : '—'}</p>
                <p className={common.meta}><strong>Timeline:</strong> {timeline || '—'}</p>
                <p className={common.meta}><strong>Skills:</strong> {skills || '—'}</p>
                <p className={common.description}>{description || 'No description provided.'}</p>
              </div>
              <div className={common.stickyBar}>
                <button type="button" className={cn(common.button, 'secondary', themed.button)} onClick={prevStep}>Back</button>
                <div>
                  <button type="button" className={cn(common.button, 'secondary', themed.button)} onClick={persistDraft}>Save Draft</button>
                  <button type="submit" disabled={submitting} className={cn(common.button, 'primary', themed.button)}>{submitting ? 'Submitting…' : 'Submit Job'}</button>
                </div>
              </div>
            </section>
          )}

          {hasErrors && (
            <div role="status" aria-live="polite" className={common.error}>
              Please fix the highlighted fields.
            </div>
          )}
          {liveMessage && (
            <div role="status" aria-live="polite" className={common.help}>
              {liveMessage}
            </div>
          )}
        </form>
      </div>
    </main>
  );
};

export default PostJob;
