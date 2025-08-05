// @AI-HINT: This is the platform Settings page for admins. All styles are per-component only.
'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import commonStyles from './Settings.common.module.css';
import lightStyles from './Settings.light.module.css';
import darkStyles from './Settings.dark.module.css';
import { useTheme } from '@/app/contexts/ThemeContext';

// @AI-HINT: This is the platform Settings page for admins. All styles are per-component only. Now fully theme-switchable using global theme context.

interface SettingsData {
  general: { platformName: string; supportEmail: string; enableRegistrations: boolean; };
  fees: { freelancerServiceFee: number; clientProcessingFee: number; fixedProcessingFee: number; };
  integrations: { stripeApiKey: string; googleAnalyticsId: string; };
}

type Tab = 'general' | 'fees' | 'integrations';

const Settings: React.FC = () => {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        const data: SettingsData = await response.json();
        setSettings(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <div>Loading settings...</div>;
    }
    if (error) {
      return <div>Error: {error}</div>;
    }
    if (!settings) {
      return <div>No settings found.</div>;
    }

    switch (activeTab) {
      case 'general':
        return (
          <div className="Settings-form">
            <Input label="Platform Name" type="text" defaultValue={settings.general.platformName} />
            <Input label="Support Email" type="email" defaultValue={settings.general.supportEmail} />
            <label className="Checkbox-label">
              <input type="checkbox" defaultChecked={settings.general.enableRegistrations} />
              Enable new user registrations.
            </label>
            <Button variant="primary">Save General Settings</Button>
          </div>
        );
      case 'fees':
        return (
          <div className="Settings-form">
            <Input label="Freelancer Service Fee (%)" type="number" defaultValue={settings.fees.freelancerServiceFee} />
            <Input label="Client Payment Processing Fee (%)" type="number" defaultValue={settings.fees.clientProcessingFee} />
            <Input label="Fixed Processing Fee (USD)" type="number" defaultValue={settings.fees.fixedProcessingFee} />
            <Button variant="primary">Save Fee Structure</Button>
          </div>
        );
      case 'integrations':
        return (
          <div className="Settings-form">
            <Input label="Stripe API Key" type="password" defaultValue={settings.integrations.stripeApiKey}/>
            <Input label="Google Analytics ID" type="text" defaultValue={settings.integrations.googleAnalyticsId} />
            <Button variant="primary">Save Integrations</Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`Settings Settings--${theme}`}>
      <div className="Settings-container">
        <header className="Settings-header">
          <h1>Platform Settings</h1>
          <p>Configure global settings for the entire platform.</p>
        </header>

        <div className="Settings-layout">
          <nav className="Settings-nav">
            <button onClick={() => setActiveTab('general')} className={activeTab === 'general' ? 'active' : ''}>General</button>
            <button onClick={() => setActiveTab('fees')} className={activeTab === 'fees' ? 'active' : ''}>Fees & Charges</button>
            <button onClick={() => setActiveTab('integrations')} className={activeTab === 'integrations' ? 'active' : ''}>Integrations</button>
          </nav>
          <main className={`Settings-content Settings-content--${theme}`}>
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Settings;
