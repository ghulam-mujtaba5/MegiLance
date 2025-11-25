// @AI-HINT: This is the modernized Freelancer Proposals page. It uses a clean, card-based grid to display proposals and features advanced filtering and sorting capabilities.
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

// API response type
interface APIProposal {
  id: number;
  project_id: number;
  freelancer_id: number;
  cover_letter: string;
  bid_amount: number;
  estimated_hours: number;
  hourly_rate: number;
  availability: string;
  attachments: string;
  status: string;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  job_title?: string;
  client_name?: string;
}

const sortOptions: SortOption[] = [
  { value: 'dateSubmitted:desc', label: 'Newest' },
  { value: 'dateSubmitted:asc', label: 'Oldest' },
  { value: 'bidAmount:desc', label: 'Bid: High to Low' },
  { value: 'bidAmount:asc', label: 'Bid: Low to High' },
  { value: 'jobTitle:asc', label: 'Job Title A-Z' },
  { value: 'jobTitle:desc', label: 'Job Title Z-A' },
];

const allStatuses: Proposal['status'][] = ['Draft', 'Submitted', 'Interview', 'Rejected'];

// Map API status to UI status
const mapAPIStatus = (status: string, isDraft: boolean): Proposal['status'] => {
  if (isDraft) return 'Draft';
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus === 'pending' || normalizedStatus === 'submitted') return 'Submitted';
  if (normalizedStatus === 'interview' || normalizedStatus === 'shortlisted') return 'Interview';
  if (normalizedStatus === 'rejected' || normalizedStatus === 'declined') return 'Rejected';
  return 'Submitted';
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [pendingWithdrawId, setPendingWithdrawId] = useState<string | null>(null);

  // Fetch proposals from API
  const fetchProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch proposals for current freelancer
      const proposalsRes = await fetch('/backend/api/proposals/', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });
      
      if (!proposalsRes.ok) {
        throw new Error('Failed to fetch proposals');
      }
      
      const apiProposals: APIProposal[] = await proposalsRes.json();
      
      // Transform API data to UI format
      const transformedProposals: Proposal[] = apiProposals.map((ap) => {
        return {
          id: String(ap.id),
          jobTitle: ap.job_title || Project #,
          clientName: ap.client_name || 'Client',
          status: mapAPIStatus(ap.status, ap.is_draft),
          dateSubmitted: ap.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          bidAmount: ap.bid_amount,
        };
      });
      
      setProposals(transformedProposals);
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
      setError(err instanceof Error ? err.message : 'Failed to load proposals');
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  // Filtering and Sorting Logic
  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    const byQuery = (p: Proposal) => !qLower || p.jobTitle.toLowerCase().includes(qLower) || p.clientName.toLowerCase().includes(qLower);
    const byStatus = (p: Proposal) => statusFilters.length === 0 || statusFilters.includes(p.status);
    return proposals.filter(byQuery).filter(byStatus);
  }, [q, statusFilters, proposals]);

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

  // Action Handlers
  const handleWithdraw = (id: string) => {
    setPendingWithdrawId(id);
    setWithdrawOpen(true);
  };

  const confirmWithdraw = async () => {
    if (pendingWithdrawId) {
      try {
        const res = await fetch(/backend/api/proposals/, {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Accept': 'application/json' },
        });
        
        if (res.ok) {
          toaster.notify({ title: 'Success', description: 'Proposal successfully withdrawn.', variant: 'success' });
          // Refresh proposals list
          fetchProposals();
        } else {
          toaster.notify({ title: 'Error', description: 'Failed to withdraw proposal.', variant: 'danger' });
        }
      } catch (err) {
        toaster.notify({ title: 'Error', description: 'Failed to withdraw proposal.', variant: 'danger' });
      }
      setWithdrawOpen(false);
      setPendingWithdrawId(null);
    }
  };

  const handleView = (id: string) => {
    window.location.href = /portal/freelancer/proposals/;
  };
  
  const handleEdit = (id: string) => {
    window.location.href = /portal/freelancer/proposals//edit;
  };

  if (!resolvedTheme) return null;

  return (
    <div className={cn(commonStyles.container, styles.container)}>
      <header className={cn(commonStyles.header, styles.header)}>
        <h1 className={cn(commonStyles.title, styles.title)}>My Proposals</h1>
        <p className={cn(commonStyles.subtitle, styles.subtitle)}>Track and manage all your job proposals from a centralized dashboard.</p>
      </header>

      {error ? (
        <div className={cn(commonStyles.emptyState, styles.emptyState)}>
          <h3 className={cn(commonStyles.emptyTitle, styles.emptyTitle)}>Error Loading Proposals</h3>
          <p className={cn(commonStyles.emptyText, styles.emptyText)}>{error}</p>
          <Button variant="primary" onClick={fetchProposals}>Try Again</Button>
        </div>
      ) : (
        <>
          <div className={cn(commonStyles.toolbarContainer, styles.toolbarContainer)}>
            <DataToolbar
              query={q}
              onQueryChange={(val) => { setQ(val); setPage(1); }}
              sortValue={${sortKey}:}
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
              <p className={cn(commonStyles.emptyText, styles.emptyText)}>
                {proposals.length === 0 
                  ? "You haven't submitted any proposals yet. Browse available jobs to get started!"
                  : "Your search or filter criteria did not match any proposals."}
              </p>
              {proposals.length === 0 ? (
                <Button variant="primary" onClick={() => window.location.href = '/jobs'}>Browse Jobs</Button>
              ) : (
                <Button variant="secondary" onClick={() => { setQ(''); setStatusFilters([]); }}>Clear All Filters</Button>
              )}
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
        </>
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
