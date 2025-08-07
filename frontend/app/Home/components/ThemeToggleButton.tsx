// @AI-HINT: Premium theme toggle button for light/dark mode, styled for perfect visibility and accessibility.
'use client';
import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

const ThemeToggleButton: React.FC = () => {
  const { theme, setTheme } = useTheme();
  return (
  <div className="themeToggleFloating">
    <button
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="themeToggleBtn"
    >
      {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
    </button>
  </div>
);
};

export default ThemeToggleButton;
