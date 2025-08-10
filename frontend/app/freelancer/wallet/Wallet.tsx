// @AI-HINT: This is the Wallet page for freelancers to manage their earnings and transactions. It is now fully theme-aware and features a premium, investor-grade design.
'use client';

import React, { useMemo, useState } from 'react';
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
    return parseFloat(balanceStr) ?? 0;
  }, [analytics?.walletBalance]);

  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState<'date' | 'amount' | 'type'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  interface TxRow {
    id: string;
    type: string;
    amount: string;
    date: string;
    description: string;
  }

  const transactionRows: TxRow[] = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    return transactions.map((txn, idx) => ({
      id: String(txn.id ?? idx),
      type: txn.type?.toLowerCase() ?? 'payment',
      amount: txn.amount ?? '0',
      date: txn.date ?? '',
      description: txn.description ?? 'Unknown transaction',
    }));
  }, [transactions]);

  const filtered = useMemo(() => {
    const lowerCaseQ = q.toLowerCase();
    return transactionRows.filter((tx) => {
      return tx.type.includes(lowerCaseQ) || tx.description.includes(lowerCaseQ);
    });
  }, [transactionRows, q]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const sortFn = (a: TxRow, b: TxRow) => {
      if (sortKey === 'date') {
        const av = new Date(a.date).getTime();
        const bv = new Date(b.date).getTime();
        return sortDir === 'asc' ? av - bv : bv - av;
      } else if (sortKey === 'amount') {
        const av = parseFloat(a.amount);
        const bv = parseFloat(b.amount);
        return sortDir === 'asc' ? av - bv : bv - av;
      } else {
        return sortDir === 'asc' ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type);
      }
    };
    list.sort(sortFn);
    return list;
  }, [filtered, sortKey, sortDir]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sorted.slice(start, end);
  }, [sorted, page, pageSize]);

  const totalPages = useMemo(() => {
    const t = Math.ceil(sorted.length / pageSize);
    return Math.max(1, t);
  }, [sorted, pageSize]);

  const pageSafe = useMemo(() => {
    return Math.min(Math.max(1, page), totalPages);
  }, [page, totalPages]);

  const exportCSV = () => {
    const csvContent = sorted.map((tx) => {
      return `${tx.type},${tx.amount},${tx.date},${tx.description}`;
    }).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'transactions.csv';
    link.click();
  };

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
          <Button variant="primary" size="large" disabled={balance <= 0} aria-disabled={balance <= 0}>Withdraw Funds</Button>
        </div>

        <section className={styles.transactionsCard}>
          <h2 className={styles.cardTitle}>Transaction History</h2>
          {/* Toolbar: search, sort, CSV, page size */}
          <div className={styles.toolbar} role="group" aria-label="Transactions filters and actions">
            <label htmlFor="txn-search" className={styles.srOnly}>Search transactions</label>
            <input
              id="txn-search"
              className={styles.input}
              type="search"
              placeholder="Search by type or description"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />

            <label htmlFor="txn-sort" className={styles.srOnly}>Sort transactions</label>
            <select
              id="txn-sort"
              className={styles.select}
              value={`${sortKey}:${sortDir}`}
              onChange={(e) => {
                const [k, d] = e.target.value.split(':') as [typeof sortKey, typeof sortDir];
                setSortKey(k);
                setSortDir(d);
                setPage(1);
              }}
              aria-label="Sort transactions"
            >
              <option value="date:desc">Newest</option>
              <option value="date:asc">Oldest</option>
              <option value="amount:desc">Amount High–Low</option>
              <option value="amount:asc">Amount Low–High</option>
              <option value="type:asc">Type A–Z</option>
              <option value="type:desc">Type Z–A</option>
            </select>

            <button type="button" className={styles.button} onClick={exportCSV} aria-label="Export transactions to CSV">Export CSV</button>

            <label htmlFor="txn-page-size" className={styles.srOnly}>Transactions per page</label>
            <select
              id="txn-page-size"
              className={styles.select}
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              aria-label="Results per page"
            >
              {[10, 20, 50].map(sz => <option key={sz} value={sz}>{sz}/page</option>)}
            </select>
          </div>

          <div className={styles.transactionList}>
            {paged.map((tx) => (
              <TransactionRow key={tx.id} {...tx} />
            ))}
            {sorted.length === 0 && !loading && (
              <div className={styles.emptyState} role="status" aria-live="polite">No transactions found.</div>
            )}
          </div>

          {sorted.length > 0 && (
            <div className={styles.paginationBar} role="navigation" aria-label="Transactions pagination">
              <button
                type="button"
                className={styles.button}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pageSafe === 1}
                aria-label="Previous page"
              >
                Prev
              </button>
              <span className={styles.paginationInfo} aria-live="polite">Page {pageSafe} of {totalPages} · {sorted.length} result(s)</span>
              <button
                type="button"
                className={styles.button}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={pageSafe === totalPages}
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Wallet;
