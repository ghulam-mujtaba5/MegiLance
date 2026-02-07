'use client';

import React from 'react';

interface StaggerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
  staggerDelay?: number;
  className?: string;
}

// Simplified StaggerContainer - no animations, just render children
// Animations disabled due to hydration issues
export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export const StaggerItem: React.FC<{ 
  children: React.ReactNode; 
  className?: string; 
  style?: React.CSSProperties;
  tabIndex?: number;
  role?: string;
  'aria-labelledby'?: string;
  onClick?: () => void;
}> = ({ children, className = '', style, tabIndex, role, 'aria-labelledby': ariaLabelledby, onClick }) => {
  return (
    <div className={className} style={style} tabIndex={tabIndex} role={role} aria-labelledby={ariaLabelledby} onClick={onClick}>
      {children}
    </div>
  );
};
