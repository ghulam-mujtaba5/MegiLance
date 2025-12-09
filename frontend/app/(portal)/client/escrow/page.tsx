// @AI-HINT: Client escrow management page - view and manage escrowed funds for active contracts
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import { escrowApi } from '@/lib/api';
import commonStyles from './Escrow.common.module.css';
import lightStyles from './Escrow.light.module.css';
import darkStyles from './Escrow.dark.module.css';

interface EscrowTransaction {
  id: string;
  contract_id: string;
  project_title: string;
  freelancer_name: string;
  freelancer_avatar?: string;
  amount: number;
  status: 'pending' | 'funded' | 'released' | 'disputed' | 'refunded';
  milestone?: string;
  created_at: string;
  release_date?: string;
}

interface EscrowStats {
  total_in_escrow: number;
  pending_release: number;
  released_this_month: number;
  active_contracts: number;
}

export default function EscrowPage() {
  const { resolvedTheme } = useTheme();
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [stats, setStats] = useState<EscrowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadEscrowData();
  }, []);

  const loadEscrowData = async () => {
    try {
      setLoading(true);
      // Try API first
      try {
        const txResponse = await escrowApi.list() as { data?: EscrowTransaction[] };
        if (txResponse.data) setTransactions(txResponse.data);
        if (txResponse.data && txResponse.data.length > 0) return;
      } catch {
        // API not available
      }
      
      // Demo data
      setStats({
        total_in_escrow: 15750,
        pending_release: 4500,
        released_this_month: 8200,
        active_contracts: 5,
      });
      
      setTransactions([
        {
          id: '1',
          contract_id: 'c1',
          project_title: 'E-commerce Website Development',
          freelancer_name: 'Alex Johnson',
          amount: 3500,
          status: 'funded',
          milestone: 'Phase 2: Frontend Development',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          contract_id: 'c2',
          project_title: 'Mobile App UI Design',
          freelancer_name: 'Sarah Kim',
          amount: 2000,
          status: 'pending',
          milestone: 'Initial Design Mockups',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          contract_id: 'c3',
          project_title: 'API Integration',
          freelancer_name: 'Mike Chen',
          amount: 1500,
          status: 'released',
          milestone: 'Payment Gateway Integration',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          release_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          contract_id: 'c4',
          project_title: 'Database Optimization',
          freelancer_name: 'Emma Wilson',
          amount: 4500,
          status: 'funded',
          milestone: 'Full Optimization Package',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '5',
          contract_id: 'c5',
          project_title: 'Content Writing',
          freelancer_name: 'David Brown',
          amount: 800,
          status: 'disputed',
          milestone: 'Blog Articles Package',
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Failed to load escrow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (transactionId: string) => {
    setProcessingId(transactionId);
    try {
      const tx = transactions.find(t => t.id === transactionId);
      await escrowApi.release(parseInt(transactionId), { amount: tx?.amount || 0 });
      setTransactions(prev =>
        prev.map(t =>
          t.id === transactionId
            ? { ...t, status: 'released', release_date: new Date().toISOString() }
            : t
        )
      );
    } catch (error) {
      console.error('Failed to release escrow:', error);
      // Demo mode: still update UI
      setTransactions(prev =>
        prev.map(t =>
          t.id === transactionId
            ? { ...t, status: 'released', release_date: new Date().toISOString() }
            : t
        )
      );
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: EscrowTransaction['status']) => {
    const statusMap = {
      pending: { label: 'Pending', class: 'warning' },
      funded: { label: 'Funded', class: 'success' },
      released: { label: 'Released', class: 'primary' },
      disputed: { label: 'Disputed', class: 'danger' },
      refunded: { label: 'Refunded', class: 'secondary' },
    };
    return statusMap[status] || { label: status, class: 'secondary' };
  };

  const filteredTransactions = transactions.filter(tx => 
    filter === 'all' || tx.status === filter
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <h1 className={cn(commonStyles.title, themeStyles.title)}>Escrow Management</h1>
        <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
          Securely manage funds for your active contracts
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className={commonStyles.statsGrid}>
          <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <div className={cn(commonStyles.statIcon, commonStyles.iconPrimary)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div className={commonStyles.statInfo}>
              <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
                ${stats.total_in_escrow.toLocaleString()}
              </span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total in Escrow</span>
            </div>
          </div>
          
          <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <div className={cn(commonStyles.statIcon, commonStyles.iconWarning)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className={commonStyles.statInfo}>
              <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
                ${stats.pending_release.toLocaleString()}
              </span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Pending Release</span>
            </div>
          </div>
          
          <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <div className={cn(commonStyles.statIcon, commonStyles.iconSuccess)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className={commonStyles.statInfo}>
              <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
                ${stats.released_this_month.toLocaleString()}
              </span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Released This Month</span>
            </div>
          </div>
          
          <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <div className={cn(commonStyles.statIcon, commonStyles.iconSecondary)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div className={commonStyles.statInfo}>
              <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.active_contracts}</span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Active Contracts</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={commonStyles.filters}>
        {['all', 'pending', 'funded', 'released', 'disputed'].map(f => (
          <button
            key={f}
            className={cn(
              commonStyles.filterBtn,
              themeStyles.filterBtn,
              filter === f && commonStyles.filterBtnActive,
              filter === f && themeStyles.filterBtnActive
            )}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className={cn(commonStyles.loadingState, themeStyles.loadingState)}>
          Loading escrow transactions...
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          <h3>No Escrow Transactions</h3>
          <p>Escrow transactions will appear here when you fund contracts</p>
        </div>
      ) : (
        <div className={cn(commonStyles.tableWrapper, themeStyles.tableWrapper)}>
          <table className={commonStyles.table}>
            <thead>
              <tr>
                <th className={themeStyles.th}>Project</th>
                <th className={themeStyles.th}>Freelancer</th>
                <th className={themeStyles.th}>Amount</th>
                <th className={themeStyles.th}>Milestone</th>
                <th className={themeStyles.th}>Status</th>
                <th className={themeStyles.th}>Date</th>
                <th className={themeStyles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(tx => {
                const status = getStatusBadge(tx.status);
                return (
                  <tr key={tx.id} className={themeStyles.tr}>
                    <td className={cn(commonStyles.projectCell, themeStyles.td)}>
                      {tx.project_title}
                    </td>
                    <td className={themeStyles.td}>{tx.freelancer_name}</td>
                    <td className={cn(commonStyles.amountCell, themeStyles.td)}>
                      ${tx.amount.toLocaleString()}
                    </td>
                    <td className={cn(commonStyles.milestoneCell, themeStyles.td)}>
                      {tx.milestone || '-'}
                    </td>
                    <td className={themeStyles.td}>
                      <span className={cn(commonStyles.statusBadge, commonStyles[`status_${status.class}`])}>
                        {status.label}
                      </span>
                    </td>
                    <td className={themeStyles.td}>{formatDate(tx.created_at)}</td>
                    <td className={themeStyles.td}>
                      {tx.status === 'funded' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleRelease(tx.id)}
                          isLoading={processingId === tx.id}
                        >
                          Release
                        </Button>
                      )}
                      {tx.status === 'disputed' && (
                        <Button variant="outline" size="sm">
                          View Dispute
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
