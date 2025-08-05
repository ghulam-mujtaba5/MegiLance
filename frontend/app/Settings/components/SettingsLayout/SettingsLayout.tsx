// @AI-HINT: This component provides the main two-column layout for the entire Settings page, with a sidebar for navigation and a content area for the active settings section. This structure is key to a premium user experience.

import React from 'react';
import './SettingsLayout.common.css';
import './SettingsLayout.light.css';
import './SettingsLayout.dark.css';

interface SettingsLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ sidebar, children }) => {
  return (
    <div className="SettingsLayout">
      <aside className="SettingsLayout-sidebar">
        {sidebar}
      </aside>
      <main className="SettingsLayout-content">
        {children}
      </main>
    </div>
  );
};

export default SettingsLayout;
