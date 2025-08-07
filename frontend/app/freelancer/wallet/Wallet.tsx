// @AI-HINT: This is the Wallet page for freelancers to manage their earnings and transactions. It is now fully theme-aware and features a premium, investor-grade design.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import TransactionRow from '@/app/components/TransactionRow/TransactionRow';
import Button from '@/app/components/Button/Button';
import commonStyles from './Wallet.common.module.css';
import lightStyles from './Wallet.light.module.css';
import darkStyles from './Wallet.dark.module.css';

const Wallet: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  // Mock data for wallet
  const balance = 1234.56;
  const transactions = [
    { type: 'payment', amount: '500', date: '2025-08-03', description: 'Milestone 1 for Project X' },
    { type: 'withdrawal', amount: '-200', date: '2025-08-01', description: 'Withdrawal to bank' },
    { type: 'payment', amount: '750', date: '2025-07-28', description: 'Final payment for Project Y' },
    { type: 'fee', amount: '-75', date: '2025-07-28', description: 'Platform fee for Project Y' },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Wallet</h1>
        <p className={styles.subtitle}>View your balance, transactions, and manage withdrawals.</p>
      </header>

      <div className={styles.contentGrid}>
        <div className={styles.balanceCard}>
          <h2 className={styles.cardTitle}>Available Balance</h2>
          <p className={styles.balanceAmount}>${balance.toLocaleString()}</p>
          <Button variant="primary" size="large">Withdraw Funds</Button>
        </div>

        <section className={styles.transactionsCard}>
          <h2 className={styles.cardTitle}>Transaction History</h2>
          <div className={styles.transactionList}>
            {transactions.map((tx, index) => (
              <TransactionRow key={index} {...tx} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Wallet;
