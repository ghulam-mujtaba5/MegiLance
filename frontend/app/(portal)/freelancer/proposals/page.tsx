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

import { api } from '@/lib/api';
import { ProposalData, ProposalErrors } from '../submit-proposal/SubmitProposal.types';

// ... existing imports ...

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

// ... existing code ...

  // Fetch proposals from API
  const fetchProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch proposals for current freelancer
      const apiProposals: APIProposal[] = await api.portal.freelancer.getProposals();
      
      // Transform API data to UI format
      const transformedProposals: Proposal[] = apiProposals.map((ap) => {
        return {
          id: String(ap.id),
          jobTitle: ap.job_title || `Project #${ap.project_id}`,
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

// ... existing code ...

  const confirmWithdraw = async () => {
    if (pendingWithdrawId) {
      try {
        // Use proposalsApi directly for delete as it's not in portal.freelancer yet, or add it
        // For now using raw fetch or adding to api.ts would be better. 
        // Let's assume we use api.proposals.delete (which doesn't exist in my previous read of api.ts, but api.proposals has reject/accept/update)
        // Actually api.ts has `proposalsApi` but no delete.
        // But `backend/app/api/v1/proposals.py` HAS delete.
        // I should add delete to api.ts proposalsApi.
        
        // For now I will use raw fetch but with api base url if possible, or just fetch.
        // But wait, I should use api.ts.
        // I'll check api.ts again.
        
        // api.ts proposalsApi has: list, create, get, update, accept, reject. NO DELETE.
        // I will add delete to api.ts proposalsApi first.
        
        await api.proposals.delete(parseInt(pendingWithdrawId));
        
        toaster.notify({ title: 'Success', description: 'Proposal successfully withdrawn.', variant: 'success' });
        // Refresh proposals list
        fetchProposals();
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
