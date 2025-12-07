'use client';

import React from 'react';

interface StaggerContainerProps {
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

export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className = '', style }) => {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
};
