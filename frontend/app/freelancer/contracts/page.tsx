// @AI-HINT: This page allows freelancers to view their smart contracts for ongoing and completed jobs, now with a premium, theme-aware, and accessible table layout.
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import Badge from '@/app/components/Badge/Badge';
import DataToolbar, { SortOption } from '@/app/components/DataToolbar/DataToolbar';
import PaginationBar from '@/app/components/PaginationBar/PaginationBar';
import { usePersistedState } from '@/app/lib/hooks/usePersistedState';
import { useColumnVisibility } from '@/app/lib/hooks/useColumnVisibility';
import { useSelection } from '@/app/lib/hooks/useSelection';
import { exportCSV } from '@/app/lib/csv';
import ColumnVisibilityMenu from '@/app/components/DataTableExtras/ColumnVisibilityMenu';
import DensityToggle, { Density } from '@/app/components/DataTableExtras/DensityToggle';
import SelectionBar from '@/app/components/DataTableExtras/SelectionBar';
import TableSkeleton from '@/app/components/DataTableExtras/TableSkeleton';
import commonStyles from './Contracts.common.module.css';
import lightStyles from './Contracts.light.module.css';
import darkStyles from './Contracts.dark.module.css';

// @AI-HINT: Mock data for contracts.
const mockContracts = [
  {
    id: 'contract_abc123',
    projectTitle: 'Build a Decentralized Exchange',
    clientName: 'DeFi Innovators Inc.',
    value: 5000, // USDC
    status: 'Active',
    contractAddress: '0x123...def',
  },
  {
    id: 'contract_def456',
    projectTitle: 'Create 3D NFT Avatars',
    clientName: 'Metaverse Creations',
    value: 2500,
    status: 'Completed',
    contractAddress: '0x456...abc',
  },
  {
    id: 'contract_ghi789',
    projectTitle: 'Audit a Smart Contract',
    clientName: 'SecureChain Labs',
    value: 1500,
    status: 'Disputed',
    contractAddress: '0x789...ghi',
  },
  {
    id: 'contract_jkl012',
    projectTitle: 'Develop a Web3 Wallet',
    clientName: 'Crypto Wallet Co.',
    value: 7500,
    status: 'Completed',
    contractAddress: '0x012...jkl',
  },
];

const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': return 'info';
    case 'completed': return 'success';
    case 'disputed': return 'danger';
    default: return 'secondary';
  }
};

const ContractsPage: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => {
    const themeStyles = theme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [theme]);

  const [query, setQuery] = usePersistedState<string>('freelancer:contracts:q', '');
  const [sortKey, setSortKey] = usePersistedState<'projectTitle' | 'clientName' | 'value' | 'status'>('freelancer:contracts:sortKey', 'projectTitle');
  const [sortDir, setSortDir] = usePersistedState<'asc' | 'desc'>('freelancer:contracts:sortDir', 'asc');
  const [page, setPage] = usePersistedState<number>('freelancer:contracts:page', 1);
  const [pageSize, setPageSize] = usePersistedState<number>('freelancer:contracts:pageSize', 10);
  const [density, setDensity] = usePersistedState<Density>('freelancer:contracts:density', 'comfortable');
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mockContracts.filter(c =>
      !q ||
      c.projectTitle.toLowerCase().includes(q) ||
      c.clientName.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q)
    );
  }, [query]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let av: string | number = (a as any)[sortKey] ?? '';
      let bv: string | number = (b as any)[sortKey] ?? '';
      // Numeric compare for value
      if (sortKey === 'value') {
        const na = Number(av);
        const nb = Number(bv);
        if (na < nb) return sortDir === 'asc' ? -1 : 1;
        if (na > nb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      }
      const sa = String(av).toLowerCase();
      const sb = String(bv).toLowerCase();
      if (sa < sb) return sortDir === 'asc' ? -1 : 1;
      if (sa > sb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageSafe, pageSize]);

  // Loading skeleton trigger on control changes
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 120);
    return () => clearTimeout(t);
  }, [query, sortKey, sortDir, page, pageSize]);

  // Column visibility
  const allColumns = ['projectTitle', 'clientName', 'value', 'status', 'contract'] as const;
  const { visible, toggle: toggleCol, setAll: setAllCols } = useColumnVisibility('freelancer:contracts', allColumns as unknown as string[]);
  const show = (key: typeof allColumns[number]) => visible.includes(key);

  // Selection
  const allFilteredIds = useMemo(() => filtered.map(c => c.id), [filtered]);
  const { selected, isSelected, toggle: toggleRow, clear, selectMany, deselectMany, count } = useSelection<string>(allFilteredIds);
  const pageIds = paged.map(c => c.id);
  const headerCheckboxChecked = pageIds.length > 0 && pageIds.every(id => isSelected(id));
  const headerCheckboxIndeterminate = !headerCheckboxChecked && pageIds.some(id => isSelected(id));
  const togglePageSelection = () => {
    if (headerCheckboxChecked) deselectMany(pageIds); else selectMany(pageIds);
  };

  const onExportCSV = () => {
    const header = ['Project', 'Client', 'Value (USDC)', 'Status', 'Contract'];
    const rows = sorted.map(c => [c.projectTitle, c.clientName, String(c.value), c.status, c.contractAddress]);
    exportCSV(header, rows, 'contracts');
  };

  const onExportSelected = () => {
    const selectedSet = new Set(selected);
    const selectedRows = filtered.filter(c => selectedSet.has(c.id));
    const header = ['Project', 'Client', 'Value (USDC)', 'Status', 'Contract'];
    const rows = selectedRows.map(c => [c.projectTitle, c.clientName, String(c.value), c.status, c.contractAddress]);
    exportCSV(header, rows, 'contracts-selected');
  };

  const sortOptions: SortOption[] = [
    { value: 'projectTitle:asc', label: 'Project A–Z' },
    { value: 'projectTitle:desc', label: 'Project Z–A' },
    { value: 'clientName:asc', label: 'Client A–Z' },
    { value: 'clientName:desc', label: 'Client Z–A' },
    { value: 'value:asc', label: 'Value Low–High' },
    { value: 'value:desc', label: 'Value High–Low' },
    { value: 'status:asc', label: 'Status A–Z' },
    { value: 'status:desc', label: 'Status Z–A' },
  ];

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Your Contracts</h1>
        <p className={styles.subtitle}>View and manage all your smart contracts.</p>
      </header>

      <main>
        <DataToolbar
          query={query}
          onQueryChange={(v) => { setQuery(v); setPage(1); }}
          sortValue={`${sortKey}:${sortDir}`}
          onSortChange={(val) => {
            const [k, d] = val.split(':') as [typeof sortKey, typeof sortDir];
            setSortKey(k); setSortDir(d); setPage(1);
          }}
          pageSize={pageSize}
          onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
          sortOptions={sortOptions}
          onExportCSV={onExportCSV}
          exportLabel="Export CSV"
          aria-label="Contracts filters and actions"
        />

        <div className={styles.extrasRow} role="group" aria-label="Table view options">
          <ColumnVisibilityMenu
            columns={[
              { key: 'projectTitle', label: 'Project' },
              { key: 'clientName', label: 'Client' },
              { key: 'value', label: 'Value (USDC)' },
              { key: 'status', label: 'Status' },
              { key: 'contract', label: 'Contract' },
            ]}
            visibleKeys={visible}
            onToggle={toggleCol}
            onShowAll={() => setAllCols(allColumns as unknown as string[])}
            onHideAll={() => setAllCols([])}
            aria-label="Toggle table columns"
          />
          <DensityToggle value={density} onChange={setDensity} />
        </div>

        <SelectionBar count={count} onClear={clear} onExportCSV={count>0 ? onExportSelected : undefined} />

        <div className={styles.tableContainer}>
          <table className={styles.table} data-density={density}>
            <thead>
              <tr>
                <th scope="col" className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    aria-label="Select page rows"
                    checked={headerCheckboxChecked}
                    ref={el => { if (el) el.indeterminate = headerCheckboxIndeterminate; }}
                    onChange={togglePageSelection}
                  />
                </th>
                {show('projectTitle') && (
                <th scope="col" aria-sort={sortKey==='projectTitle' ? (sortDir==='asc'?'ascending':'descending') : 'none'}>
                  <button type="button" className={styles.sortBtn} onClick={() => { setSortKey('projectTitle'); setSortDir(d => d==='asc'?'desc':'asc'); setPage(1); }} aria-label="Sort by project">
                    Project {sortKey==='projectTitle' && <span aria-hidden="true" className={styles.sortIndicator}>{sortDir==='asc'?'▲':'▼'}</span>}
                  </button>
                </th>
                )}
                {show('clientName') && (
                <th scope="col" aria-sort={sortKey==='clientName' ? (sortDir==='asc'?'ascending':'descending') : 'none'}>
                  <button type="button" className={styles.sortBtn} onClick={() => { setSortKey('clientName'); setSortDir(d => d==='asc'?'desc':'asc'); setPage(1); }} aria-label="Sort by client">
                    Client {sortKey==='clientName' && <span aria-hidden="true" className={styles.sortIndicator}>{sortDir==='asc'?'▲':'▼'}</span>}
                  </button>
                </th>
                )}
                {show('value') && (
                <th scope="col" aria-sort={sortKey==='value' ? (sortDir==='asc'?'ascending':'descending') : 'none'}>
                  <button type="button" className={styles.sortBtn} onClick={() => { setSortKey('value'); setSortDir(d => d==='asc'?'desc':'asc'); setPage(1); }} aria-label="Sort by value">
                    Value {sortKey==='value' && <span aria-hidden="true" className={styles.sortIndicator}>{sortDir==='asc'?'▲':'▼'}</span>}
                  </button>
                </th>
                )}
                {show('status') && (
                <th scope="col" aria-sort={sortKey==='status' ? (sortDir==='asc'?'ascending':'descending') : 'none'}>
                  <button type="button" className={styles.sortBtn} onClick={() => { setSortKey('status'); setSortDir(d => d==='asc'?'desc':'asc'); setPage(1); }} aria-label="Sort by status">
                    Status {sortKey==='status' && <span aria-hidden="true" className={styles.sortIndicator}>{sortDir==='asc'?'▲':'▼'}</span>}
                  </button>
                </th>
                )}
                {show('contract') && <th scope="col">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={1 + allColumns.length}>
                    <TableSkeleton rows={6} cols={6} dense={density==='compact'} />
                  </td>
                </tr>
              ) : paged.map(contract => (
                <tr key={contract.id}>
                  <td className={styles.checkboxCell}>
                    <input type="checkbox" aria-label={`Select ${contract.projectTitle}`} checked={isSelected(contract.id)} onChange={() => toggleRow(contract.id)} />
                  </td>
                  {show('projectTitle') && (
                    <td><span className={styles.projectTitle}>{contract.projectTitle}</span></td>
                  )}
                  {show('clientName') && <td>{contract.clientName}</td>}
                  {show('value') && (
                    <td><span className={styles.value}>{contract.value} USDC</span></td>
                  )}
                  {show('status') && (
                    <td><Badge variant={getStatusBadgeVariant(contract.status)}>{contract.status}</Badge></td>
                  )}
                  {show('contract') && (
                    <td>
                      <a
                        href={`https://etherscan.io/address/${contract.contractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                      >
                        View on Etherscan
                      </a>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length === 0 && (
            <div role="status" aria-live="polite" className={styles.emptyState}>No contracts found.</div>
          )}
        </div>

        {sorted.length > 0 && (
          <PaginationBar
            currentPage={pageSafe}
            totalPages={totalPages}
            totalResults={sorted.length}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => Math.min(totalPages, p + 1))}
          />
        )}
      </main>
    </div>
  );
};

export default ContractsPage;
