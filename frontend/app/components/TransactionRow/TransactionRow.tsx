import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import commonStyles from './TransactionRow.common.module.css';
import lightStyles from './TransactionRow.light.module.css';
import darkStyles from './TransactionRow.dark.module.css';

// @AI-HINT: This component has been fully refactored to use theme-aware CSS modules.

export interface TransactionRowProps {
  date: string;
  description: string;
  amount: string;
}

const TransactionRow: React.FC<TransactionRowProps> = ({ date, description, amount }) => {
  const { theme } = useTheme();
  const styles = {
    ...commonStyles,
    ...(theme === 'dark' ? darkStyles : lightStyles),
  };

  return (
    <div className={`${styles.transactionRow} ${theme === 'dark' ? styles.transactionRowDark : styles.transactionRowLight}`}>
      <span className={styles.transactionRowDate}>{date}</span>
      <span className={styles.transactionRowDescription}>{description}</span>
      <span className={styles.transactionRowAmount}>{amount}</span>
    </div>
  );
};

export default TransactionRow;
