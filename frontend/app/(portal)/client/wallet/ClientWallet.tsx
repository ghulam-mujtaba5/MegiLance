// @AI-HINT: Client Wallet component. Theme-aware, accessible wallet with payment history and balance information.
'use client';

import React, { useMemo, useRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import { useClientData } from '@/hooks/useClient';
import TransactionRow from '@/app/components/TransactionRow/TransactionRow';
import common from './ClientWallet.common.module.css';
import light from './ClientWallet.light.module.css';
import dark from './ClientWallet.dark.module.css';

const ClientWallet: React.FC = () => {
  const { theme } = useTheme();
  const themed = theme === 'dark' ? dark : light;
  const { payments, loading, error } = useClientData();

  const headerRef = useRef<HTMLDivElement | null>(null);
  const balanceRef = useRef<HTMLDivElement | null>(null);
  const transactionsRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const balanceVisible = useIntersectionObserver(balanceRef, { threshold: 0.1 });
  const transactionsVisible = useIntersectionObserver(transactionsRef, { threshold: 0.1 });

  const walletStats = useMemo(() => {
    if (!Array.isArray(payments)) return { totalSpent: 0, pendingAmount: 0, completedPayments: 0 };
    
    const totalSpent = payments.reduce((sum, p) => {
      const amount = parseFloat(p.amount?.replace(/[$,]/g, '') || '0');
      return sum + amount;
    }, 0);
    
    const pendingAmount = payments
      .filter(p => p.status === 'Pending')
      .reduce((sum, p) => {
        const amount = parseFloat(p.amount?.replace(/[$,]/g, '') || '0');
        return sum + amount;
      }, 0);
    
    const completedPayments = payments.filter(p => p.status === 'Completed').length;
    
    return {
      totalSpent,
      pendingAmount,
      completedPayments,
    };
  }, [payments]);

  const recentTransactions = useMemo(() => {
    if (!Array.isArray(payments)) return [];
    return payments.slice(0, 10).map((p, idx) => ({
      id: String(p.id ?? idx),
      amount: p.amount ?? '0',
      date: p.date ?? '',
      description: p.description ?? 'Unknown transaction',
      status: p.status ?? 'Unknown',
    }));
  }, [payments]);

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <div ref={headerRef} className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}>
          <div>
            <h1 className={common.title}>Client Wallet</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Track your payment history and manage your spending.</p>
          </div>
        </div>

        {loading && <div className={common.loading} aria-busy="true">Loading wallet data...</div>}
        {error && <div className={common.error}>Failed to load wallet data.</div>}

        <div ref={balanceRef} className={cn(common.balanceSection, balanceVisible ? common.isVisible : common.isNotVisible)}>
          <div className={common.balanceGrid}>
            <div className={common.balanceCard}>
              <h3 className={common.balanceTitle}>Total Spent</h3>
              <p className={common.balanceAmount}>${walletStats.totalSpent.toLocaleString()}</p>
            </div>
            <div className={common.balanceCard}>
              <h3 className={common.balanceTitle}>Pending Payments</h3>
              <p className={common.balanceAmount}>${walletStats.pendingAmount.toLocaleString()}</p>
            </div>
            <div className={common.balanceCard}>
              <h3 className={common.balanceTitle}>Completed Payments</h3>
              <p className={common.balanceAmount}>{walletStats.completedPayments}</p>
            </div>
          </div>
        </div>

        <div ref={transactionsRef} className={cn(common.transactionsSection, transactionsVisible ? common.isVisible : common.isNotVisible)}>
          <section className={common.section}>
            <h2 className={common.sectionTitle}>Recent Transactions</h2>
            <div className={common.transactionList}>
              {recentTransactions.map(txn => (
                <TransactionRow
                  key={txn.id}
                  amount={txn.amount}
                  date={txn.date}
                  description={txn.description}
                />
              ))}
              {recentTransactions.length === 0 && !loading && (
                <div className={common.emptyState}>No transactions found.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default ClientWallet; 