// @AI-HINT: This component provides a UI control for switching between light and dark themes. It uses the global ThemeContext to access the current theme and the toggle function.
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

import commonStyles from './ThemeSwitcher.common.module.css';
import lightStyles from './ThemeSwitcher.light.module.css';
import darkStyles from './ThemeSwitcher.dark.module.css';

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by not rendering until mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const themeStyles = theme === 'light' ? lightStyles : darkStyles;

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className={cn(commonStyles.themeToggle, themeStyles.themeToggle)}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? 
        <Moon size={20} className={cn(commonStyles.icon, themeStyles.icon)} /> : 
        <Sun size={20} className={cn(commonStyles.icon, themeStyles.icon)} />
      }
    </button>
  );
};

export default ThemeSwitcher;
