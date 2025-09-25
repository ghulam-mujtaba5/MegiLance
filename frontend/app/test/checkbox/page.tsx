// @AI-HINT: Test page for the enhanced Checkbox component showcasing all its features and states.
'use client';

import React, { useState } from 'react';
import Checkbox from '@/app/components/Checkbox/Checkbox';
import { ThemeProvider, useTheme } from 'next-themes';
import Button from '@/app/components/Button/Button';

const CheckboxTestPage = () => {
  const [checked, setChecked] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = useState('');
  const { theme, setTheme } = useTheme();

  const handleToggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Enhanced Checkbox Component</h1>
          <Button onClick={handleToggleTheme}>
            Toggle {theme === 'light' ? 'Dark' : 'Light'} Theme
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Checkbox States</h2>
            
            <Checkbox
              name="basic"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            >
              Basic Checkbox
            </Checkbox>
            
            <Checkbox
              name="indeterminate"
              checked={indeterminate}
              indeterminate={!indeterminate && checked}
              onChange={(e) => setIndeterminate(e.target.checked)}
            >
              Indeterminate State
            </Checkbox>
            
            <Checkbox
              name="disabled"
              checked={disabled}
              onChange={(e) => setDisabled(e.target.checked)}
              disabled
            >
              Disabled Checkbox
            </Checkbox>
            
            <Checkbox
              name="error"
              checked={!!error}
              onChange={(e) => setError(e.target.checked ? 'This is an error message' : '')}
              error={error}
            >
              Checkbox with Error
            </Checkbox>
            
            <Checkbox
              name="link"
              checked={false}
              onChange={() => {}}
            >
              Checkbox with a <a href="#">link</a> in the label
            </Checkbox>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Usage Examples</h2>
            
            <div className="p-6 rounded-xl bg-opacity-50 backdrop-blur-sm">
              <h3 className="text-xl font-medium mb-4">Terms Agreement</h3>
              <Checkbox
                name="terms"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                error={error}
              >
                I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
              </Checkbox>
            </div>
            
            <div className="p-6 rounded-xl bg-opacity-50 backdrop-blur-sm">
              <h3 className="text-xl font-medium mb-4">Notification Preferences</h3>
              <div className="space-y-3">
                <Checkbox name="email" checked={true} onChange={() => {}}>
                  Email notifications
                </Checkbox>
                <Checkbox name="sms" checked={false} onChange={() => {}}>
                  SMS notifications
                </Checkbox>
                <Checkbox name="push" checked={true} onChange={() => {}}>
                  Push notifications
                </Checkbox>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper component to provide theme context
export default function CheckboxTestPageWrapper() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <CheckboxTestPage />
    </ThemeProvider>
  );
}