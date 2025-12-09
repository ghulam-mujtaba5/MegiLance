// @AI-HINT: Enterprise-level global Header with mega menu navigation, advanced dropdowns, and comprehensive feature access. Fully theme-aware and responsive.
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { 
  Menu, X, Sparkles, ChevronDown, Briefcase, Users, Shield, 
  Brain, Search, Zap, Globe, MessageSquare, CreditCard, 
  BarChart3, Settings, FileText, Star, Building2, Rocket,
  Award, BookOpen, HelpCircle, Mail, Activity, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MegiLanceLogo } from '@/app/components/MegiLanceLogo/MegiLanceLogo';
import Button from '@/app/components/Button/Button';
import StatusIndicator from '@/app/components/StatusIndicator/StatusIndicator';

import commonStyles from './Header.common.module.css';
import lightStyles from './Header.light.module.css';
import darkStyles from './Header.dark.module.css';

// Enterprise-level navigation structure
const megaMenuData = {
  product: {
    title: 'Product',
    sections: [
      {
        title: 'Platform',
        items: [
          { name: 'How It Works', href: '/how-it-works', icon: Rocket, description: 'Learn our 4-step process' },
          { name: 'Features', href: '/#features', icon: Zap, description: 'AI matching & blockchain payments' },
          { name: 'Pricing', href: '/pricing', icon: CreditCard, description: 'Transparent, low fees' },
          { name: 'For Clients', href: '/clients', icon: Briefcase, description: 'Hire top talent' },
          { name: 'For Freelancers', href: '/freelancers', icon: Users, description: 'Find work & grow' },
        ]
      },
      {
        title: 'AI Features',
        items: [
          { name: 'AI Hub', href: '/ai', icon: Brain, description: 'All AI tools in one place' },
          { name: 'AI Chatbot', href: '/ai/chatbot', icon: MessageSquare, description: 'Intelligent assistant' },
          { name: 'Price Estimator', href: '/ai/price-estimator', icon: BarChart3, description: 'ML-powered pricing' },
          { name: 'Smart Matching', href: '/explore', icon: Search, description: '7-factor algorithm' },
        ]
      }
    ]
  },
  solutions: {
    title: 'Solutions',
    sections: [
      {
        title: 'For Teams',
        items: [
          { name: 'Enterprise', href: '/enterprise', icon: Building2, description: 'Custom solutions' },
          { name: 'Teams', href: '/teams', icon: Users, description: 'Collaborate & scale' },
          { name: 'Talent Directory', href: '/talent', icon: Star, description: 'Browse top talent' },
        ]
      },
      {
        title: 'Portals',
        items: [
          { name: 'Client Dashboard', href: '/client/dashboard', icon: Briefcase, description: 'Manage projects', auth: true },
          { name: 'Freelancer Dashboard', href: '/freelancer/dashboard', icon: Users, description: 'Track earnings', auth: true },
          { name: 'Admin Portal', href: '/admin/dashboard', icon: Shield, description: 'Platform management', auth: true },
        ]
      }
    ]
  },
  resources: {
    title: 'Resources',
    sections: [
      {
        title: 'Learn',
        items: [
          { name: 'Blog', href: '/blog', icon: BookOpen, description: 'Insights & tips' },
          { name: 'FAQ', href: '/faq', icon: HelpCircle, description: 'Common questions' },
          { name: 'Support', href: '/support', icon: Mail, description: 'Get help' },
          { name: 'Community', href: '/community', icon: Users, description: 'Connect with others' },
        ]
      },
      {
        title: 'Company',
        items: [
          { name: 'About Us', href: '/about', icon: Globe, description: 'Our mission' },
          { name: 'Careers', href: '/careers', icon: Award, description: 'Join our team' },
          { name: 'Press', href: '/press', icon: FileText, description: 'Media resources' },
          { name: 'Status', href: '/status', icon: Activity, description: 'System health' },
        ]
      }
    ]
  }
};

type MenuKey = keyof typeof megaMenuData | null;

const Header: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuKey>(null);
  const [isMounted, setIsMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const handleMenuEnter = useCallback((menu: MenuKey) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveMenu(menu);
  }, []);

  const handleMenuLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Close menu on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenu(null);
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <header className={cn(commonStyles.header, themeStyles.header)}>
        <nav className={commonStyles.nav} ref={menuRef}>
          <Link href="/" className={commonStyles.brandLink}>
            <MegiLanceLogo />
            <span className={cn(commonStyles.brandName, themeStyles.brandName)}>MegiLance</span>
          </Link>

          {/* Desktop Navigation */}
          <div className={commonStyles.navLinks}>
            {/* Explore - Featured Link */}
            <Link href="/explore" className={cn(commonStyles.exploreLink, themeStyles.exploreLink)}>
              <Sparkles size={16} />
              Explore
            </Link>

            {/* Mega Menu Items */}
            {(Object.keys(megaMenuData) as Array<keyof typeof megaMenuData>).map((key, index, arr) => (
              <div 
                key={key}
                className={commonStyles.navDropdownWrapper}
                onMouseEnter={() => handleMenuEnter(key)}
                onMouseLeave={handleMenuLeave}
              >
                <button 
                  className={cn(
                    commonStyles.navDropdownTrigger, 
                    themeStyles.navDropdownTrigger,
                    activeMenu === key && commonStyles.navDropdownTriggerActive
                  )}
                  aria-expanded={activeMenu === key}
                  aria-haspopup="true"
                >
                  {megaMenuData[key].title}
                  <ChevronDown 
                    size={14} 
                    className={cn(
                      commonStyles.chevron,
                      activeMenu === key && commonStyles.chevronRotated
                    )} 
                  />
                </button>

                {/* Mega Menu Dropdown */}
                <div 
                  className={cn(
                    commonStyles.megaMenu,
                    themeStyles.megaMenu,
                    activeMenu === key && commonStyles.megaMenuActive,
                    index === arr.length - 1 && commonStyles.megaMenuRight
                  )}
                  onMouseEnter={() => handleMenuEnter(key)}
                  onMouseLeave={handleMenuLeave}
                >
                  <div className={commonStyles.megaMenuInner}>
                    {megaMenuData[key].sections.map((section, idx) => (
                      <div key={idx} className={commonStyles.megaMenuSection}>
                        <h4 className={cn(commonStyles.megaMenuSectionTitle, themeStyles.megaMenuSectionTitle)}>
                          {section.title}
                        </h4>
                        <div className={commonStyles.megaMenuItems}>
                          {section.items.map((item) => (
                            <Link 
                              key={item.href}
                              href={item.href}
                              className={cn(commonStyles.megaMenuItem, themeStyles.megaMenuItem)}
                              onClick={() => setActiveMenu(null)}
                            >
                              <span className={cn(commonStyles.megaMenuItemIcon, themeStyles.megaMenuItemIcon)}>
                                <item.icon size={18} />
                              </span>
                              <div className={commonStyles.megaMenuItemContent}>
                                <span className={commonStyles.megaMenuItemName}>
                                  {item.name}
                                  {'auth' in item && item.auth && (
                                    <Lock size={12} className={commonStyles.authIcon} />
                                  )}
                                </span>
                                <span className={cn(commonStyles.megaMenuItemDesc, themeStyles.megaMenuItemDesc)}>
                                  {item.description}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Sign In Button */}
            <Link href="/login" className={commonStyles.signInLink}>
              <Button variant="primary" size="sm">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMenu} 
            className={cn(commonStyles.mobileMenuButton, themeStyles.mobileMenuButton)} 
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </header>

      {/* Mobile Navigation */}
      <div 
        className={cn(
          commonStyles.mobileNavMenu, 
          themeStyles.mobileNavMenu, 
          isMenuOpen && commonStyles.mobileNavMenuActive
        )}
      >
        {/* Featured Link */}
        <Link 
          href="/explore" 
          className={cn(commonStyles.exploreLink, themeStyles.exploreLink)} 
          onClick={() => setIsMenuOpen(false)}
        >
          <Sparkles size={16} />
          Explore All Features
        </Link>

        {/* Mobile Menu Sections */}
        {(Object.keys(megaMenuData) as Array<keyof typeof megaMenuData>).map((key) => (
          <div key={key} className={commonStyles.mobileMenuSection}>
            <h4 className={cn(commonStyles.mobileMenuSectionTitle, themeStyles.mobileMenuSectionTitle)}>
              {megaMenuData[key].title}
            </h4>
            {megaMenuData[key].sections.map((section, idx) => (
              <div key={idx} className={commonStyles.mobileMenuGroup}>
                {section.items.slice(0, 3).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(commonStyles.mobileMenuItem, themeStyles.mobileMenuItem)}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon size={16} />
                    <span>{item.name}</span>
                    {'auth' in item && item.auth && <Lock size={12} />}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        ))}

        {/* Mobile Sign In */}
        <Link href="/login" className={commonStyles.signInLinkMobile} onClick={() => setIsMenuOpen(false)}>
          <Button variant="primary" size="md" fullWidth>
            Sign In
          </Button>
        </Link>
      </div>
    </>
  );
};

export default Header;
