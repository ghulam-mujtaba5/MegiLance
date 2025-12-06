// @AI-HINT: Enhanced first step in proposal submission with AI-powered writing assistance and real-time validation.
'use client';

import React, { useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Calculator, CheckCircle, AlertCircle, Sparkles, Clock } from 'lucide-react';

import { ProposalData, ProposalErrors } from '../../SubmitProposal.types';
import Textarea from '@/app/components/Textarea/Textarea';
import Input from '@/app/components/Input/Input';
import { Label } from '@/app/components/Label/Label';
import Select from '@/app/components/Select/Select';
import Button from '@/app/components/Button/Button';

import common from './StepDetails.common.module.css';
import light from './StepDetails.light.module.css';
import dark from './StepDetails.dark.module.css';

interface StepDetailsProps {
  data: ProposalData;
  updateData: (update: Partial<ProposalData>) => void;
  errors: ProposalErrors;
}

const MIN_COVER_LETTER = 100;
const MAX_COVER_LETTER = 5000;

const availabilityOptions = [
  { value: 'immediate', label: 'Immediate - Can start today' },
  { value: '1-2_weeks', label: '1-2 Weeks - Need to wrap up current work' },
  { value: '1_month', label: '1 Month - Finishing another project' },
  { value: 'flexible', label: 'Flexible - Open to discussion' },
];

const writingTips = [
  "Start with a personalized greeting that shows you read the job post",
  "Highlight 2-3 specific skills that match this job's requirements",
  "Include a brief example of similar work you've completed",
  "Ask a clarifying question to show genuine interest",
  "End with a clear call-to-action",
];

const coverLetterTemplates = [
  {
    name: "Professional Introduction",
    text: "I'm excited to submit my proposal for your project. With [X] years of experience in [field], I've successfully completed similar projects including [example]. I'm confident I can deliver exceptional results.",
  },
  {
    name: "Problem-Solver Approach",
    text: "I understand you need [project goal]. Based on my experience with [relevant skill], I can help you achieve this by [approach]. I've handled similar challenges for [previous client/project].",
  },
  {
    name: "Direct Value Proposition",
    text: "Here's what I bring to your project: [Skill 1] to ensure quality, [Skill 2] for efficient delivery, and [Skill 3] to exceed expectations. My recent work on [project] demonstrates my capability.",
  },
];

const StepDetails: React.FC<StepDetailsProps> = ({ data, updateData, errors }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const [showTips, setShowTips] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Character count and progress
  const charCount = data.coverLetter.length;
  const charProgress = Math.min((charCount / MIN_COVER_LETTER) * 100, 100);
  const isOverLimit = charCount > MAX_COVER_LETTER;
  const isValidLength = charCount >= MIN_COVER_LETTER && charCount <= MAX_COVER_LETTER;

  // Calculate estimated total
  const estimatedTotal = useMemo(() => {
    return (data.hourlyRate || 0) * (data.estimatedHours || 0);
  }, [data.hourlyRate, data.estimatedHours]);

  // Use template
  const useTemplate = (template: typeof coverLetterTemplates[0]) => {
    updateData({ coverLetter: template.text });
    setShowTemplates(false);
  };

  return (
    <div className={cn(common.container, themed.container)}>
      <div className={common.header}>
        <h2 className={cn(common.title, themed.title)}>Project Details</h2>
        <p className={cn(common.description, themed.description)}>
          Craft a compelling proposal that showcases your skills and experience.
        </p>
      </div>

      <div className={common.form}>
        {/* Cover Letter Section */}
        <div className={common.formGroup}>
          <div className={cn(common.labelRow, themed.labelRow)}>
            <Label htmlFor="coverLetter">Cover Letter</Label>
            <div className={common.labelActions}>
              <button 
                type="button"
                className={cn(common.tipButton, themed.tipButton)}
                onClick={() => setShowTips(!showTips)}
                aria-expanded={showTips}
              >
                <Lightbulb size={14} />
                Writing Tips
              </button>
              <button 
                type="button"
                className={cn(common.tipButton, themed.tipButton)}
                onClick={() => setShowTemplates(!showTemplates)}
                aria-expanded={showTemplates}
              >
                <Sparkles size={14} />
                Templates
              </button>
            </div>
          </div>

          {/* Writing Tips Panel */}
          <AnimatePresence>
            {showTips && (
              <motion.div 
                className={cn(common.tipsCard, themed.tipsCard)}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h4 className={cn(common.tipsTitle, themed.tipsTitle)}>
                  <Lightbulb size={16} />
                  Writing Tips for a Winning Proposal
                </h4>
                <ul className={cn(common.tipsList, themed.tipsList)}>
                  {writingTips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Templates Panel */}
          <AnimatePresence>
            {showTemplates && (
              <motion.div 
                className={cn(common.templatesCard, themed.templatesCard)}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h4 className={cn(common.templatesTitle, themed.templatesTitle)}>
                  <Sparkles size={16} />
                  Quick Start Templates
                </h4>
                <div className={common.templatesList}>
                  {coverLetterTemplates.map((template, index) => (
                    <button
                      key={index}
                      type="button"
                      className={cn(common.templateItem, themed.templateItem)}
                      onClick={() => useTemplate(template)}
                    >
                      <span className={cn(common.templateName, themed.templateName)}>
                        {template.name}
                      </span>
                      <span className={cn(common.templatePreview, themed.templatePreview)}>
                        {template.text.substring(0, 60)}...
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Textarea
            id="coverLetter"
            value={data.coverLetter}
            onChange={(e) => updateData({ coverLetter: e.target.value })}
            placeholder="Explain why you're the best fit for this project. Highlight relevant experience and skills..."
            rows={8}
            aria-invalid={!!errors.coverLetter}
            aria-describedby={errors.coverLetter ? "coverLetter-error" : "coverLetter-hint"}
          />
          
          {/* Character Counter */}
          <div className={cn(common.charCounter, themed.charCounter)}>
            <div className={cn(common.charProgress, themed.charProgress)}>
              <motion.div 
                className={cn(
                  common.charProgressFill, 
                  themed.charProgressFill,
                  isValidLength && common.charProgressValid,
                  isOverLimit && common.charProgressError
                )}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(charProgress, 100)}%` }}
              />
            </div>
            <span className={cn(
              common.charCount, 
              themed.charCount,
              isOverLimit && common.charCountError
            )}>
              {isValidLength && <CheckCircle size={12} />}
              {isOverLimit && <AlertCircle size={12} />}
              {charCount}/{MAX_COVER_LETTER} characters
              {charCount < MIN_COVER_LETTER && ` (min ${MIN_COVER_LETTER})`}
            </span>
          </div>
          
          {errors.coverLetter && (
            <p id="coverLetter-error" className={cn(common.error, themed.error)}>
              {errors.coverLetter}
            </p>
          )}
        </div>

        {/* Pricing Section */}
        <div className={cn(common.pricingSection, themed.pricingSection)}>
          <h3 className={cn(common.sectionTitle, themed.sectionTitle)}>
            <Calculator size={18} />
            Pricing & Timeline
          </h3>
          
          <div className={common.row}>
            <div className={common.formGroup}>
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                min="1"
                value={data.estimatedHours || ''}
                onChange={(e) => updateData({ estimatedHours: e.target.value ? Number(e.target.value) : null })}
                placeholder="e.g., 40"
                aria-invalid={!!errors.estimatedHours}
                aria-describedby={errors.estimatedHours ? "estimatedHours-error" : undefined}
              />
              {errors.estimatedHours && (
                <p id="estimatedHours-error" className={cn(common.error, themed.error)}>
                  {errors.estimatedHours}
                </p>
              )}
            </div>

            <div className={common.formGroup}>
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                min="5"
                max="500"
                value={data.hourlyRate || ''}
                onChange={(e) => updateData({ hourlyRate: e.target.value ? Number(e.target.value) : null })}
                placeholder="e.g., 50"
                aria-invalid={!!errors.hourlyRate}
                aria-describedby={errors.hourlyRate ? "hourlyRate-error" : undefined}
              />
              {errors.hourlyRate && (
                <p id="hourlyRate-error" className={cn(common.error, themed.error)}>
                  {errors.hourlyRate}
                </p>
              )}
            </div>
          </div>

          {/* Estimated Total */}
          {estimatedTotal > 0 && (
            <motion.div 
              className={cn(common.estimatedCard, themed.estimatedCard)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={cn(common.estimatedRow, themed.estimatedRow)}>
                <span>Estimated Total</span>
                <span className={cn(common.estimatedTotal, themed.estimatedTotal)}>
                  ${estimatedTotal.toLocaleString()}
                </span>
              </div>
              <div className={cn(common.estimatedBreakdown, themed.estimatedBreakdown)}>
                <span>{data.estimatedHours} hours × ${data.hourlyRate}/hr</span>
                <span className={cn(common.serviceFee, themed.serviceFee)}>
                  Platform fee (10%): ${(estimatedTotal * 0.1).toFixed(2)}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Availability Section */}
        <div className={common.formGroup}>
          <Label htmlFor="availability">
            <Clock size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Availability
          </Label>
          <Select
            id="availability"
            options={availabilityOptions}
            value={data.availability}
            onChange={(e) => updateData({ availability: e.target.value as any })}
          />
          <p id="availability-hint" className={cn(common.hint, themed.hint)}>
            Let the client know when you can start working on their project.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StepDetails;