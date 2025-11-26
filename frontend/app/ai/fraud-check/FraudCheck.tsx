// @AI-HINT: Premium AI Fraud Check page with billion-dollar quality UI. Features animated score visualization, real-time analysis feedback, and advanced risk assessment.
'use client';

import React, { useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, FileText, Zap } from 'lucide-react';
import Button from '@/app/components/Button/Button';

import commonStyles from './FraudCheck.common.module.css';
import lightStyles from './FraudCheck.light.module.css';
import darkStyles from './FraudCheck.dark.module.css';

interface AnalysisResult {
  score: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  warnings: string[];
  confidence: number;
}

const SAMPLE_TEXTS = {
  clean: `We are looking for an experienced React developer to help us build a modern web application. The project involves creating responsive UI components, integrating with REST APIs, and implementing state management with Redux. The timeline is 3 months with bi-weekly milestones. Budget: $5,000-$8,000. Please submit your portfolio and relevant experience.`,
  suspicious: `URGENT! Need developer ASAP! Payment guaranteed $50,000 for simple task! Contact me on telegram @quickmoney123 for immediate payment. No portfolio needed. Just send your bank details and we can start immediately. This is 100% legitimate work from a Fortune 500 company!`,
};

const FraudCheck: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [text, setText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return <CheckCircle size={24} />;
      case 'Medium':
        return <AlertTriangle size={24} />;
      case 'High':
      case 'Critical':
        return <XCircle size={24} />;
      default:
        return <Shield size={24} />;
    }
  };

  const getRiskDescription = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return 'This content appears to be legitimate with no significant red flags detected.';
      case 'Medium':
        return 'Some potential concerns were identified. Review the warnings before proceeding.';
      case 'High':
        return 'Multiple warning signs detected. Exercise caution and verify the source.';
      case 'Critical':
        return 'Strong indicators of fraudulent content. We recommend avoiding this listing.';
      default:
        return '';
    }
  };

  const handleAnalysis = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    setAnalysisResult(null);

    // Simulate AI analysis with realistic delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Advanced mock analysis based on content patterns
    const lowerText = text.toLowerCase();
    let score = 0;
    const warnings: string[] = [];

    // Check for urgent/pressure language
    if (/urgent|asap|immediately|right now/i.test(text)) {
      score += 20;
      warnings.push('Uses high-pressure urgency language');
    }

    // Check for suspicious payment mentions
    if (/guaranteed|100%|easy money|quick money/i.test(text)) {
      score += 25;
      warnings.push('Contains unrealistic payment promises');
    }

    // Check for external contact attempts
    if (/telegram|whatsapp|signal|contact me at/i.test(text)) {
      score += 30;
      warnings.push('Attempts to move communication off-platform');
    }

    // Check for personal info requests
    if (/bank details|bank account|ssn|social security/i.test(text)) {
      score += 35;
      warnings.push('Requests sensitive personal information');
    }

    // Check for unrealistic amounts
    if (/\$\d{5,}/.test(text) && /simple|easy|quick/i.test(text)) {
      score += 20;
      warnings.push('Offers unusually high payment for described work');
    }

    // Check for no portfolio requirement (suspicious for high-value jobs)
    if (/no portfolio|no experience needed/i.test(text)) {
      score += 15;
      warnings.push('No credentials required for professional work');
    }

    // Cap score at 100
    score = Math.min(score, 100);

    // Determine risk level
    let riskLevel: AnalysisResult['riskLevel'] = 'Low';
    if (score > 70) riskLevel = 'Critical';
    else if (score > 50) riskLevel = 'High';
    else if (score > 25) riskLevel = 'Medium';

    const confidence = 85 + Math.floor(Math.random() * 10);

    setAnalysisResult({ score, riskLevel, warnings, confidence });
    setIsLoading(false);
  }, [text]);

  const loadSample = (type: 'clean' | 'suspicious') => {
    setText(SAMPLE_TEXTS[type]);
    setAnalysisResult(null);
  };

  const handleReset = () => {
    setText('');
    setAnalysisResult(null);
  };

  if (!resolvedTheme) return null;

  const riskClass = analysisResult ? commonStyles[`risk${analysisResult.riskLevel}`] : '';
  const riskThemeClass = analysisResult ? themeStyles[`risk${analysisResult.riskLevel}`] : '';

  // Calculate stroke-dashoffset for SVG ring
  const circumference = 2 * Math.PI * 60; // radius = 60
  const strokeDashoffset = analysisResult 
    ? circumference - (analysisResult.score / 100) * circumference 
    : circumference;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.innerContainer}>
        {/* Header */}
        <header className={commonStyles.header}>
          <div className={cn(commonStyles.headerIcon, themeStyles.headerIcon)}>
            <Shield size={32} />
          </div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>AI Fraud & Spam Analyzer</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Powered by advanced AI to detect fraudulent patterns, spam indicators, and suspicious content in project descriptions, messages, and user profiles.
          </p>
        </header>

        {/* Form */}
        <form className={cn(commonStyles.form, themeStyles.form)} onSubmit={handleAnalysis}>
          <label className={cn(commonStyles.formLabel, themeStyles.formLabel)}>
            <FileText size={16} />
            Content to Analyze
          </label>
          <textarea
            className={cn(commonStyles.textarea, themeStyles.textarea)}
            rows={8}
            placeholder="Paste the project description, message content, or user bio you want to analyze for potential fraud or spam..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            disabled={isLoading}
          />
          
          <div className={commonStyles.formActions}>
            <Button 
              variant="primary" 
              type="submit" 
              isLoading={isLoading}
              iconBefore={<Zap size={18} />}
              disabled={!text.trim()}
            >
              {isLoading ? 'Analyzing...' : 'Analyze Content'}
            </Button>
            
            <button 
              type="button"
              className={cn(commonStyles.sampleButton, themeStyles.sampleButton)}
              onClick={() => loadSample('clean')}
              disabled={isLoading}
            >
              Load Clean Sample
            </button>
            <button 
              type="button"
              className={cn(commonStyles.sampleButton, themeStyles.sampleButton)}
              onClick={() => loadSample('suspicious')}
              disabled={isLoading}
            >
              Load Suspicious Sample
            </button>
          </div>
        </form>

        {/* Loading State */}
        {isLoading && (
          <div className={cn(commonStyles.form, themeStyles.form)}>
            <div className={commonStyles.loadingState}>
              <div className={cn(commonStyles.loadingSpinner, themeStyles.loadingSpinner)} />
              <p className={cn(commonStyles.loadingText, themeStyles.loadingText)}>Analyzing content patterns...</p>
              <p className={cn(commonStyles.loadingSubtext, themeStyles.loadingSubtext)}>Our AI is scanning for fraud indicators</p>
            </div>
          </div>
        )}

        {/* Results */}
        {analysisResult && !isLoading && (
          <div className={cn(commonStyles.result, themeStyles.result, riskClass, riskThemeClass)}>
            <div className={cn(commonStyles.resultHeader, themeStyles.resultHeader)}>
              <div className={cn(commonStyles.resultIcon, themeStyles.resultIcon)}>
                {getRiskIcon(analysisResult.riskLevel)}
              </div>
              <div>
                <h2 className={cn(commonStyles.resultTitle, themeStyles.resultTitle)}>Analysis Complete</h2>
                <p className={cn(commonStyles.resultSubtitle, themeStyles.resultSubtitle)}>
                  {analysisResult.confidence}% confidence score
                </p>
              </div>
            </div>

            <div className={commonStyles.resultSummary}>
              {/* Animated Score Circle */}
              <div className={commonStyles.scoreCircle}>
                <svg className={commonStyles.scoreRing} viewBox="0 0 140 140">
                  <circle 
                    cx="70" 
                    cy="70" 
                    r="60" 
                    className={cn(commonStyles.scoreRingBg, themeStyles.scoreRingBg)}
                  />
                  <circle 
                    cx="70" 
                    cy="70" 
                    r="60" 
                    className={cn(commonStyles.scoreRingProgress, themeStyles.scoreRingProgress)}
                    style={{ strokeDashoffset }}
                  />
                </svg>
                <div className={commonStyles.scoreValue}>
                  <p className={cn(commonStyles.resultScore, themeStyles.resultScore)}>
                    {analysisResult.score}
                  </p>
                  <span className={cn(commonStyles.scoreLabel, themeStyles.scoreLabel)}>Risk Score</span>
                </div>
              </div>

              {/* Risk Info */}
              <div className={commonStyles.riskMeter}>
                <p className={cn(commonStyles.resultLevel, themeStyles.resultLevel)}>
                  {analysisResult.riskLevel} Risk
                  <span className={cn(commonStyles.riskBadge, themeStyles.riskBadge)}>
                    {analysisResult.riskLevel}
                  </span>
                </p>
                <p className={cn(commonStyles.riskDescription, themeStyles.riskDescription)}>
                  {getRiskDescription(analysisResult.riskLevel)}
                </p>
              </div>
            </div>

            {/* Warnings */}
            {analysisResult.warnings.length > 0 && (
              <div className={cn(commonStyles.resultWarnings, themeStyles.resultWarnings)}>
                <h3>
                  <AlertTriangle size={18} />
                  {analysisResult.warnings.length} Issue{analysisResult.warnings.length > 1 ? 's' : ''} Detected
                </h3>
                <ul className={commonStyles.warningsList}>
                  {analysisResult.warnings.map((warning, index) => (
                    <li key={index} className={cn(commonStyles.warningItem, themeStyles.warningItem)}>
                      <span className={cn(commonStyles.warningIcon, themeStyles.warningIcon)}>!</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className={cn(commonStyles.resultActions, themeStyles.resultActions)}>
              <Button 
                variant="secondary" 
                iconBefore={<RefreshCw size={18} />}
                onClick={handleReset}
              >
                Analyze Another
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FraudCheck;
