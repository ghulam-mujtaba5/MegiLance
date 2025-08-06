// @AI-HINT: This component provides a fully theme-aware editor for administrators to update policy documents. It uses per-component CSS modules and the cn utility for robust, maintainable styling.
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import commonStyles from './AdminPolicyEditor.common.module.css';
import lightStyles from './AdminPolicyEditor.light.module.css';
import darkStyles from './AdminPolicyEditor.dark.module.css';

// Mock policy content
const mockPolicies = {
  terms: `Welcome to MegiLance... By using our services, you agree to these terms...`,
  privacy: `Your privacy is important to us... We collect data to improve our services...`,
  kyc: `Know Your Customer (KYC) guidelines require us to verify the identity of our users...`,
};

type PolicyType = 'terms' | 'privacy' | 'kyc';

const AdminPolicyEditor: React.FC = () => {
  const { theme } = useTheme();
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyType>('terms');
  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    setContent(mockPolicies[selectedPolicy]);
  }, [selectedPolicy]);

  const handleSave = () => {
    console.log(`Saving ${selectedPolicy} policy:`, content);
    mockPolicies[selectedPolicy] = content; // In a real app, this would be an API call
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className={cn(commonStyles.policyEditorContainer, themeStyles.policyEditorContainer)}>
      <h2 className={cn(commonStyles.policyEditorTitle, themeStyles.policyEditorTitle)}>Admin Policy Editor</h2>
      <div className={cn(commonStyles.policyEditorEditor, themeStyles.policyEditorEditor)}>
        <div className={cn(commonStyles.policyEditorControls, themeStyles.policyEditorControls)}>
            <label htmlFor="policy-select" className={commonStyles.srOnly}>Select a policy to edit</label>
            <select
              id="policy-select"
              value={selectedPolicy}
              onChange={(e) => setSelectedPolicy(e.target.value as PolicyType)}
              className={cn(commonStyles.policyEditorSelect, themeStyles.policyEditorSelect)}
            >
              <option value="terms">Terms of Service</option>
              <option value="privacy">Privacy Policy</option>
              <option value="kyc">KYC Policy</option>
            </select>
          </div>
        <label htmlFor="policy-content" className={commonStyles.srOnly}>Policy content</label>
        <textarea
          id="policy-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={cn(commonStyles.policyEditorTextarea, themeStyles.policyEditorTextarea)}
          rows={20}
        />
        <div className={cn(commonStyles.policyEditorActions, themeStyles.policyEditorActions)}>
          <Button variant="primary" onClick={handleSave}>Save Policy</Button>
          {isSaved && <span className={cn(commonStyles.saveConfirmation, themeStyles.saveConfirmation)}>Policy saved!</span>}
        </div>
      </div>
    </div>
  );
};

export default AdminPolicyEditor;
