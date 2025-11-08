// @AI-HINT: This is the modernized Freelancer Proposals page. It uses a clean, card-based grid to display proposals and features advanced filtering and sorting capabilities.
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { usePersistedState } from '@/app/lib/hooks/usePersistedState';
import { useToaster } from '@/app/components/Toast/ToasterProvider';

import DataToolbar, { SortOption } from '@/app/components/DataToolbar/DataToolbar';
import PaginationBar from '@/app/components/PaginationBar/PaginationBar';
import Modal from '@/app/components/Modal/Modal';
import Button from '@/app/components/Button/Button';
import TableSkeleton from '@/app/components/DataTableExtras/TableSkeleton';
import ProposalCard, { Proposal } from './components/ProposalCard/ProposalCard';
import StatusFilter from './components/StatusFilter/StatusFilter';

import commonStyles from './Proposals.common.module.css';
import lightStyles from './Proposals.light.module.css';
import darkStyles from './Proposals.dark.module.css';

// Mock data for UI development
const mockProposals: Proposal[] = [
  { id: 'p1', jobTitle: 'Build Premium Marketing Website', clientName: 'Acme Corp', status: 'Submitted', dateSubmitted: '2025-08-01', bidAmount: 2500 },
  { id: 'p2', jobTitle: 'AI-Powered Content Generation Platform', clientName: 'ContentAI', status: 'Interview', dateSubmitted: '2025-08-04', bidAmount: 5200 },
  { id: 'p3', jobTitle: 'Modernize SaaS Dashboard UI/UX', clientName: 'DataViz Ltd', status: 'Rejected', dateSubmitted: '2025-07-26', bidAmount: 1800 },
  { id: 'p4', jobTitle: 'Cross-Platform Mobile App MVP', clientName: 'StartHub', status: 'Draft', dateSubmitted: '2025-08-08', bidAmount: 8000 },
  { id: 'p5', jobTitle: 'E-commerce Backend with Stripe Integration', clientName: 'Shopify Plus Experts', status: 'Submitted', dateSubmitted: '2025-08-10', bidAmount: 12500 },
  { id: 'p6', jobTitle: 'Cloud Data Warehouse Migration', clientName: 'Innovate Inc.', status: 'Submitted', dateSubmitted: '2025-08-11', bidAmount: 9500 },
];

const sortOptions: SortOption[] = [
  { value: 'dateSubmitted:desc', label: 'Newest' },
  { value: 'dateSubmitted:asc', label: 'Oldest' },
  { value: 'bidAmount:desc', label: 'Bid: High to Low' },
  { value: 'bidAmount:asc', label: 'Bid: Low to High' },
  { value: 'jobTitle:asc', label: 'Job Title A-Z' },
  { value: 'jobTitle:desc', label: 'Job Title Z-A' },
];

const allStatuses: Proposal['status'][] = ['Draft', 'Submitted', 'Interview', 'Rejected'];

const ProposalsPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const toaster = useToaster();

  const [q, setQ] = usePersistedState<string>('freelancer:proposals:q', '');
  const [sortKey, setSortKey] = usePersistedState<keyof Proposal>('freelancer:proposals:sortKey', 'dateSubmitted');
  const [sortDir, setSortDir] = usePersistedState<'asc' | 'desc'>('freelancer:proposals:sortDir', 'desc');
  const [page, setPage] = usePersistedState<number>('freelancer:proposals:page', 1);
  const [pageSize, setPageSize] = usePersistedState<number>('freelancer:proposals:pageSize', 6);
  const [statusFilters, setStatusFilters] = usePersistedState<Proposal['status'][]>('freelancer:proposals:statusFilters', []);
  const [loading, setLoading] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [pendingWithdrawId, setPendingWithdrawId] = useState<string | null>(null);

  // Filtering and Sorting Logic
  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    const byQuery = (p: Proposal) => !qLower || p.jobTitle.toLowerCase().includes(qLower) || p.clientName.toLowerCase().includes(qLower);
    const byStatus = (p: Proposal) => statusFilters.length === 0 || statusFilters.includes(p.status);
    return mockProposals.filter(byQuery).filter(byStatus);
  }, [q, statusFilters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageSafe, pageSize]);

  // UI Loading Simulation
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(timer);
  }, [q, sortKey, sortDir, page, pageSize, statusFilters]);

  // Action Handlers
  const handleWithdraw = (id: string) => {
    setPendingWithdrawId(id);
    setWithdrawOpen(true);
  };

  const confirmWithdraw = () => {
    if (pendingWithdrawId) {
      toaster.notify({ title: 'Success', description: 'Proposal successfully withdrawn.', variant: 'success' });
      setWithdrawOpen(false);
      setPendingWithdrawId(null);
      // In a real app, you would re-fetch or mutate data here.
    }
  };

  const handleView = (id: string) => toaster.notify({ description: `Viewing proposal ${id}`, variant: 'info' });
  const handleEdit = (id: string) => toaster.notify({ description: `Editing proposal ${id}`, variant: 'info' });

  return (
    <div className={cn(commonStyles.container, styles.container)}>
      <header className={cn(commonStyles.header, styles.header)}>
        <h1 className={cn(commonStyles.title, styles.title)}>My Proposals</h1>
        <p className={cn(commonStyles.subtitle, styles.subtitle)}>Track and manage all your job proposals from a centralized dashboard.</p>
      </header>

      <div className={cn(commonStyles.toolbarContainer, styles.toolbarContainer)}>
        <DataToolbar
          query={q}
          onQueryChange={(val) => { setQ(val); setPage(1); }}
          sortValue={`${sortKey}:${sortDir}`}
          onSortChange={(val) => {
            const [k, d] = val.split(':') as [keyof Proposal, 'asc' | 'desc'];
            setSortKey(k); setSortDir(d); setPage(1);
          }}
          pageSize={pageSize}
          onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
          sortOptions={sortOptions}
          searchPlaceholder="Search by job or client..."
        />
      </div>

      <div className={cn(commonStyles.filterContainer, styles.filterContainer)}>
        <StatusFilter
          allStatuses={allStatuses}
          selectedStatuses={statusFilters}
          onChange={(selected) => { setStatusFilters(selected); setPage(1); }}
        />
      </div>

      {loading ? (
        <div className={cn(commonStyles.grid, styles.grid)}>
            <TableSkeleton rows={pageSize} cols={1} useCards />
        </div>
      ) : sorted.length > 0 ? (
        <div className={cn(commonStyles.grid, styles.grid)}>
          {paged.map(proposal => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onView={handleView}
              onEdit={handleEdit}
              onWithdraw={handleWithdraw}
            />
          ))}
        </div>
      ) : (
        <div className={cn(commonStyles.emptyState, styles.emptyState)}>
          <h3 className={cn(commonStyles.emptyTitle, styles.emptyTitle)}>No Proposals Found</h3>
          <p className={cn(commonStyles.emptyText, styles.emptyText)}>Your search or filter criteria did not match any proposals.</p>
          <Button variant="secondary" onClick={() => { setQ(''); setStatusFilters([]); }}>Clear All Filters</Button>
        </div>
      )}

      {sorted.length > 0 && (
        <PaginationBar
          currentPage={pageSafe}
          totalPages={totalPages}
          totalResults={sorted.length}
          onPrev={() => setPage(p => Math.max(1, p - 1))}
          onNext={() => setPage(p => Math.min(totalPages, p + 1))}
        />
      )}

      <Modal isOpen={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Withdraw Proposal" size="small">
        <p className={cn(commonStyles.modalText, styles.modalText)}>Are you sure you want to withdraw this proposal? This action cannot be undone.</p>
        <div className={cn(commonStyles.modalActions, styles.modalActions)}>
          <Button variant="secondary" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmWithdraw}>Confirm Withdraw</Button>
        </div>
      </Modal>
    </div>
  );
};

export default ProposalsPage;
