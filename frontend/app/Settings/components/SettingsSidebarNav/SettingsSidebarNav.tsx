// @AI-HINT: This component renders the vertical navigation menu for the Settings page. It indicates the active section and allows users to switch between different settings panels.

import React from 'react';
import { User, Shield, Sun, Moon } from 'lucide-react'; // Using lucide-react for icons
import './SettingsSidebarNav.common.css';
import './SettingsSidebarNav.light.css';
import './SettingsSidebarNav.dark.css';

export type SettingsSection = 'profile' | 'security' | 'appearance';

interface NavItem {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Sun }, // Icon can be dynamic based on theme
];

interface SettingsSidebarNavProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

const SettingsSidebarNav: React.FC<SettingsSidebarNavProps> = ({ activeSection, onSectionChange }) => {
  return (
    <nav className="SettingsSidebarNav">
      <h2 className="SettingsSidebarNav-title">Settings</h2>
      <ul className="SettingsSidebarNav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`SettingsSidebarNav-item ${activeSection === item.id ? 'is-active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  onSectionChange(item.id);
                }}
              >
                <Icon className="SettingsSidebarNav-item-icon" size={20} />
                <span className="SettingsSidebarNav-item-label">{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default SettingsSidebarNav;
