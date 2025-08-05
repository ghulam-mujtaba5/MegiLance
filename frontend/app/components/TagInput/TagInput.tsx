// @AI-HINT: This component provides a UI for inputting a list of tags, e.g., for required skills.
'use client';

import React, { useState, KeyboardEvent } from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import commonStyles from './TagInput.common.module.css';
import lightStyles from './TagInput.light.module.css';
import darkStyles from './TagInput.dark.module.css';

interface TagInputProps {
  label: string;
  tags: string[];
  setTags: (tags: string[]) => void;
}

const TagInput: React.FC<TagInputProps> = ({ label, tags, setTags }) => {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={cn(commonStyles.tagInputContainer, theme === 'light' ? lightStyles.light : darkStyles.dark)}>
      <label className={commonStyles.tagInputLabel}>{label}</label>
      <div className={commonStyles.tagInputWrapper}>
        {tags.map(tag => (
          <div key={tag} className={commonStyles.tagInputTag}>
            {tag}
            <button onClick={() => removeTag(tag)} className={commonStyles.tagInputRemoveBtn}>
              &times;
            </button>
          </div>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a skill..."
          className={commonStyles.tagInputInput}
        />
      </div>
    </div>
  );
};

export default TagInput;
