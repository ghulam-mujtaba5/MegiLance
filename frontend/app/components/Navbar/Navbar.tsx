// @AI-HINT: This is the Navbar component entry point. All styles are per-component only. See Navbar.common.css, Navbar.light.css, and Navbar.dark.css for theming.
import React, { useState, ReactNode } from 'react';
import Link from 'next/link';
import { useTheme } from '@/app/contexts/ThemeContext';
import { ProfileMenu } from '@/app/components/ProfileMenu/ProfileMenu';
import type { ProfileMenuItem } from '@/app/components/ProfileMenu/ProfileMenu';
import ThemeSwitcher from '@/app/components/ThemeSwitcher/ThemeSwitcher';
import { FaBars, FaTimes } from 'react-icons/fa';

import './Navbar.common.css';
import './Navbar.light.css';
import './Navbar.dark.css';

export interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
}

export interface NavbarProps {
  theme: 'light' | 'dark';
  navItems: NavItem[];
  profileMenuItems: ProfileMenuItem[];
  userName: string;
  userEmail?: string;
  logo: ReactNode;
}

const Navbar: React.FC<NavbarProps> = ({
  theme,
  navItems,
  profileMenuItems,
  userName,
  userEmail,
  logo,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toggleTheme } = useTheme();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className={`Navbar Navbar--${theme}`} role="banner">
      <div className="Navbar-container">
        <div className="Navbar-logo">
          <Link href="/dashboard" aria-label="Go to dashboard">
            {logo}
          </Link>
        </div>

        <nav className="Navbar-desktop-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="Navbar-link">
              {item.icon && <span className="Navbar-link-icon">{item.icon}</span>}
              <span className="Navbar-link-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="Navbar-actions">
          <ThemeSwitcher theme={theme} onToggle={toggleTheme} />
          <ProfileMenu
            theme={theme}
            userName={userName}
            userEmail={userEmail}
            menuItems={profileMenuItems}
          />
        </div>

        <div className="Navbar-mobile-toggle">
          <button 
            type="button"
            onClick={toggleMobileMenu} 
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <nav id="mobile-menu" className="Navbar-mobile-menu" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <Link 
              key={item.label} 
              href={item.href} 
              className="Navbar-mobile-link" 
              onClick={toggleMobileMenu}
            >
              {item.icon && <span className="Navbar-link-icon">{item.icon}</span>}
              <span className="Navbar-link-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};

export default Navbar;
