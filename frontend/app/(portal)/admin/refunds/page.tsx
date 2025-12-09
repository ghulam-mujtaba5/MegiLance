// @AI-HINT: Admin Refunds management page
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import Loading from '@/app/components/Loading/Loading';
import { refundsApi } from '@/lib/api';
import { RotateCcw, Check, X, Eye, Clock, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';

import commonStyles from './Refunds.common.module.css';
import lightStyles from './Refunds.light.module.css';
import darkStyles from './Refunds.dark.module.css';

interface Refund { id: string; user_name: string; amount: number; reason: string; status: string; created_at: string; contract_id?: string; }

export default function AdminRefundsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        setLoading(true);
        const response = await refundsApi.list(filter === 'all' ? undefined : filter);
        const refundsList = Array.isArray(response) ? response : (response as any).refunds || [];
        setRefunds(refundsList.map((r: any) => ({ id: r.id?.toString(), user_name: r.user_name || r.requester_name || 'User', amount: r.amount || 0, reason: r.reason || '', status: r.status || 'pending', created_at: r.created_at || new Date().toISOString(), contract_id: r.contract_id })));
      } catch (err) { console.error('Failed to fetch refunds:', err); } 
      finally { setLoading(false); }
    };
    if (mounted) fetchRefunds();
  }, [mounted, filter]);

  const handleApprove = async (id: string) => {
    try { await refundsApi.approve(parseInt(id)); setRefunds(refunds.map(r => r.id === id ? { ...r, status: 'approved' } : r)); } catch (err) { console.error('Failed to approve:', err); }
  };

  const handleReject = async (id: string) => {
    try { await refundsApi.reject(parseInt(id), 'Rejected by admin'); setRefunds(refunds.map(r => r.id === id ? { ...r, status: 'rejected' } : r)); } catch (err) { console.error('Failed to reject:', err); }
  };

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'warning', icon: <Clock size={14} /> },
      approved: { color: 'success', icon: <CheckCircle size={14} /> },
      rejected: { color: 'danger', icon: <AlertCircle size={14} /> },
      processed: { color: 'primary', icon: <Check size={14} /> },
    };
    const c = config[status] || config.pending;
    return <span className={cn(commonStyles.statusBadge, commonStyles[`status${c.color}`])}>{c.icon}{status}</span>;
  };

  if (!mounted) return <Loading />;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Refund Requests</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>Review and process refund requests</p>
        </div>
      </div>

      <div className={commonStyles.filters}>
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} className={cn(commonStyles.filterBtn, filter === f && commonStyles.filterBtnActive, themeStyles.filterBtn)} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : (
        <div className={cn(commonStyles.tableWrapper, themeStyles.tableWrapper)}>
          <table className={commonStyles.table}>
            <thead><tr><th>User</th><th>Amount</th><th>Reason</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {refunds.map(refund => (
                <tr key={refund.id} className={themeStyles.tableRow}>
                  <td>{refund.user_name}</td>
                  <td className={commonStyles.amount}><DollarSign size={14} />{refund.amount}</td>
                  <td className={commonStyles.reason}>{refund.reason}</td>
                  <td>{getStatusBadge(refund.status)}</td>
                  <td>{new Date(refund.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className={commonStyles.actions}>
                      <Button variant="ghost" size="sm"><Eye size={14} /></Button>
                      {refund.status === 'pending' && (
                        <>
                          <Button variant="success" size="sm" onClick={() => handleApprove(refund.id)}><Check size={14} /></Button>
                          <Button variant="danger" size="sm" onClick={() => handleReject(refund.id)}><X size={14} /></Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
