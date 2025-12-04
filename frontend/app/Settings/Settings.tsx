// @AI-HINT: This is the root component for the Settings page. It assembles the modular sub-components to construct the full page view, managing the active section state.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/app/components/Animations/PageTransition';

// Modular Components
import SettingsLayout from './components/SettingsLayout/SettingsLayout';
import SettingsSidebarNav, { SettingsSection as TSettingsSection } from './components/SettingsSidebarNav/SettingsSidebarNav';
import ProfileSettings from './components/ProfileSettings/ProfileSettings';
import SecuritySettings from './components/SecuritySettings/SecuritySettings';
import AppearanceSettings from './components/AppearanceSettings/AppearanceSettings';

// Styles
import commonStyles from './Settings.common.module.css';
import lightStyles from './Settings.light.module.css';
import darkStyles from './Settings.dark.module.css';

const renderSection = (section: TSettingsSection) => {
  switch (section) {
    case 'profile':
      return <ProfileSettings />;
    case 'security':
      return <SecuritySettings />;
    case 'appearance':
      return <AppearanceSettings />;
    default:
      return <ProfileSettings />;
  }
};

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<TSettingsSection>('profile');

  return (
    <PageTransition>
      <div className="Settings-container">
        <SettingsLayout
          sidebar={
            <SettingsSidebarNav 
              activeSection={activeSection} 
              onSectionChange={setActiveSection} 
            />
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderSection(activeSection)}
            </motion.div>
          </AnimatePresence>
        </SettingsLayout>
      </div>
    </PageTransition>
  );
};

export default Settings;
