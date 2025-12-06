// @AI-HINT: Enhanced StepBudget with budget calculator, market insights, and improved validation
'use client';

import React, { useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Info, Calculator, CheckCircle, AlertTriangle } from 'lucide-react';
import Input from '@/app/components/Input/Input';
import Select from '@/app/components/Select/Select';
import RadioGroup from '@/app/components/RadioGroup/RadioGroup';
import { PostJobData, PostJobErrors, BudgetType } from '../../PostJob.types';

import common from './StepBudget.common.module.css';
import light from './StepBudget.light.module.css';
import dark from './StepBudget.dark.module.css';

const TIMELINE_OPTIONS = ['1-2 weeks', '2-4 weeks', '1-2 months', '3-6 months', 'Long-term'] as const;

// Market rate insights (would be fetched from API in production)
const MARKET_RATES = {
  'Web Development': { hourlyMin: 50, hourlyMax: 150, fixedMin: 2000, fixedMax: 50000 },
  'Mobile Apps': { hourlyMin: 60, hourlyMax: 175, fixedMin: 5000, fixedMax: 100000 },
  'UI/UX Design': { hourlyMin: 40, hourlyMax: 120, fixedMin: 1000, fixedMax: 20000 },
  'Data Science': { hourlyMin: 75, hourlyMax: 200, fixedMin: 3000, fixedMax: 75000 },
  'AI/ML': { hourlyMin: 100, hourlyMax: 250, fixedMin: 5000, fixedMax: 150000 },
  'DevOps': { hourlyMin: 70, hourlyMax: 180, fixedMin: 2000, fixedMax: 50000 },
} as const;

interface StepBudgetProps {
  data: PostJobData;
  updateData: (update: Partial<PostJobData>) => void;
  errors: PostJobErrors;
}

const StepBudget: React.FC<StepBudgetProps> = ({ data, updateData, errors }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const [showCalculator, setShowCalculator] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState<number | null>(null);

  // Get market rates for the selected category
  const marketRates = useMemo(() => {
    const category = data.category || 'Web Development';
    return MARKET_RATES[category as keyof typeof MARKET_RATES] || MARKET_RATES['Web Development'];
  }, [data.category]);

  // Budget analysis
  const budgetAnalysis = useMemo(() => {
    if (!data.budgetAmount || data.budgetAmount <= 0) {
      return { status: 'empty', message: 'Enter a budget amount' };
    }

    const amount = data.budgetAmount;
    
    if (data.budgetType === 'Hourly') {
      if (amount < marketRates.hourlyMin * 0.5) {
        return { status: 'low', message: 'Below market rate - may attract fewer applicants' };
      }
      if (amount < marketRates.hourlyMin) {
        return { status: 'fair', message: 'Slightly below average market rate' };
      }
      if (amount <= marketRates.hourlyMax) {
        return { status: 'good', message: 'Competitive rate for quality freelancers' };
      }
      return { status: 'premium', message: 'Premium rate - attracts top talent' };
    } else {
      if (amount < marketRates.fixedMin * 0.5) {
        return { status: 'low', message: 'Below typical project budget' };
      }
      if (amount < marketRates.fixedMin) {
        return { status: 'fair', message: 'Budget may limit scope' };
      }
      if (amount <= marketRates.fixedMax) {
        return { status: 'good', message: 'Appropriate budget for this project type' };
      }
      return { status: 'premium', message: 'Premium budget - extensive scope possible' };
    }
  }, [data.budgetAmount, data.budgetType, marketRates]);

  // Calculate estimated budget from hours
  const handleCalculate = () => {
    if (estimatedHours && estimatedHours > 0) {
      const avgRate = (marketRates.hourlyMin + marketRates.hourlyMax) / 2;
      const calculated = Math.round(estimatedHours * avgRate);
      updateData({ budgetAmount: calculated, budgetType: 'Fixed' });
      setShowCalculator(false);
    }
  };

  // Get status icon and color
  const getStatusIndicator = () => {
    switch (budgetAnalysis.status) {
      case 'low':
        return { icon: <AlertTriangle size={16} />, className: common.statusLow };
      case 'fair':
        return { icon: <Info size={16} />, className: common.statusFair };
      case 'good':
        return { icon: <CheckCircle size={16} />, className: common.statusGood };
      case 'premium':
        return { icon: <TrendingUp size={16} />, className: common.statusPremium };
      default:
        return { icon: null, className: '' };
    }
  };

  const statusIndicator = getStatusIndicator();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className={common.container}
      role="region"
      aria-label="Budget Step"
    >
      <div className={common.headerRow}>
        <div>
          <h2 className={cn(common.title, themed.title)}>Set your budget</h2>
          <p className={cn(common.subtitle, themed.subtitle)}>How would you like to pay your freelancer?</p>
        </div>
        <button
          type="button"
          className={cn(common.calculatorButton, themed.calculatorButton)}
          onClick={() => setShowCalculator(!showCalculator)}
          aria-expanded={showCalculator}
          aria-controls="budget-calculator"
        >
          <Calculator size={18} />
          <span>Calculator</span>
        </button>
      </div>

      {/* Budget Calculator */}
      <AnimatePresence>
        {showCalculator && (
          <motion.div
            id="budget-calculator"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(common.calculatorBox, themed.calculatorBox)}
          >
            <h4><Calculator size={16} /> Estimate Budget from Hours</h4>
            <div className={common.calculatorContent}>
              <Input
                id="estimated-hours"
                type="number"
                value={estimatedHours === null ? '' : String(estimatedHours)}
                onChange={(e) => setEstimatedHours(e.target.value ? Number(e.target.value) : null)}
                placeholder="e.g., 40"
              />
              <button
                type="button"
                className={cn(common.calculateBtn, themed.calculateBtn)}
                onClick={handleCalculate}
                disabled={!estimatedHours || estimatedHours <= 0}
              >
                Calculate
              </button>
            </div>
            <p className={common.calculatorNote}>
              Based on avg. ${Math.round((marketRates.hourlyMin + marketRates.hourlyMax) / 2)}/hr for {data.category || 'Web Development'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Market Insights */}
      <div className={cn(common.insightsBox, themed.insightsBox)}>
        <TrendingUp size={16} />
        <div className={common.insightsContent}>
          <span className={common.insightsTitle}>Market rates for {data.category || 'Web Development'}:</span>
          <span className={common.insightsRates}>
            {data.budgetType === 'Hourly' 
              ? `$${marketRates.hourlyMin} - $${marketRates.hourlyMax}/hr`
              : `$${marketRates.fixedMin.toLocaleString()} - $${marketRates.fixedMax.toLocaleString()} (fixed)`
            }
          </span>
        </div>
      </div>

      <div className={common.form_group}>
        <RadioGroup
          label="Budget Type"
          options={[
            { value: 'Fixed', label: 'Fixed Price', description: 'Pay a set amount for the entire project' }, 
            { value: 'Hourly', label: 'Hourly Rate', description: 'Pay for each hour worked' }
          ]}
          selectedValue={data.budgetType}
          onChange={(value) => updateData({ budgetType: value as BudgetType })}
        />
      </div>

      <div className={common.form_group}>
        <Input
          id="job-budget"
          label={data.budgetType === 'Fixed' ? 'Total Project Budget ($)' : 'Hourly Rate ($)'}
          type="number"
          value={data.budgetAmount === null ? '' : String(data.budgetAmount)}
          onChange={(e) => updateData({ budgetAmount: e.target.value ? Number(e.target.value) : null })}
          placeholder={data.budgetType === 'Fixed' ? 'e.g., 5000' : 'e.g., 75'}
          error={errors.budgetAmount}
          required
          iconBefore={<span className={common.currencyIcon}>$</span>}
          aria-describedby="budget-analysis"
        />
        
        {/* Budget Analysis Indicator */}
        {data.budgetAmount && data.budgetAmount > 0 && (
          <div id="budget-analysis" className={cn(common.analysisRow, statusIndicator.className)}>
            {statusIndicator.icon}
            <span>{budgetAnalysis.message}</span>
          </div>
        )}
      </div>

      <div className={common.form_group}>
        <Select
          id="job-timeline"
          label="Estimated Timeline"
          value={data.timeline}
          onChange={(e) => updateData({ timeline: e.target.value })}
          options={TIMELINE_OPTIONS.map(t => ({ value: t, label: t }))}
          required
          helpText="Choose an estimated timeframe for project completion"
        />
      </div>
    </motion.div>
  );
};

export default StepBudget;
