// @AI-HINT: This is the AI Price Estimator utility page. It helps users estimate project costs. All styles are per-component only.
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';

import commonStyles from './PriceEstimator.common.module.css';
import lightStyles from './PriceEstimator.light.module.css';
import darkStyles from './PriceEstimator.dark.module.css';

const PriceEstimator: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [estimatedPrice, setEstimatedPrice] = useState<string | null>(null);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  if (!resolvedTheme) return null;

  const handleEstimation = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock estimation logic
    const randomPrice = (Math.random() * (5000 - 500) + 500).toFixed(2);
    setEstimatedPrice(`$${randomPrice} - $${(parseFloat(randomPrice) * 1.5).toFixed(2)}`);
  };

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.innerContainer}>
        <header className={commonStyles.header}>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>AI Project Price Estimator</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>Get a data-driven estimate for your project&apos;s budget.</p>
        </header>

        <form className={cn(commonStyles.form, themeStyles.form)} onSubmit={handleEstimation}>
          <div className={commonStyles.formGrid}>
            <div>
              <label htmlFor="project-title" className={cn(commonStyles.label, themeStyles.label)}>Project Title</label>
              <Input id="project-title" type="text" placeholder="e.g., E-commerce Website Redesign" required fullWidth />
            </div>
            <div className={commonStyles.fullSpan}>
              <label htmlFor="description" className={cn(commonStyles.label, themeStyles.label)}>Project Description</label>
              <textarea 
                id="description" 
                className={cn(commonStyles.textarea, themeStyles.textarea)} 
                rows={6} 
                placeholder="Describe the project scope, key features, and deliverables..." 
                required
              />
            </div>
            <div>
              <label htmlFor="industry" className={cn(commonStyles.label, themeStyles.label)}>Industry</label>
              <Input id="industry" type="text" placeholder="e.g., SaaS, Retail, Healthcare" fullWidth />
            </div>
            <div>
              <label htmlFor="complexity" className={cn(commonStyles.label, themeStyles.label)}>Complexity</label>
              <select id="complexity" className={cn(commonStyles.select, themeStyles.select)} required>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
          </div>
          <Button variant="primary" type="submit">Estimate Price</Button>
        </form>

        {estimatedPrice && (
          <div className={cn(commonStyles.result, themeStyles.result)}>
            <h2 className={cn(commonStyles.resultTitle, themeStyles.resultTitle)}>Estimated Price Range</h2>
            <p className={cn(commonStyles.price, themeStyles.price)}>{estimatedPrice}</p>
            <small className={cn(commonStyles.disclaimer, themeStyles.disclaimer)}>This is an AI-generated estimate. Prices may vary based on freelancer bids and project specifics.</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceEstimator;
