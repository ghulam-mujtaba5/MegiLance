// @AI-HINT: Payments page using the Payments component with theme support.

'use client';

import React from 'react';
import Payments from './Payments';
import { useTheme } from 'next-themes';

const PaymentsPage: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <div style={{ padding: '2rem' }}>
      <Payments theme={theme === 'dark' ? 'dark' : 'light'} />
    </div>
  );
};

export default PaymentsPage;
