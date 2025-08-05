// @AI-HINT: This is the ProjectCard component for displaying project summaries in lists and dashboards. All styles are per-component only. See ProjectCard.common.css, ProjectCard.light.css, and ProjectCard.dark.css for theming.
import React from "react";
import Card from "../Card/Card";
import Button from "../Button/Button";
import commonStyles from './ProjectCard.common.module.css';
import lightStyles from './ProjectCard.light.module.css';
import darkStyles from './ProjectCard.dark.module.css';

import { ProjectStatus } from "../../Projects/types";

// @AI-HINT: This is the ProjectCard component for displaying project summaries in lists and dashboards. All styles are per-component only. Now fully theme-switchable using global theme context.
import { useTheme } from '@/app/contexts/ThemeContext';

export interface ProjectCardProps {
  title: string;
  clientName: string;
  budget: string;
  postedTime: string;
  tags: string[];
  onView?: () => void;
}

const statusColors: Record<ProjectStatus, string> = {
  active: "ProjectCard-status--active",
  completed: "ProjectCard-status--completed",
  pending: "ProjectCard-status--pending",
  on_hold: "ProjectCard-status--on-hold",
  cancelled: "ProjectCard-status--cancelled"
};

const ProjectCard: React.FC<ProjectCardProps> = ({ title, clientName, budget, postedTime, tags, onView }) => {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <Card className={`${commonStyles.projectCard} ${themeStyles.projectCard}`}>
      <div className={commonStyles.header}>
        <h3 className={commonStyles.title}>{title}</h3>
        <span className={commonStyles.postedTime}>{postedTime}</span>
      </div>
      <div className={commonStyles.infoRow}>
        <span className={commonStyles.client}>Client: {clientName}</span>
        <span className={commonStyles.budget}>Budget: {budget}</span>
      </div>
      <div className={commonStyles.tagsRow}>
        {tags.map((tag) => (
          <span key={tag} className={commonStyles.tag}>{tag}</span>
        ))}
      </div>
      <Button variant="secondary" onClick={onView}>View Details</Button>
    </Card>
  );
};

export default ProjectCard;
