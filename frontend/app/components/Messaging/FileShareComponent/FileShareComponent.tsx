// @AI-HINT: This component provides a theme-aware interface for file sharing. It uses global CSS variables for all colors and styles, ensuring perfect integration with the application's current theme.
'use client';

import React, { useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import Button from '@/app/components/Button/Button';
import { cn } from '@/lib/utils';
import commonStyles from './FileShareComponent.common.module.css';
import lightStyles from './FileShareComponent.light.module.css';
import darkStyles from './FileShareComponent.dark.module.css';

const FileShareComponent: React.FC = () => {
  const { theme } = useTheme();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!theme) return null;

  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSendFile = () => {
    if (selectedFile) {
      console.log('Sending file:', selectedFile.name);
      // In a real app, this would trigger an upload API call
      setSelectedFile(null);
    }
  };

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <label htmlFor="file-upload" className={commonStyles.visuallyHidden}>Upload file</label>
      <input
        id="file-upload"
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className={commonStyles.visuallyHidden}
      />
      {!selectedFile ? (
        <Button variant="secondary" onClick={handleButtonClick}>Share File</Button>
      ) : (
        <div className={cn(commonStyles.preview, themeStyles.preview)}>
          <span className={cn(commonStyles.fileName, themeStyles.fileName)}>{selectedFile.name}</span>
          <div className={commonStyles.actions}>
            <Button variant="primary" size="small" onClick={handleSendFile}>Send</Button>
            <Button variant="secondary" size="small" onClick={() => setSelectedFile(null)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileShareComponent;
