// @AI-HINT: This is a reusable wrapper component for each panel within the Settings page. It provides a consistent structure with a title, description, and content area, ensuring a uniform look and feel.

import React from 'react';
import './SettingsSection.common.css';
import './SettingsSection.light.css';
import './SettingsSection.dark.css';

interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, children }) => {
  return (
    <section className="SettingsSection">
      <div className="SettingsSection-header">
        <h2 className="SettingsSection-title">{title}</h2>
        <p className="SettingsSection-description">{description}</p>
      </div>
      <div className="SettingsSection-content">
        {children}
      </div>
    </section>
  );
};

export default SettingsSection;
