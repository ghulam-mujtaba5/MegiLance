// @AI-HINT: This is the Wallet page for freelancers to manage their earnings and transactions. It is now fully theme-aware and features a premium, investor-grade design.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import TransactionRow from '@/app/components/TransactionRow/TransactionRow';
import Button from '@/app/components/Button/Button';
import { useFreelancerData } from '@/hooks/useFreelancer';
import commonStyles from './Wallet.common.module.css';
import lightStyles from './Wallet.light.module.css';
import darkStyles from './Wallet.dark.module.css';

const Wallet: React.FC = () => {
  const { theme } = useTheme();
  const { analytics, transactions, loading, error } = useFreelancerData();
  
  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  const balance = useMemo(() => {
    if (!analytics?.walletBalance) return 0;
    const balanceStr = analytics.walletBalance.replace(/[$,]/g, '');
    return parseFloat(balanceStr) || 0;
  }, [analytics?.walletBalance]);

  const transactionRows = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    return transactions.map((txn, idx) => ({
      id: String(txn.id ?? idx),
      type: txn.type?.toLowerCase() ?? 'payment',
      amount: txn.amount ?? '0',
      date: txn.date ?? '',
      description: txn.description ?? 'Unknown transaction',
    }));
  }, [transactions]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Wallet</h1>
        <p className={styles.subtitle}>View your balance, transactions, and manage withdrawals.</p>
      </header>

      {loading && <div className={styles.loading} aria-busy="true">Loading wallet...</div>}
      {error && <div className={styles.error}>Failed to load wallet data.</div>}

      <div className={styles.contentGrid}>
        <div className={styles.balanceCard}>
          <h2 className={styles.cardTitle}>Available Balance</h2>
          <p className={styles.balanceAmount}>${balance.toLocaleString()}</p>
          <Button variant="primary" size="large">Withdraw Funds</Button>
        </div>

        <section className={styles.transactionsCard}>
          <h2 className={styles.cardTitle}>Transaction History</h2>
          <div className={styles.transactionList}>
            {transactionRows.map((tx) => (
              <TransactionRow key={tx.id} {...tx} />
            ))}
            {transactionRows.length === 0 && !loading && (
              <div className={styles.emptyState}>No transactions found.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Wallet;
