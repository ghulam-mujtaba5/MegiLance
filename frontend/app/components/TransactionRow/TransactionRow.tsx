// @AI-HINT: This is the refactored TransactionRow component, using premium, theme-aware styles and the useMemo hook for a polished and efficient implementation.
import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './TransactionRow.common.module.css';
import lightStyles from './TransactionRow.light.module.css';
import darkStyles from './TransactionRow.dark.module.css';

export interface TransactionRowProps {
  date: string;
  description: string;
  amount: string | number;
  isPositive?: boolean;
}

const TransactionRow: React.FC<TransactionRowProps> = ({ date, description, amount }) => {
  const { theme } = useTheme();

  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  const isPositive = typeof amount === 'number' ? amount >= 0 : !amount.startsWith('-');
  const formattedAmount = typeof amount === 'number' 
    ? `${amount >= 0 ? '+' : ''}${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)}`
    : `${!amount.startsWith('-') ? '+' : ''}${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(amount))}`;

  return (
    <div className={styles.row}>
      <span className={styles.date}>{date}</span>
      <span className={styles.description}>{description}</span>
      <span className={cn(styles.amount, isPositive ? styles.positive : styles.negative)}>
        {formattedAmount}
      </span>
    </div>
  );
};

export default TransactionRow;
