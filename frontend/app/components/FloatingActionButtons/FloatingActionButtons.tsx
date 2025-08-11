// @AI-HINT: This component is a container for globally positioned floating action buttons, like the theme toggle and chat bot, ensuring they are stacked neatly and don't overlap.
'use client';

import React from 'react';
import styles from './FloatingActionButtons.module.css';

type Props = {
  children: React.ReactNode;
  position?: 'left' | 'right';
  className?: string;
};

const FloatingActionButtons: React.FC<Props> = ({ children, position = 'right', className }) => {
  const sideClass = position === 'left' ? styles.left : styles.right;
  return <div className={`${styles.container} ${sideClass} ${className ?? ''}`.trim()}>{children}</div>;
};

export default FloatingActionButtons;
