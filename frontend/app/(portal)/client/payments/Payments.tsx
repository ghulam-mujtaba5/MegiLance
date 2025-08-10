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
            <button type="button" className={cn(common.button, themed.button)} onClick={() => alert('Export started')}>Export CSV</button>
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
              {filtered.map(p => (
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
          {filtered.length === 0 && !loading && (
            <div role="status" aria-live="polite" className={common.emptyState}>No transactions match your filters.</div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Payments;
