// @AI-HINT: This is the refactored ProjectCard component, now using premium, theme-aware styles and the useMemo hook for efficiency.
import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Card from '../Card/Card';
import Button from '../Button/Button';
import commonStyles from './ProjectCard.common.module.css';
import lightStyles from './ProjectCard.light.module.css';
import darkStyles from './ProjectCard.dark.module.css';

export interface ProjectCardProps {
  title: string;
  clientName: string;
  budget: string;
  postedTime: string;
  tags: string[];
  onView?: () => void;
  className?: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ title, clientName, budget, postedTime, tags, onView, className }) => {
  const { theme } = useTheme();

  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  return (
    <Card className={cn(styles.projectCard, className)}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.postedTime}>{postedTime}</span>
      </div>
      <div className={styles.infoRow}>
        <span className={styles.client}>Client: {clientName}</span>
        <span className={styles.budget}>{budget}</span>
      </div>
      <div className={styles.tagsRow}>
        {tags.map((tag) => (
          <span key={tag} className={styles.tag}>{tag}</span>
        ))}
      </div>
      <Button variant="secondary" size="small" onClick={onView} className="w-full mt-4">View Details</Button>
    </Card>
  );
};

export default ProjectCard;
