// @AI-HINT: This is a reusable Checkbox component. It is designed to be themeable and accessible.
'use client';
import React from 'react';
import './Checkbox.common.css';
import './Checkbox.light.css';
import './Checkbox.dark.css';

interface CheckboxProps {
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children: React.ReactNode;
  error?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ name, checked, onChange, children, error }) => {
  return (
    <div className="Checkbox-wrapper">
      <label className="Checkbox-label">
        <input
          type="checkbox"
          name={name}
          className="Checkbox-input"
          checked={checked}
          onChange={onChange}
        />
        <span className="Checkbox-custom"></span>
        <span className="Checkbox-text">{children}</span>
      </label>
      {error && <p className="Checkbox-error">{error}</p>}
    </div>
  );
};

export default Checkbox;
