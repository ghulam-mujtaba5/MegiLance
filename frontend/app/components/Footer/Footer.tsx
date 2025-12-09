// @AI-HINT: The primary site footer, providing comprehensive navigation, social links, and copyright information with a premium, theme-aware design.
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Github, Twitter, Linkedin } from 'lucide-react';

import MegiLanceLogo from '@/app/components/MegiLanceLogo/MegiLanceLogo';

import commonStyles from './Footer.common.module.css';
import lightStyles from './Footer.light.module.css';
import darkStyles from './Footer.dark.module.css';

const footerSections = {
  'Platform': [
    { name: 'Marketplace', href: '/#features', status: 'complete' },
    { name: 'How It Works', href: '/how-it-works', status: 'complete' },
    { name: 'Pricing', href: '/pricing', status: 'complete' },
    { name: 'Talent Directory', href: '/talent', status: 'complete' },
    { name: 'AI Matching', href: '/explore', status: 'advanced' },
  ],
  'For You': [
    { name: 'For Clients', href: '/clients', status: 'complete' },
    { name: 'For Freelancers', href: '/freelancers', status: 'complete' },
    { name: 'Teams', href: '/teams', status: 'working' },
    { name: 'FAQ', href: '/faq', status: 'complete' },
  ],
  'AI & Security': [
    { name: 'AI Chatbot', href: '/ai/chatbot', status: 'advanced' },
    { name: 'Price Estimator', href: '/ai/price-estimator', status: 'advanced' },
    { name: 'Blockchain Escrow', href: '/#blockchain', status: 'complete' },
    { name: 'System Status', href: '/status', status: 'complete' },
  ],
  'Support': [
    { name: 'Help Center', href: '/support', status: 'working' },
    { name: 'Contact Us', href: '/contact', status: 'complete' },
    { name: 'About Us', href: '/about', status: 'complete' },
    { name: 'Blog', href: '/blog', status: 'working' },
  ],
};

const socialLinks = [
  { name: 'Twitter', href: '#', icon: Twitter },
  { name: 'GitHub', href: '#', icon: Github },
  { name: 'LinkedIn', href: '#', icon: Linkedin },
];

const Footer = () => {
  const { resolvedTheme } = useTheme();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <footer className={cn(commonStyles.footer, styles.footer)}>
      <div className={cn(commonStyles.container)}>
        <div className={commonStyles.mainContent}>
          <div className={commonStyles.brandColumn}>
            <Link href="/" aria-label="MegiLance Home">
              <MegiLanceLogo />
            </Link>
            <p className={cn(commonStyles.tagline, styles.tagline)}>
              The Future of Freelance, Today.
            </p>
          </div>
          <div className={commonStyles.linksGrid}>
            {Object.entries(footerSections).map(([title, links]) => (
              <div key={title} className={commonStyles.linksColumn}>
                <h3 className={cn(commonStyles.linksTitle, styles.linksTitle)}>{title}</h3>
                <ul className={commonStyles.linksList}>
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className={cn(commonStyles.linkItem, styles.linkItem)}>
                        <span className={commonStyles.linkText}>{link.name}</span>
                        {link.status && (
                          <span className={cn(
                            commonStyles.statusBadge,
                            link.status === 'complete' && commonStyles.statusComplete,
                            link.status === 'advanced' && commonStyles.statusAdvanced,
                            link.status === 'working' && commonStyles.statusWorking,
                          )}>
                            {link.status === 'complete' && 'Complete'}
                            {link.status === 'advanced' && 'Advanced'}
                            {link.status === 'working' && 'Working'}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className={cn(commonStyles.bottomBar, styles.bottomBar)}>
          <div className={commonStyles.copyrightWrapper}>
            <p className={cn(commonStyles.copyright, styles.copyright)}>
              &copy; {new Date().getFullYear()} MegiLance. Final Year Project (FYP) 2022-2026.
            </p>
            <p className={cn(commonStyles.university, styles.university)}>
              COMSATS University Islamabad, Lahore Campus
            </p>
          </div>
          <div className={commonStyles.socialLinks}>
            {socialLinks.map((link) => (
              <a key={link.name} href={link.href} aria-label={link.name} className={cn(commonStyles.socialLink, styles.socialLink)}>
                <link.icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
