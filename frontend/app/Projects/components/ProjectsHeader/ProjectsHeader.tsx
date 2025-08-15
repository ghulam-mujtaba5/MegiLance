// @AI-HINT: This component displays the header for the Projects page, including the title and an "Add Project" button. It's designed for reuse and follows our standard modular structure.

import React from 'react';
import { Plus } from 'lucide-react';
import commonStyles from './ProjectsHeader.base.module.css';
import lightStyles from './ProjectsHeader.light.module.css';
import darkStyles from './ProjectsHeader.dark.module.css';

interface ProjectsHeaderProps {
  onAddProject: () => void;
}

const ProjectsHeader: React.FC<ProjectsHeaderProps> = ({ onAddProject }) => {
  return (
    <div className="ProjectsHeader">
      <h1 className="ProjectsHeader-title">My Projects</h1>
      <button className="ProjectsHeader-add-button" onClick={onAddProject}>
        <Plus size={18} />
        <span>Add Project</span>
      </button>
    </div>
  );
};

export default ProjectsHeader;
