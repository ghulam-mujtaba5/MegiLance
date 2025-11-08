// @AI-HINT: Premium theme toggle button for light/dark mode, styled for perfect visibility and accessibility.
'use client';
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

const ThemeToggleButton: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="themeToggleFloating">
        <button className="themeToggleBtn" aria-label="Loading theme toggle">
          <Moon size={22} />
        </button>
      </div>
    );
  }

  return (
    <div className="themeToggleFloating">
      <button
        aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className="themeToggleBtn"
      >
        {resolvedTheme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
      </button>
    </div>
  );
};

export default ThemeToggleButton;
