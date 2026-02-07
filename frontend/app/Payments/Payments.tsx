// @AI-HINT: Payments page - displays real payment history and wallet balance from API
// Production-ready: No mock data, connects to /backend/api/wallet and /backend/api/payments
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Wallet, CreditCard, History, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { getAuthToken } from '@/lib/api';

interface Transaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  desc: string;
  date: string;
}

interface WalletBalance {
  available: number;
  pending: number;
  total: number;
}

// API helper
async function fetchApi<T>(endpoint: string): Promise<T | null> {
  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  try {
    const res = await fetch(`/backend/api${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const Payments: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<WalletBalance>({ available: 0, pending: 0, total: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch wallet balance
      const walletData = await fetchApi<any>('/wallet/balance');
      if (walletData) {
        setBalance({
          available: walletData.available || 0,
          pending: walletData.pending || 0,
          total: (walletData.available || 0) + (walletData.pending || 0) + (walletData.escrow || 0),
        });
      }

      // Fetch wallet transactions
      const txData = await fetchApi<any[]>('/wallet/transactions?limit=20');
      if (txData && Array.isArray(txData)) {
        const mapped: Transaction[] = txData.map((tx: any) => ({
          id: tx.id,
          type: ['deposit', 'escrow_release', 'milestone_payment', 'bonus', 'refund'].includes(tx.type) ? 'credit' : 'debit',
          amount: Math.abs(tx.amount || 0),
          desc: tx.description || `${tx.type} transaction`,
          date: tx.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        }));
        setTransactions(mapped);
      }
    } catch (err) {
      console.error('[Payments] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    setMounted(true);
    loadData();
  }, [loadData]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: resolvedTheme === 'dark' ? '#0f172a' : '#f8fafc' }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Wallet size={28} className={resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'} />
          <h1 className={`text-2xl md:text-3xl font-bold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Payments
          </h1>
        </div>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className={`p-6 rounded-xl ${resolvedTheme === 'dark' ? 'bg-gradient-to-br from-primary-600 to-primary-800' : 'bg-gradient-to-br from-primary-500 to-primary-700'}`}>
            <p className="text-white/80 text-sm">Available Balance</p>
            <p className="text-3xl font-bold text-white mt-1">${balance.available.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className={`p-6 rounded-xl ${resolvedTheme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
            <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Pending</p>
            <p className={`text-2xl font-bold mt-1 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>${balance.pending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className={`p-6 rounded-xl ${resolvedTheme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
            <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Balance</p>
            <p className={`text-2xl font-bold mt-1 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>${balance.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className={`rounded-xl overflow-hidden ${resolvedTheme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <History size={20} className={resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
              <h2 className={`font-semibold ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Recent Transactions</h2>
            </div>
          </div>
          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className={resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${tx.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {tx.type === 'credit' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <p className={`font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{tx.desc}</p>
                      <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{tx.date}</p>
                    </div>
                  </div>
                  <p className={`font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'credit' ? '+' : '-'}${tx.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payments;
