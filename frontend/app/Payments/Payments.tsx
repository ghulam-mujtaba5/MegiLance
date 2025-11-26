// @AI-HINT: This is the Payments page root component. Fetches from /payments API. All styles are per-component only.
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import TransactionRow from '@/app/components/TransactionRow/TransactionRow';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import commonStyles from './Payments.common.module.css';
import lightStyles from './Payments.light.module.css';
import darkStyles from './Payments.dark.module.css';

interface Transaction {
  date: string;
  description: string;
  amount: string;
  status: 'paid' | 'pending' | 'failed';
}

interface ApiPayment {
  id: number;
  contract_id: number | null;
  from_user_id: number;
  to_user_id: number;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  tx_hash: string | null;
  escrow_address: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

function formatAmount(amount: number, isIncoming: boolean): string {
  const formatted = `$${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return isIncoming ? `+${formatted}` : `-${formatted}`;
}

function mapApiStatusToStatus(apiStatus: string): 'paid' | 'pending' | 'failed' {
  switch (apiStatus.toLowerCase()) {
    case 'completed': return 'paid';
    case 'pending': return 'pending';
    case 'failed':
    case 'cancelled':
    case 'rejected':
      return 'failed';
    default: return 'pending';
  }
}

const Payments: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const styles = theme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    async function fetchPayments() {
      try {
        setLoading(true);
        
        // Fetch user and payments in parallel
        const [user, paymentsData] = await Promise.all([
          api.auth.me(),
          api.payments.list(50)
        ]);

        const payments: ApiPayment[] = Array.isArray(paymentsData) ? paymentsData : (paymentsData as any).items || [];
        const currentUserId = user.id;

        // Transform API payments to transaction format
        const transformed: Transaction[] = payments.map((payment) => {
          const isIncoming = currentUserId !== null && payment.to_user_id === currentUserId;
          return {
            date: payment.created_at.split('T')[0],
            description: payment.description || payment.payment_type || 'Payment',
            amount: formatAmount(payment.amount, isIncoming),
            status: mapApiStatusToStatus(payment.status),
          };
        });

        setTransactions(transformed);

        // Calculate balance from incoming payments
        const totalBalance = payments.reduce((acc, payment) => {
          const isIncoming = currentUserId !== null && payment.to_user_id === currentUserId;
          return isIncoming ? acc + payment.amount : acc - payment.amount;
        }, 0);
        setBalance(totalBalance);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, []);

  if (!resolvedTheme) return null;

  if (loading) {
    return (
      <div className={`${commonStyles.Payments} ${styles[`Payments--${theme}`]}`}>
        <div className={commonStyles['Payments-header']}>
          <h1>Payments & Transactions</h1>
        </div>
        <div className={commonStyles['Payments-loading']}>
          <Loader2 className={commonStyles.spinner} size={32} />
          <span>Loading payments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${commonStyles.Payments} ${styles[`Payments--${theme}`]}`}>
        <div className={commonStyles['Payments-header']}>
          <h1>Payments & Transactions</h1>
        </div>
        <div className={commonStyles['Payments-error']}>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${commonStyles.Payments} ${styles[`Payments--${theme}`]}`}>
      <div className={commonStyles['Payments-header']}>
        <h1>Payments & Transactions</h1>
      </div>
      <div className={commonStyles['Payments-content']}>
        <section className={commonStyles['Payments-summary']}>
          <h2>Account Balance</h2>
          <p className={commonStyles['Payments-balance']}>
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </section>
        <section className={commonStyles['Payments-history']}>
          <h2>Transaction History</h2>
          <div className={commonStyles['Payments-transactions-list']}>
            {transactions.length === 0 ? (
              <div className={commonStyles['Payments-empty']}>
                <span>No transactions yet</span>
              </div>
            ) : transactions.map((transaction, index) => (
              <TransactionRow
                key={index}
                date={transaction.date}
                description={transaction.description}
                amount={transaction.amount}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Payments;