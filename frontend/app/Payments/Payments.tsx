// @AI-HINT: Payments page placeholder - displays payment history and wallet info
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Wallet, CreditCard, History, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const Payments: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const mockTransactions = [
    { id: 1, type: 'credit', amount: 500, desc: 'Project Payment - Web App', date: '2024-12-05' },
    { id: 2, type: 'debit', amount: 50, desc: 'Platform Fee', date: '2024-12-05' },
    { id: 3, type: 'credit', amount: 1200, desc: 'Milestone Complete - API Dev', date: '2024-12-01' },
    { id: 4, type: 'debit', amount: 100, desc: 'Withdrawal to Bank', date: '2024-11-28' },
  ];

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
            <p className="text-3xl font-bold text-white mt-1">$2,450.00</p>
          </div>
          <div className={`p-6 rounded-xl ${resolvedTheme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
            <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Pending</p>
            <p className={`text-2xl font-bold mt-1 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>$800.00</p>
          </div>
          <div className={`p-6 rounded-xl ${resolvedTheme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
            <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Earned</p>
            <p className={`text-2xl font-bold mt-1 ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>$12,350.00</p>
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
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {mockTransactions.map((tx) => (
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
        </div>
      </div>
    </div>
  );
};

export default Payments;
