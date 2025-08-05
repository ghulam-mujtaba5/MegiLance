// @AI-HINT: This is the root component for the Projects page. It assembles the modular sub-components like ProjectsHeader and ProjectsList to construct the full page view, following our per-component architecture.

import React from 'react';

// Modular Components
import ProjectsHeader from './components/ProjectsHeader/ProjectsHeader';
import ProjectsList from './components/ProjectsList/ProjectsList';



// Styles
import commonStyles from './Projects.common.module.css';
import lightStyles from './Projects.light.module.css';
import darkStyles from './Projects.dark.module.css';

const Projects: React.FC = () => {
  const handleAddProject = () => {
    // Placeholder for add project functionality
    alert('Opening form to add a new project...');
  };

  return (
    <div className="Projects-container">
      <ProjectsHeader onAddProject={handleAddProject} />
      <ProjectsList />
    </div>
  );
};

export default Projects;
