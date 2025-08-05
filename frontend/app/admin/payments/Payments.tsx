// @AI-HINT: This is the Payments Management page for admins to view all platform transactions. All styles are per-component only.
'use client';

import React, { useState, useEffect } from 'react';
import Input from '@/app/components/Input/Input';
import commonStyles from './Payments.common.module.css';
import lightStyles from './Payments.light.module.css';
import darkStyles from './Payments.dark.module.css';
import { useTheme } from '@/app/contexts/ThemeContext';

// @AI-HINT: This is the Payments Management page for admins to view all platform transactions. All styles are per-component only. Now fully theme-switchable using global theme context.

interface Payment {
  id: string;
  date: string;
  type: string;
  from: string;
  to: string;
  amount: number;
  status: string;
}

const Payments: React.FC = () => {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/payments');
        if (!response.ok) {
          throw new Error('Failed to fetch payments');
        }
        const data: Payment[] = await response.json();
        setPayments(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  if (loading) {
    return <div className={`Payments-status Payments-status--${theme}`}>Loading payments...</div>;
  }

  if (error) {
    return <div className={`Payments-status Payments-status--error Payments-status--${theme}`}>Error: {error}</div>;
  }

  return (
    <div className={`Payments Payments--${theme}`}>
      <header className="Payments-header">
        <h1>Payments & Transactions</h1>
        <div className="Payments-actions">
          <Input type="search" placeholder="Search by user or transaction ID..." />
        </div>
      </header>

      <div className={`Payments-table-container Payments-table-container--${theme}`}>
        <table className="Payments-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Date</th>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id}>
                <td>{payment.id}</td>
                <td>{payment.date}</td>
                <td>{payment.type}</td>
                <td>{payment.from}</td>
                <td>{payment.to}</td>
                <td>${payment.amount.toLocaleString()}</td>
                <td>
                  <span className={`status-badge status-badge--${payment.status.toLowerCase()}`}>{payment.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;
