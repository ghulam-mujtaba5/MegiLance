// @AI-HINT: This component is a specialized card for displaying the status of a freelancer's job, including title, client, and an integrated progress bar.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './JobStatusCard.common.module.css';
import lightStyles from './JobStatusCard.light.module.css';
import darkStyles from './JobStatusCard.dark.module.css';

export interface JobStatusCardProps {
  title: string;
  client: string;
  status: string;
  progress?: number; // Optional: 0-100
  completionDate?: string;
}

const JobStatusCard: React.FC<JobStatusCardProps> = ({ title, client, status, progress, completionDate }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  const isCompleted = progress === 100 || !!completionDate;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.client}>for {client}</p>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.statusContainer}>
          <span className={styles.statusLabel}>Status:</span>
          <span className={cn(styles.status, isCompleted ? styles.completedStatus : styles.activeStatus)}>{status}</span>
        </div>
        {progress !== undefined && !isCompleted && (
          <div className={styles.progressWrapper}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className={styles.progressText}>{progress}%</span>
          </div>
        )}
        {isCompleted && completionDate && (
            <p className={styles.completionDate}>Completed on: {completionDate}</p>
        )}
      </div>
    </div>
  );
};

export default JobStatusCard;
