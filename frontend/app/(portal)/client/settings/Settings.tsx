// @AI-HINT: Client Settings management. Theme-aware, accessible sections with forms and toggles.
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import common from './Settings.common.module.css';
import light from './Settings.light.module.css';
import dark from './Settings.dark.module.css';

const Settings: React.FC = () => {
  const { theme } = useTheme();
  const themed = theme === 'dark' ? dark : light;

  // Form states (mock)
  const [name, setName] = useState('Acme Corp');
  const [email, setEmail] = useState('owner@acme.co');
  const [bio, setBio] = useState('We hire top freelancers for product growth.');

  const [twoFA, setTwoFA] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyProduct, setNotifyProduct] = useState(false);
  const [status, setStatus] = useState('');

  const headerRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const securityRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const billingRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const profileVisible = useIntersectionObserver(profileRef, { threshold: 0.1 });
  const securityVisible = useIntersectionObserver(securityRef, { threshold: 0.1 });
  const notifVisible = useIntersectionObserver(notifRef, { threshold: 0.1 });
  const billingVisible = useIntersectionObserver(billingRef, { threshold: 0.1 });

   // Draft persistence
   useEffect(() => {
     try {
       const raw = localStorage.getItem('client_settings_draft');
       if (raw) {
         const d = JSON.parse(raw);
         if (d.name) setName(d.name);
         if (d.email) setEmail(d.email);
         if (d.bio) setBio(d.bio);
         if (typeof d.twoFA === 'boolean') setTwoFA(d.twoFA);
         if (typeof d.notifyEmail === 'boolean') setNotifyEmail(d.notifyEmail);
         if (typeof d.notifyProduct === 'boolean') setNotifyProduct(d.notifyProduct);
       }
     } catch {}
   }, []);

   const saveDraft = () => {
     const d = { name, email, bio, twoFA, notifyEmail, notifyProduct };
     try {
       localStorage.setItem('client_settings_draft', JSON.stringify(d));
       setStatus('Settings saved');
       setTimeout(() => setStatus(''), 2000);
     } catch {}
   };

   const resetDraft = () => {
     setName('Acme Corp');
     setEmail('owner@acme.co');
     setBio('We hire top freelancers for product growth.');
     setTwoFA(false);
     setNotifyEmail(true);
     setNotifyProduct(false);
     setStatus('Changes reverted');
     setTimeout(() => setStatus(''), 2000);
   };

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <div ref={headerRef} className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}>
          <div>
            <h1 className={common.title}>Settings</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Manage your account details, security, notifications, and billing.</p>
          </div>
          <div className={common.actions}>
            <div role="status" aria-live="polite" className={common.status}>{status}</div>
            <button className={cn(common.button, 'secondary', themed.button, 'secondary')} type="button" onClick={resetDraft}>Discard</button>
            <button className={cn(common.button, 'primary', themed.button, 'primary')} type="button" onClick={saveDraft}>Save Changes</button>
          </div>
        </div>

        {/* Profile */}
        <section ref={profileRef} className={cn(common.section, themed.section, profileVisible ? common.isVisible : common.isNotVisible)} aria-labelledby="profile-title">
          <h2 id="profile-title" className={cn(common.sectionTitle, themed.sectionTitle)}>Profile</h2>
          <div className={common.row}>
            <div>
              <label htmlFor="name" className={cn(common.label, themed.label)}>Organization Name</label>
              <input id="name" className={cn(common.input, themed.input)} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!name.trim() || undefined} aria-describedby="name-help name-count" placeholder="e.g., Acme Corp" />
              <div className={common.counters}>
                <div id="name-help" className={cn(common.help)}>Displayed on proposals and invoices.</div>
                <div id="name-count" className={common.count}>{name.trim().length} chars</div>
              </div>
            </div>
            <div>
              <label htmlFor="email" className={cn(common.label, themed.label)}>Contact Email</label>
              <input id="email" type="email" className={cn(common.input, themed.input)} value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || undefined} aria-describedby="email-help" placeholder="name@company.com" />
              <div id="email-help" className={cn(common.help)}>Used for notifications and billing receipts.</div>
            </div>
            <div>
              <label htmlFor="bio" className={cn(common.label, themed.label)}>About / Notes</label>
              <textarea id="bio" className={cn(common.textarea, themed.textarea)} value={bio} onChange={(e) => setBio(e.target.value)} aria-describedby="bio-count" placeholder="Describe your team, goals, preferences…" />
              <div className={common.counters}>
                <div className={common.help}>Markdown supported in future.</div>
                <div id="bio-count" className={common.count}>{bio.trim().length} chars</div>
              </div>
            </div>
          </div>
        </section>

        {/* Security */}
        <section ref={securityRef} className={cn(common.section, themed.section, securityVisible ? common.isVisible : common.isNotVisible)} aria-labelledby="security-title">
          <h2 id="security-title" className={cn(common.sectionTitle, themed.sectionTitle)}>Security</h2>
          <div className={common.row}>
            <div className={common.switch}>
              <span className={cn(common.label, themed.label)}>Two-Factor Authentication</span>
              <button
                type="button"
                role="switch"
                aria-checked={twoFA || undefined}
                className={cn(common.switchTrack, twoFA && common.switchOn, themed.switchTrack, twoFA && themed.switchOn)}
                onClick={() => setTwoFA((v) => !v)}
              >
                <span aria-hidden="true" className={cn(common.switchThumb, themed.switchThumb)} />
                <span className={common.srOnly}>Toggle two-factor authentication</span>
              </button>
            </div>
            <div className={common.actions}>
              <button className={cn(common.button, 'secondary', themed.button, 'secondary')} type="button" onClick={() => alert('Password reset link sent')}>Send Password Reset</button>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section ref={notifRef} className={cn(common.section, themed.section, notifVisible ? common.isVisible : common.isNotVisible)} aria-labelledby="notif-title">
          <h2 id="notif-title" className={cn(common.sectionTitle, themed.sectionTitle)}>Notifications</h2>
          <div className={common.row}>
            <label className={cn(common.switch)}>
              <input type="checkbox" className={common.srOnly} checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} aria-checked={notifyEmail || undefined} />
              <span className={cn(common.switchTrack, themed.switchTrack, notifyEmail && common.switchOn, notifyEmail && themed.switchOn)} aria-hidden="true">
                <span className={cn(common.switchThumb, themed.switchThumb)} />
              </span>
              <span>Email Updates</span>
            </label>

            <label className={cn(common.switch)}>
              <input type="checkbox" className={common.srOnly} checked={notifyProduct} onChange={(e) => setNotifyProduct(e.target.checked)} aria-checked={notifyProduct || undefined} />
              <span className={cn(common.switchTrack, themed.switchTrack, notifyProduct && common.switchOn, notifyProduct && themed.switchOn)} aria-hidden="true">
                <span className={cn(common.switchThumb, themed.switchThumb)} />
              </span>
              <span>Product Announcements</span>
            </label>
          </div>
        </section>

        {/* Billing */}
        <section ref={billingRef} className={cn(common.section, themed.section, billingVisible ? common.isVisible : common.isNotVisible)} aria-labelledby="billing-title">
          <h2 id="billing-title" className={cn(common.sectionTitle, themed.sectionTitle)}>Billing</h2>
          <div className={common.row}>
            <div>
              <label htmlFor="country" className={cn(common.label, themed.label)}>Country</label>
              <select id="country" className={cn(common.select, themed.select)} defaultValue="US">
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="DE">Germany</option>
              </select>
            </div>
            <div>
              <label htmlFor="taxId" className={cn(common.label, themed.label)}>Tax ID (optional)</label>
              <input id="taxId" className={cn(common.input, themed.input)} placeholder="VAT / GST / EIN" />
              <div className={cn(common.help)}>Appears on invoices and receipts.</div>
            </div>
            <div className={common.actions}>
              <button className={cn(common.button, 'secondary', themed.button, 'secondary')} type="button" onClick={() => alert('Invoice emailed')}>Email Last Invoice</button>
              <button className={cn(common.button, 'primary', themed.button, 'primary')} type="button" onClick={() => alert('Payment method updated')}>Update Payment Method</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Settings;
