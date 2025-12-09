import React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Calendar, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import commonStyles from './ProjectCard.common.module.css';
import lightStyles from './ProjectCard.light.module.css';
import darkStyles from './ProjectCard.dark.module.css';

interface ProjectCardProps {
  project: any;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress':
        return 'blue';
      case 'completed':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const statusColor = getStatusColor(project.status);

  return (
    <div className={cn(commonStyles.card, themeStyles.card)}>
      <div className={commonStyles.header}>
        <div className={commonStyles.titleWrapper}>
          <h3 className={cn(commonStyles.title, themeStyles.title)}>{project.title}</h3>
          <span className={cn(commonStyles.statusBadge, commonStyles[`status-${statusColor}`], themeStyles[`status-${statusColor}`])}>
            {project.status}
          </span>
        </div>
        <div className={cn(commonStyles.budget, themeStyles.budget)}>
          {project.budget}
        </div>
      </div>
      
      <div className={commonStyles.meta}>
        <div className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
          <Calendar size={14} />
          <span>Due {new Date(project.deadline || Date.now()).toLocaleDateString()}</span>
        </div>
        <div className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
          <Users size={14} />
          <span>{project.proposals_count || 0} Proposals</span>
        </div>
      </div>

      <div className={commonStyles.footer}>
        <div className={commonStyles.progressWrapper}>
          <div className={cn(commonStyles.progressBar, themeStyles.progressBar)}>
            <div 
              className={commonStyles.progressFill} 
              style={{ width: `${project.progress || 0}%` }}
            />
          </div>
          <span className={cn(commonStyles.progressText, themeStyles.progressText)}>{project.progress || 0}% Complete</span>
        </div>
        <Link href={`/client/projects/${project.id}`} className={cn(commonStyles.link, themeStyles.link)}>
          Details <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};

export default ProjectCard;
