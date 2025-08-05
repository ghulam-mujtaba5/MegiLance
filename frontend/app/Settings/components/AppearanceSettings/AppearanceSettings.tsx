// @AI-HINT: This component provides controls for the user to change the application's visual theme, such as switching between light and dark mode. It uses the ThemeContext to apply changes globally.

import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import SettingsSection from '../SettingsSection/SettingsSection';
import Button from '../../../components/Button/Button';
import { Sun, Moon } from 'lucide-react';
import './AppearanceSettings.common.css';
import './AppearanceSettings.light.css';
import './AppearanceSettings.dark.css';

const AppearanceSettings: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <SettingsSection
      title="Appearance"
      description="Customize the look and feel of the application. Your preferences will be saved for your next visit."
    >
      <div className="AppearanceSettings-switcher">
        <button 
          className={`AppearanceSettings-button ${theme === 'light' ? 'is-active' : ''}`}
          onClick={() => setTheme('light')}
          aria-pressed={theme === 'light'}
        >
          <Sun size={20} />
          <span>Light</span>
        </button>
        <button 
          className={`AppearanceSettings-button ${theme === 'dark' ? 'is-active' : ''}`}
          onClick={() => setTheme('dark')}
          aria-pressed={theme === 'dark'}
        >
          <Moon size={20} />
          <span>Dark</span>
        </button>
      </div>
    </SettingsSection>
  );
};

export default AppearanceSettings;
