// @AI-HINT: Payments page using the Payments component with theme support.

'use client';

import React from 'react';
import Payments from './Payments';
import { useTheme } from 'next-themes';
import styles from './PaymentsPage.module.css';

const PaymentsPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  
  return (
    <div className={styles.pageWrapper}>
      <Payments theme={resolvedTheme === 'dark' ? 'dark' : 'light'} />
    </div>
  );
};

export default PaymentsPage;
