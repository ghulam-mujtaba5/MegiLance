// @AI-HINT: Component to analyze project feasibility using AI
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { TrendingUp, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import Button from '@/app/components/Button/Button';
import api from '@/lib/api';

import commonStyles from './FeasibilityAnalyzer.common.module.css';
import lightStyles from './FeasibilityAnalyzer.light.module.css';
import darkStyles from './FeasibilityAnalyzer.dark.module.css';

interface FeasibilityAnalyzerProps {
  projectDescription: string;
  budgetMin: number;
  budgetMax: number;
  timelineDays: number;
}

interface AnalysisResult {
  complexity_score: number;
  budget_realism: string;
  timeline_realism: string;
  flags: string[];
  recommendations: string[];
}

const FeasibilityAnalyzer: React.FC<FeasibilityAnalyzerProps> = ({
  projectDescription,
  budgetMin,
  budgetMax,
  timelineDays,
}) => {
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    container: cn(commonStyles.container, themeStyles.container),
    header: cn(commonStyles.header, themeStyles.header),
    title: cn(commonStyles.title, themeStyles.title),
    scoreContainer: cn(commonStyles.scoreContainer, themeStyles.scoreContainer),
    scoreLabel: cn(commonStyles.scoreLabel, themeStyles.scoreLabel),
    scoreValue: cn(commonStyles.scoreValue, themeStyles.scoreValue),
    flagsList: cn(commonStyles.flagsList, themeStyles.flagsList),
    flagItem: cn(commonStyles.flagItem, themeStyles.flagItem),
    recommendations: cn(commonStyles.recommendations, themeStyles.recommendations),
  };

  const handleAnalyze = async () => {
    if (!projectDescription || !budgetMax || !timelineDays) return;

    setLoading(true);
    try {
      const response = await api.aiWriting.analyzeFeasibility({
        project_description: projectDescription,
        budget_min: budgetMin,
        budget_max: budgetMax,
        timeline_days: timelineDays,
      });
      setResult(response);
    } catch (error) {
      console.error('Feasibility analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-analyze when props change significantly (debounced in real app)
  // For now, manual trigger via button or effect if we want auto
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <TrendingUp className="text-blue-500" size={20} />
        <h3 className={styles.title}>Project Feasibility Check</h3>
      </div>

      {!result ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-4">
            Check if your budget and timeline align with your project scope.
          </p>
          <Button
            variant="primary"
            onClick={handleAnalyze}
            isLoading={loading}
            disabled={!projectDescription || loading}
            size="sm"
          >
            Analyze Feasibility
          </Button>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-xs text-gray-500">Complexity</div>
              <div className="font-bold text-lg">{result.complexity_score}/10</div>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-xs text-gray-500">Budget</div>
              <div className={cn(
                "font-bold text-lg",
                result.budget_realism === 'High' ? "text-green-500" : "text-red-500"
              )}>
                {result.budget_realism}
              </div>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-xs text-gray-500">Timeline</div>
              <div className={cn(
                "font-bold text-lg",
                result.timeline_realism === 'Realistic' ? "text-green-500" : "text-yellow-500"
              )}>
                {result.timeline_realism}
              </div>
            </div>
          </div>

          {result.flags.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-bold mb-2 flex items-center gap-2 text-red-500">
                <AlertTriangle size={16} /> Potential Issues
              </h4>
              <ul className={styles.flagsList}>
                {result.flags.map((flag, idx) => (
                  <li key={idx} className={styles.flagItem}>
                    <span>•</span> {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.recommendations.length > 0 && (
            <div className={styles.recommendations}>
              <h4 className="text-sm font-bold mb-2 flex items-center gap-2 text-blue-500">
                <Lightbulb size={16} /> Recommendations
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="mt-1 text-green-500 flex-shrink-0" size={12} />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-4 text-center">
             <Button variant="ghost" size="sm" onClick={handleAnalyze} isLoading={loading}>
               Re-analyze
             </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeasibilityAnalyzer;
