'use client';

import React from 'react';

// TEMPORARY: Disabled Framer Motion to fix hydration errors
// We'll re-enable with proper SSR handling after testing is complete
export const PageTransition = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  // Simply render children without animation during testing phase
  return <div className={className}>{children}</div>;
};
