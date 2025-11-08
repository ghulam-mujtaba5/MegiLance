// @AI-HINT: Premium floating theme toggle button, globally visible.
'use client';
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import styles from './ThemeToggleButton.module.css';

const ThemeToggleButton: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={styles.themeToggleFloating}>
        <button className={styles.themeToggleBtn} aria-label="Loading theme toggle">
          <Moon size={28} />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.themeToggleFloating}>
      <button
        aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className={styles.themeToggleBtn}
      >
        {resolvedTheme === 'dark' ? <Sun size={28} /> : <Moon size={28} />}
      </button>
    </div>
  );
};

export default ThemeToggleButton;
