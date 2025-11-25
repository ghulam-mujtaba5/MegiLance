// @AI-HINT: JobCard component for displaying job listings in the freelancer portal.
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import common from './JobCard.common.module.css';
import light from './JobCard.light.module.css';
import dark from './JobCard.dark.module.css';

export interface JobCardProps {
  id: string;
  title: string;
  clientName: string;
  description?: string;
  budgetMin?: number;
  budgetMax?: number;
  budget?: string | number; // Fallback
  skills: string[];
  postedTime: string;
}

const JobCard: React.FC<JobCardProps> = ({
  id,
  title,
  clientName,
  description,
  budgetMin,
  budgetMax,
  budget,
  skills,
  postedTime,
}) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? dark : light;

  const displayBudget = budgetMin !== undefined && budgetMax !== undefined
    ? `$${budgetMin.toLocaleString()} - $${budgetMax.toLocaleString()}`
    : typeof budget === 'number' 
      ? `$${budget.toLocaleString()}`
      : budget || 'Negotiable';

  return (
    <div className={cn(common.card, themeStyles.card)}>
      <div className={common.header}>
        <div>
          <h3 className={common.title}>{title}</h3>
          <div className={common.client}>{clientName}</div>
        </div>
        <div className={common.budget}>
          {displayBudget}
        </div>
      </div>

      {description && <p className={common.description}>{description}</p>}

      <div className={common.tags}>
        {skills.slice(0, 3).map(skill => (
          <span key={skill} className={common.tag}>{skill}</span>
        ))}
        {skills.length > 3 && (
          <span className={common.tag}>+{skills.length - 3}</span>
        )}
      </div>

      <div className={common.footer}>
        <span className={common.time}>Posted {new Date(postedTime).toLocaleDateString()}</span>
        <Link href={`/jobs/${id}`}>
          <Button variant="primary" size="sm">View Details</Button>
        </Link>
      </div>
    </div>
  );
};

export default JobCard;
