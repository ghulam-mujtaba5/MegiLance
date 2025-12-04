'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface ScrollRevealProps {
  children: React.ReactNode;
  width?: 'fit-content' | '100%';
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  className?: string;
  once?: boolean;
  threshold?: number;
  overflow?: 'hidden' | 'visible';
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  width = 'fit-content',
  delay = 0,
  duration = 0.5,
  direction = 'up',
  distance = 50,
  className = '',
  once = true,
  threshold = 0.2,
  overflow = 'visible',
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });

  const getInitial = () => {
    switch (direction) {
      case 'up': return { opacity: 0, y: distance };
      case 'down': return { opacity: 0, y: -distance };
      case 'left': return { opacity: 0, x: distance };
      case 'right': return { opacity: 0, x: -distance };
      case 'none': return { opacity: 0 };
      default: return { opacity: 0, y: distance };
    }
  };

  const getAnimate = () => {
    switch (direction) {
      case 'up': return { opacity: 1, y: 0 };
      case 'down': return { opacity: 1, y: 0 };
      case 'left': return { opacity: 1, x: 0 };
      case 'right': return { opacity: 1, x: 0 };
      case 'none': return { opacity: 1 };
      default: return { opacity: 1, y: 0 };
    }
  };

  return (
    <div ref={ref} style={{ width, overflow }} className={className}>
      <motion.div
        variants={{
          hidden: getInitial(),
          visible: getAnimate(),
        }}
        initial='hidden'
        animate={isInView ? 'visible' : 'hidden'}
        transition={{ duration, delay, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </div>
  );
};
