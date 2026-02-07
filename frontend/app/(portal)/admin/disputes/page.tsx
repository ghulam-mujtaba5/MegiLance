// @AI-HINT: Admin page to list and manage disputes
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { FiLoader, FiEye, FiFilter } from 'react-icons/fi';

import Button from '@/app/components/Button/Button';
import Badge from '@/app/components/Badge/Badge';

import commonStyles from './AdminDisputes.common.module.css';
import lightStyles from './AdminDisputes.light.module.css';
import darkStyles from './AdminDisputes.dark.module.css';

interface Dispute {
  id: number;
  title: string;
  description: string;
  status: string;
  contract_id: number;
  raised_by_id: number;
  created_at: string;
  updated_at: string;
  resolution?: string;
  resolved_at?: string;
  resolved_by_id?: number;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open': return 'danger';
    case 'in_progress': return 'warning';
    case 'resolved': return 'success';
    case 'closed': return 'secondary';
    default: return 'info';
  }
};

const AdminDisputesPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: any = {};
      if (filterStatus !== 'all') {
        filters.status = filterStatus;
      }
      const data = await api.disputes.list(filters) as any;
      // Handle pagination response if necessary, assuming array for now or extracting items
      setDisputes(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      console.error('Failed to fetch disputes:', err);
      setError('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleViewDispute = (id: number) => {
    router.push(`/portal/admin/disputes/${id}`);
  };

  if (!resolvedTheme) return null;

  return (
    <div className={cn(styles.container, styles[resolvedTheme])}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dispute Management</h1>
        <Button variant="primary" onClick={fetchDisputes}>
          Refresh
        </Button>
      </header>

      <div className={styles.filters}>
        <Button 
          variant={filterStatus === 'all' ? 'primary' : 'outline'} 
          size="sm" 
          onClick={() => setFilterStatus('all')}
        >
          All
        </Button>
        <Button 
          variant={filterStatus === 'open' ? 'primary' : 'outline'} 
          size="sm" 
          onClick={() => setFilterStatus('open')}
        >
          Open
        </Button>
        <Button 
          variant={filterStatus === 'in_progress' ? 'primary' : 'outline'} 
          size="sm" 
          onClick={() => setFilterStatus('in_progress')}
        >
          In Progress
        </Button>
        <Button 
          variant={filterStatus === 'resolved' ? 'primary' : 'outline'} 
          size="sm" 
          onClick={() => setFilterStatus('resolved')}
        >
          Resolved
        </Button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <FiLoader className={styles.spinner} />
          <p>Loading disputes...</p>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <p>{error}</p>
          <Button variant="secondary" onClick={fetchDisputes}>Try Again</Button>
        </div>
      ) : disputes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No disputes found matching the selected filter.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Contract ID</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((dispute) => (
                <tr key={dispute.id}>
                  <td>#{dispute.id}</td>
                  <td>{dispute.title}</td>
                  <td>#{dispute.contract_id}</td>
                  <td>
                    <Badge variant={getStatusBadgeVariant(dispute.status)}>
                      {dispute.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td>{new Date(dispute.created_at).toLocaleDateString()}</td>
                  <td className={styles.actions}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleViewDispute(dispute.id)}
                      title="View Details"
                    >
                      <FiEye /> View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDisputesPage;
