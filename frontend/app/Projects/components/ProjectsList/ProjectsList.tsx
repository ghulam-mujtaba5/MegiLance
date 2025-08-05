// @AI-HINT: This component is responsible for rendering the list of project cards. It receives an array of projects and maps over them, promoting a clean separation of concerns.

import React from 'react';
import { ProjectType } from '../../types';
import ProjectCard from '../../../components/ProjectCard/ProjectCard'; // Assuming ProjectCard is in a shared components folder
import './ProjectsList.common.css';
import './ProjectsList.light.css';
import './ProjectsList.dark.css';

interface ProjectsListProps {
  projects: ProjectType[];
}

const ProjectsList: React.FC<ProjectsListProps> = ({ projects }) => {
  return (
    <div className="ProjectsList">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          title={project.title}
          client={project.client}
          budget={`$${project.budget.toLocaleString()}`}
          status={project.status}
          // Note: We may need to enhance ProjectCard to accept progress and deadline
        />
      ))}
    </div>
  );
};

export default ProjectsList;
