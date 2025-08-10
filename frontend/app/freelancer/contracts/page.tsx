// @AI-HINT: This page allows freelancers to view their smart contracts for ongoing and completed jobs, now with a premium, theme-aware, and accessible table layout.
'use client';

import React, { useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import Badge from '@/app/components/Badge/Badge';
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

  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<'projectTitle' | 'clientName' | 'value' | 'status'>('projectTitle');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const exportCSV = () => {
    const header = ['Project', 'Client', 'Value (USDC)', 'Status', 'Contract'];
    const rows = sorted.map(c => [c.projectTitle, c.clientName, String(c.value), c.status, c.contractAddress]);
    const csv = [header, ...rows]
      .map(cols => cols.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contracts.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Your Contracts</h1>
        <p className={styles.subtitle}>View and manage all your smart contracts.</p>
      </header>

      <main>
        <div className={styles.toolbar} role="group" aria-label="Filters and actions">
          <label htmlFor="q" className={styles.srOnly}>Search contracts</label>
          <input
            id="q"
            className={styles.input}
            type="search"
            placeholder="Search by project, client, or status"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          />
          <label htmlFor="sort" className={styles.srOnly}>Sort by</label>
          <select
            id="sort"
            className={styles.select}
            value={`${sortKey}:${sortDir}`}
            onChange={(e) => {
              const [k, d] = e.target.value.split(':') as [typeof sortKey, typeof sortDir];
              setSortKey(k);
              setSortDir(d);
              setPage(1);
            }}
            aria-label="Sort contracts"
          >
            <option value="projectTitle:asc">Project A–Z</option>
            <option value="projectTitle:desc">Project Z–A</option>
            <option value="clientName:asc">Client A–Z</option>
            <option value="clientName:desc">Client Z–A</option>
            <option value="value:asc">Value Low–High</option>
            <option value="value:desc">Value High–Low</option>
            <option value="status:asc">Status A–Z</option>
            <option value="status:desc">Status Z–A</option>
          </select>
          <button type="button" className={styles.button} onClick={exportCSV} aria-label="Export current results to CSV">Export CSV</button>
          <label htmlFor="pageSize" className={styles.srOnly}>Rows per page</label>
          <select
            id="pageSize"
            className={styles.select}
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            aria-label="Rows per page"
          >
            {[10, 20, 50].map(sz => <option key={sz} value={sz}>{sz}/page</option>)}
          </select>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col" aria-sort={sortKey==='projectTitle' ? (sortDir==='asc'?'ascending':'descending') : undefined}>
                  <button type="button" className={styles.sortBtn} onClick={() => { setSortKey('projectTitle'); setSortDir(d => d==='asc'?'desc':'asc'); setPage(1); }} aria-label="Sort by project">
                    Project {sortKey==='projectTitle' && <span aria-hidden="true" className={styles.sortIndicator}>{sortDir==='asc'?'▲':'▼'}</span>}
                  </button>
                </th>
                <th scope="col" aria-sort={sortKey==='clientName' ? (sortDir==='asc'?'ascending':'descending') : undefined}>
                  <button type="button" className={styles.sortBtn} onClick={() => { setSortKey('clientName'); setSortDir(d => d==='asc'?'desc':'asc'); setPage(1); }} aria-label="Sort by client">
                    Client {sortKey==='clientName' && <span aria-hidden="true" className={styles.sortIndicator}>{sortDir==='asc'?'▲':'▼'}</span>}
                  </button>
                </th>
                <th scope="col" aria-sort={sortKey==='value' ? (sortDir==='asc'?'ascending':'descending') : undefined}>
                  <button type="button" className={styles.sortBtn} onClick={() => { setSortKey('value'); setSortDir(d => d==='asc'?'desc':'asc'); setPage(1); }} aria-label="Sort by value">
                    Value {sortKey==='value' && <span aria-hidden="true" className={styles.sortIndicator}>{sortDir==='asc'?'▲':'▼'}</span>}
                  </button>
                </th>
                <th scope="col" aria-sort={sortKey==='status' ? (sortDir==='asc'?'ascending':'descending') : undefined}>
                  <button type="button" className={styles.sortBtn} onClick={() => { setSortKey('status'); setSortDir(d => d==='asc'?'desc':'asc'); setPage(1); }} aria-label="Sort by status">
                    Status {sortKey==='status' && <span aria-hidden="true" className={styles.sortIndicator}>{sortDir==='asc'?'▲':'▼'}</span>}
                  </button>
                </th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(contract => (
                <tr key={contract.id}>
                  <td>
                    <span className={styles.projectTitle}>{contract.projectTitle}</span>
                  </td>
                  <td>{contract.clientName}</td>
                  <td>
                    <span className={styles.value}>{contract.value} USDC</span>
                  </td>
                  <td>
                    <Badge variant={getStatusBadgeVariant(contract.status)}>{contract.status}</Badge>
                  </td>
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
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length === 0 && (
            <div role="status" aria-live="polite" className={styles.emptyState}>No contracts found.</div>
          )}
        </div>

        {sorted.length > 0 && (
          <div className={styles.paginationBar} role="navigation" aria-label="Pagination">
            <button
              type="button"
              className={styles.button}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={pageSafe === 1}
              aria-label="Previous page"
            >
              Prev
            </button>
            <span className={styles.paginationInfo} aria-live="polite">Page {pageSafe} of {totalPages} · {sorted.length} result(s)</span>
            <button
              type="button"
              className={styles.button}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={pageSafe === totalPages}
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ContractsPage;
