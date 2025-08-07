// @AI-HINT: Premium floating theme toggle button, globally visible.
'use client';
import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import styles from './ThemeToggleButton.module.css';

const ThemeToggleButton: React.FC = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div className={styles.themeToggleFloating}>
      <button
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className={styles.themeToggleBtn}
      >
        {theme === 'dark' ? <Sun size={28} /> : <Moon size={28} />}
      </button>
    </div>
  );
};

export default ThemeToggleButton;
