// @AI-HINT: This is the AI Fraud Check utility page. It helps users analyze text for potential fraud. All styles are per-component only.
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';

import commonStyles from './FraudCheck.common.module.css';
import lightStyles from './FraudCheck.light.module.css';
import darkStyles from './FraudCheck.dark.module.css';

interface AnalysisResult {
  score: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  warnings: string[];
}

const FraudCheck: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  if (!resolvedTheme) return null;

  const handleAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAnalysisResult(null);

    // Mock analysis logic
    setTimeout(() => {
      const score = Math.random();
      let riskLevel: AnalysisResult['riskLevel'] = 'Low';
      const warnings: string[] = [];

      if (score > 0.9) {
        riskLevel = 'Critical';
        warnings.push('Contains blacklisted phrases: "guaranteed payment", "telegram"');
        warnings.push('External contact information detected.');
      } else if (score > 0.7) {
        riskLevel = 'High';
        warnings.push('Suspicious link detected.');
      } else if (score > 0.4) {
        riskLevel = 'Medium';
        warnings.push('Vague project description.');
      }

      setAnalysisResult({ score: Math.round(score * 100), riskLevel, warnings });
      setIsLoading(false);
    }, 1500);
  };

  const riskClass = analysisResult ? commonStyles[`risk${analysisResult.riskLevel}`] : '';

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.innerContainer}>
        <header className={commonStyles.header}>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>AI Fraud & Spam Analyzer</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>Paste any text to check for signs of fraudulent activity or spam.</p>
        </header>

        <form className={cn(commonStyles.form, themeStyles.form)} onSubmit={handleAnalysis}>
          <textarea
            className={cn(commonStyles.textarea, themeStyles.textarea)}
            rows={10}
            placeholder="Paste project description, message, or user bio here..."
            required
          />
          <Button variant="primary" type="submit" isLoading={isLoading}>
            {isLoading ? 'Analyzing...' : 'Analyze Text'}
          </Button>
        </form>

        {analysisResult && (
          <div className={cn(commonStyles.result, themeStyles.result, riskClass)}>
            <h2 className={cn(commonStyles.resultTitle, themeStyles.resultTitle)}>Analysis Complete</h2>
            <div className={commonStyles.resultSummary}>
              <div className={commonStyles.resultScore}>{analysisResult.score}%</div>
              <div className={commonStyles.resultLevel}>{analysisResult.riskLevel} Risk</div>
            </div>
            {analysisResult.warnings.length > 0 && (
              <div className={commonStyles.resultWarnings}>
                <h3>Potential Issues Found:</h3>
                <ul>
                  {analysisResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FraudCheck;
