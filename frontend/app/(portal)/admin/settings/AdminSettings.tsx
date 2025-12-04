// @AI-HINT: Admin Settings page. Theme-aware, accessible, animated sections, forms, toggles, and sticky save bar.
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/components/Animations';
import { useAdminData } from '@/hooks/useAdmin';
import common from './AdminSettings.common.module.css';
import light from './AdminSettings.light.module.css';
import dark from './AdminSettings.dark.module.css';

const AdminSettings: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { loading, error } = useAdminData();

  const [companyName, setCompanyName] = useState('MegiLance');
  const [supportEmail, setSupportEmail] = useState('support@megilance.com');
  const [allow2FA, setAllow2FA] = useState(true);
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  const onSave = () => {
    // No backend calls per project constraints. Display a subtle confirmation.
    // eslint-disable-next-line no-alert
    alert('Settings saved (mock).');
  };

  return (
    <PageTransition className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <ScrollReveal className={common.header}>
          <div>
            <h1 className={common.title}>Admin Settings</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Configure organization preferences, security policies, and notifications.</p>
          </div>
        </ScrollReveal>

        {loading && <div className={common.skeletonRow} aria-busy="true" />}
        {error && <div className={common.error}>Failed to load settings.</div>}

        <StaggerContainer>
          <ScrollReveal
            className={cn(common.section, themed.section)}
            aria-labelledby="general-settings-title"
          >
            <h2 id="general-settings-title" className={cn(common.sectionTitle, themed.sectionTitle)}>General</h2>
            <div className={common.row}>
              <div className={common.field}>
                <label htmlFor="company" className={common.label}>Company Name</label>
                <input id="company" className={cn(common.input, themed.input)} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                <div className={cn(common.help, themed.help)}>Shown in emails and invoices.</div>
              </div>
              <div className={common.field}>
                <label htmlFor="email" className={common.label}>Support Email</label>
                <input id="email" type="email" className={cn(common.input, themed.input)} value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                <div className={cn(common.help, themed.help)}>Used for outbound notifications.</div>
              </div>
            </div>
            <div className={common.field}>
              <label htmlFor="desc" className={common.label}>Organization Description</label>
              <textarea id="desc" rows={3} className={cn(common.textarea, themed.textarea)} placeholder="Brief description…" />
            </div>
          </ScrollReveal>

          <ScrollReveal
            className={cn(common.section, themed.section)}
            aria-labelledby="security-settings-title"
          >
            <h2 id="security-settings-title" className={cn(common.sectionTitle, themed.sectionTitle)}>Security</h2>
            <div className={common.row}>
              <div className={common.field}>
                <label className={common.label}>Require 2FA</label>
                <div className={common.toggle}>
                  <input id="twofa" type="checkbox" checked={allow2FA} onChange={(e) => setAllow2FA(e.target.checked)} aria-labelledby="twofa-label" />
                  <span id="twofa-label">Enabled</span>
                </div>
                <div className={cn(common.help, themed.help)}>Enforces two-factor authentication for all admins.</div>
              </div>
              <div className={common.field}>
                <label htmlFor="whitelist" className={common.label}>IP Whitelist</label>
                <textarea id="whitelist" rows={3} className={cn(common.textarea, themed.textarea)} placeholder="One CIDR per line" value={ipWhitelist} onChange={(e) => setIpWhitelist(e.target.value)} />
                <div className={cn(common.help, themed.help)}>Example: 203.0.113.0/24</div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal
            className={cn(common.section, themed.section)}
            aria-labelledby="notifications-settings-title"
          >
            <h2 id="notifications-settings-title" className={cn(common.sectionTitle, themed.sectionTitle)}>Notifications</h2>
            <div className={common.row}>
              <div className={common.field}>
                <label className={common.label}>Email Alerts</label>
                <div className={common.toggle}>
                  <input id="email-alerts" type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} aria-labelledby="email-alerts-label" />
                  <span id="email-alerts-label">Enabled</span>
                </div>
                <div className={cn(common.help, themed.help)}>Receive critical system alerts via email.</div>
              </div>
              <div className={common.field}>
                <label className={common.label}>SMS Alerts</label>
                <div className={common.toggle}>
                  <input id="sms-alerts" type="checkbox" checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} aria-labelledby="sms-alerts-label" />
                  <span id="sms-alerts-label">Enabled</span>
                </div>
                <div className={cn(common.help, themed.help)}>Receive high-priority alerts via SMS.</div>
              </div>
            </div>
          </ScrollReveal>
        </StaggerContainer>

        <div className={common.saveBar}>
          <button type="button" className={cn(common.button, 'secondary', themed.button)} onClick={() => window.history.back()}>Cancel</button>
          <button type="button" className={cn(common.button, 'primary', themed.button)} onClick={onSave}>Save Changes</button>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminSettings;
