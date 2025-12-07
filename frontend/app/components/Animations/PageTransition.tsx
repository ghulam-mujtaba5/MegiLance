'use client';

import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

export const PageTransition = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // During SSR or initial hydration, render without animation wrapper
  if (!isClient) {
    return <div className={className}>{children}</div>;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
