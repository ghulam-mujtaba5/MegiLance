// @AI-HINT: Premium theme toggle button for light/dark mode, styled for perfect visibility and accessibility.
'use client';
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

import commonStyles from './ThemeToggleButton.common.module.css';
import lightStyles from './ThemeToggleButton.light.module.css';
import darkStyles from './ThemeToggleButton.dark.module.css';

const ThemeToggleButton: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={commonStyles.container}>
        <button className={cn(commonStyles.button, commonStyles.loading)} aria-label='Loading theme toggle'>
          <Moon size={22} />
        </button>
      </div>
    );
  }

  return (
    <div className={commonStyles.container}>
      <button
        aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className={cn(commonStyles.button, themeStyles.button)}
      >
        {resolvedTheme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
      </button>
    </div>
  );
};

export default ThemeToggleButton;
