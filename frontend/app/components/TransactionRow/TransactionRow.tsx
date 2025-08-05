// @AI-HINT: This is the TransactionRow component for displaying a single transaction in payment history lists. All styles are per-component only. See TransactionRow.common.css, TransactionRow.light.css, and TransactionRow.dark.css for theming.
import React from "react";
import PaymentBadge from "../PaymentBadge/PaymentBadge";
import commonStyles from './TransactionRow.common.module.css';
import lightStyles from './TransactionRow.light.module.css';
import darkStyles from './TransactionRow.dark.module.css';

// @AI-HINT: This is the TransactionRow component for displaying a single transaction in payment history lists. All styles are per-component only. Now fully theme-switchable using global theme context.
import { useTheme } from '@/app/contexts/ThemeContext';

export interface TransactionRowProps {
  date: string;
  description: string;
  amount: string;
}

const TransactionRow: React.FC<TransactionRowProps> = ({ date, description, amount }) => {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={`${commonStyles.transactionRow} ${themeStyles.transactionRow}`}>
      <span className={commonStyles.date}>{date}</span>
      <span className={commonStyles.description}>{description}</span>
      <span className={commonStyles.amount}>{amount}</span>
    </div>
  );
};

export default TransactionRow;
