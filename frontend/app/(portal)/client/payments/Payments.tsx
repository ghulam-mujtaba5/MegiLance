// @AI-HINT: Client Payments history. Theme-aware, accessible filters, KPI summary, and animated payments table.
'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import { useClientData } from '@/hooks/useClient';
import common from './Payments.common.module.css';
import light from './Payments.light.module.css';
import dark from './Payments.dark.module.css';

interface Payment {
  id: string;
  date: string; // YYYY-MM-DD
  project: string;
  freelancer: string;
  amount: number; // USD
  status: 'Paid' | 'Pending' | 'Failed';
}

const STATUSES = ['All', 'Paid', 'Pending', 'Failed'] as const;

const Payments: React.FC = () => {
  const { theme } = useTheme();
  const themed = theme === 'dark' ? dark : light;
  const { payments, loading, error } = useClientData();

  const rows: Payment[] = useMemo(() => {
    if (!Array.isArray(payments)) return [];
    return (payments as any[]).map((p, idx) => ({
      id: String(p.id ?? idx),
      date: p.date ?? p.createdAt ?? '',
      project: p.project ?? p.description ?? 'Unknown Project',
      freelancer: p.freelancer ?? p.user ?? 'Unknown',
      amount: Number(p.amount?.replace(/[$,]/g, '')) || 0,
      status: (p.status as Payment['status']) ?? 'Pending',
    }));
  }, [payments]);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('All');

  const headerRef = useRef<HTMLDivElement | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const summaryVisible = useIntersectionObserver(summaryRef, { threshold: 0.1 });
  const tableVisible = useIntersectionObserver(tableRef, { threshold: 0.1 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(p =>
      (status === 'All' || p.status === status) &&
      (!q || p.project.toLowerCase().includes(q) || p.freelancer.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
    );
  }, [rows, query, status]);

  const kpiTotal = useMemo(() => rows.reduce((s, p) => s + p.amount, 0), [rows]);
  const kpiPaid = useMemo(() => rows.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0), [rows]);
  const kpiPending = useMemo(() => rows.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0), [rows]);

  const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

  // Sorting
  type SortKey = 'id' | 'date' | 'project' | 'freelancer' | 'amount' | 'status';
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      switch (sortKey) {
        case 'id': av = a.id; bv = b.id; break;
        case 'date': av = a.date; bv = b.date; break;
        case 'project': av = a.project; bv = b.project; break;
        case 'freelancer': av = a.freelancer; bv = b.freelancer; break;
        case 'amount': av = a.amount; bv = b.amount; break;
        case 'status': av = a.status; bv = b.status; break;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const paged = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageSafe, pageSize]);

  React.useEffect(() => { setPage(1); }, [sortKey, sortDir, query, status, pageSize]);

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <div ref={headerRef} className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}>
          <div>
            <h1 className={common.title}>Payments</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Review your payment history, filter transactions, and export records.</p>
          </div>
          <div className={common.controls} aria-label="Payment filters">
            <label className={common.srOnly} htmlFor="q">Search</label>
            <input id="q" className={cn(common.input, themed.input)} type="search" placeholder="Search by project, freelancer, or ID…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <label className={common.srOnly} htmlFor="status">Status</label>
            <select id="status" className={cn(common.select, themed.select)} value={status} onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className={cn(common.toolbar)}>
            <div className={common.controls}>
              <label className={common.srOnly} htmlFor="sort-key">Sort by</label>
              <select id="sort-key" className={cn(common.select, themed.select)} value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="status">Status</option>
                <option value="project">Project</option>
                <option value="freelancer">Freelancer</option>
                <option value="id">ID</option>
              </select>
              <label className={common.srOnly} htmlFor="sort-dir">Sort direction</label>
              <select id="sort-dir" className={cn(common.select, themed.select)} value={sortDir} onChange={(e) => setSortDir(e.target.value as 'asc'|'desc')}>
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
              <label className={common.srOnly} htmlFor="page-size">Rows per page</label>
              <select id="page-size" className={cn(common.select, themed.select)} value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div>
              <button
                type="button"
                className={cn(common.button, themed.button)}
                onClick={() => {
                  const header = ['ID','Date','Project','Freelancer','Amount','Status'];
                  const data = sorted.map(p => [p.id, p.date, p.project, p.freelancer, p.amount, p.status]);
                  const csv = [header, ...data]
                    .map(r => r.map(val => '"' + String(val).replace(/"/g, '""') + '"').join(','))
                    .join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `client_payments_${new Date().toISOString().slice(0,10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >Export CSV</button>
            </div>
          </div>
        </div>

        <div ref={summaryRef} className={cn(common.summary, summaryVisible ? common.isVisible : common.isNotVisible)} aria-label="Payment summary">
          <div className={cn(common.card, themed.card)}>
            <div className={cn(common.cardTitle, themed.cardTitle)}>Total</div>
            <div className={cn(common.cardValue, themed.cardValue)}>{fmt(kpiTotal)}</div>
          </div>
          <div className={cn(common.card, themed.card)}>
            <div className={cn(common.cardTitle, themed.cardTitle)}>Paid</div>
            <div className={cn(common.cardValue, themed.cardValue)}>{fmt(kpiPaid)}</div>
          </div>
          <div className={cn(common.card, themed.card)}>
            <div className={cn(common.cardTitle, themed.cardTitle)}>Pending</div>
            <div className={cn(common.cardValue, themed.cardValue)}>{fmt(kpiPending)}</div>
          </div>
        </div>

        <div ref={tableRef} className={cn(common.tableWrap, tableVisible ? common.isVisible : common.isNotVisible)}>
          {loading && <div className={common.skeletonRow} aria-busy="true" />}
          {error && <div className={common.error}>Failed to load payments.</div>}
          <table className={cn(common.table)} role="table" aria-label="Payments table">
            <thead>
              <tr className={common.tr}>
                <th scope="col" className={common.th}>ID</th>
                <th scope="col" className={common.th}>Date</th>
                <th scope="col" className={common.th}>Project</th>
                <th scope="col" className={common.th}>Freelancer</th>
                <th scope="col" className={common.th}>Amount</th>
                <th scope="col" className={common.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(p => (
                <tr key={p.id} className={common.tr}>
                  <td className={common.td}>{p.id}</td>
                  <td className={common.td}>{p.date}</td>
                  <td className={common.td}>{p.project}</td>
                  <td className={common.td}>{p.freelancer}</td>
                  <td className={common.td}>{fmt(p.amount)}</td>
                  <td className={common.td}>
                    <span className={cn(common.status, themed.status)}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length === 0 && !loading && (
            <div role="status" aria-live="polite" className={common.emptyState}>No transactions match your filters.</div>
          )}
        </div>
        {sorted.length > 0 && (
          <div className={common.paginationBar} role="navigation" aria-label="Pagination">
            <button
              type="button"
              className={cn(common.button, themed.button, 'secondary')}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={pageSafe === 1}
              aria-label="Previous page"
            >Prev</button>
            <span className={common.paginationInfo} aria-live="polite">Page {pageSafe} of {totalPages} · {sorted.length} result(s)</span>
            <button
              type="button"
              className={cn(common.button, themed.button)}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={pageSafe === totalPages}
              aria-label="Next page"
            >Next</button>
          </div>
        )}
      </div>
    </main>
  );
};

export default Payments;
