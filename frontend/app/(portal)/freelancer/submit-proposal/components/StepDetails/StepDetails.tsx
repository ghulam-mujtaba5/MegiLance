// @AI-HINT: First step in the proposal submission flow - collecting project details.
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import { ProposalData, ProposalErrors } from '../../SubmitProposal.types';
import Textarea from '@/app/components/Textarea/Textarea';
import Input from '@/app/components/Input/Input';
import { Label } from '@/app/components/Label/Label';
import Select from '@/app/components/Select/Select';

import common from './StepDetails.common.module.css';
import light from './StepDetails.light.module.css';
import dark from './StepDetails.dark.module.css';

interface StepDetailsProps {
  data: ProposalData;
  updateData: (update: Partial<ProposalData>) => void;
  errors: ProposalErrors;
}

const availabilityOptions = [
  { value: 'immediate', label: 'Immediate' },
  { value: '1-2_weeks', label: '1-2 Weeks' },
  { value: '1_month', label: '1 Month' },
  { value: 'flexible', label: 'Flexible' },
];

const StepDetails: React.FC<StepDetailsProps> = ({ data, updateData, errors }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <div className={cn(common.container, themed.container)}>
      <div className={common.header}>
        <h2 className={cn(common.title, themed.title)}>Project Details</h2>
        <p className={cn(common.description, themed.description)}>
          Provide details about your approach to this project.
        </p>
      </div>

      <div className={common.form}>
        <div className={common.formGroup}>
          <Label htmlFor="coverLetter">Cover Letter</Label>
          <Textarea
            id="coverLetter"
            value={data.coverLetter}
            onChange={(e) => updateData({ coverLetter: e.target.value })}
            placeholder="Explain why you're the best fit for this project. Highlight relevant experience and skills..."
            rows={8}
            aria-invalid={!!errors.coverLetter}
            aria-describedby={errors.coverLetter ? "coverLetter-error" : undefined}
          />
          {errors.coverLetter && (
            <p id="coverLetter-error" className={cn(common.error, themed.error)}>
              {errors.coverLetter}
            </p>
          )}
        </div>

        <div className={common.row}>
          <div className={common.formGroup}>
            <Label htmlFor="estimatedHours">Estimated Hours</Label>
            <Input
              id="estimatedHours"
              type="number"
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

        <div className={common.formGroup}>
          <Label htmlFor="availability">Availability</Label>
          <Select
            id="availability"
            options={availabilityOptions}
            value={data.availability}
            onChange={(e) => updateData({ availability: e.target.value as any })}
          />
        </div>
      </div>
    </div>
  );
};

export default StepDetails;