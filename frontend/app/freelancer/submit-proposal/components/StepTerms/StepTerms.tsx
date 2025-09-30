// @AI-HINT: Second step in the proposal submission flow - terms and conditions.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import { ProposalData, ProposalErrors } from '../../SubmitProposal.types';
import { Label } from '@/app/components/Label/Label';
import Checkbox from '@/app/components/Checkbox/Checkbox';

import common from './StepTerms.common.module.css';
import light from './StepTerms.light.module.css';
import dark from './StepTerms.dark.module.css';

interface StepTermsProps {
  data: ProposalData;
  updateData: (update: Partial<ProposalData>) => void;
  errors: ProposalErrors;
}

const StepTerms: React.FC<StepTermsProps> = ({ data, updateData, errors }) => {
  const { theme } = useTheme();
  const themed = theme === 'dark' ? dark : light;

  return (
    <div className={cn(common.container, themed.container)}>
      <div className={common.header}>
        <h2 className={cn(common.title, themed.title)}>Terms & Conditions</h2>
        <p className={cn(common.description, themed.description)}>
          Please review and accept our terms before submitting your proposal.
        </p>
      </div>

      <div className={common.content}>
        <div className={common.termsSection}>
          <h3 className={cn(common.sectionTitle, themed.sectionTitle)}>Project Terms</h3>
          <ul className={cn(common.termsList, themed.termsList)}>
            <li>Proposals are binding once submitted and cannot be modified</li>
            <li>Payment will be processed through our secure escrow system</li>
            <li>Work begins only after the client accepts your proposal</li>
            <li>All work must comply with our quality standards and policies</li>
          </ul>
        </div>

        <div className={common.termsSection}>
          <h3 className={cn(common.sectionTitle, themed.sectionTitle)}>Payment Terms</h3>
          <ul className={cn(common.termsList, themed.termsList)}>
            <li>Payments are released upon milestone completion and client approval</li>
            <li>Platform fees are deducted from client payments</li>
            <li>Disputes are resolved through our mediation process</li>
            <li>Refunds are subject to our refund policy</li>
          </ul>
        </div>

        <div className={common.agreement}>
          <Checkbox
            id="termsAccepted"
            name="termsAccepted"
            checked={data.termsAccepted}
            onChange={(e) => updateData({ termsAccepted: e.target.checked })}
          >
            <Label htmlFor="termsAccepted">
              I agree to the terms and conditions outlined above
            </Label>
          </Checkbox>
          {errors.termsAccepted && (
            <p id="termsAccepted-error" className={cn(common.error, themed.error)}>
              {errors.termsAccepted}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepTerms;