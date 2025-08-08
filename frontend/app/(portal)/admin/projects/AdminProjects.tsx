// @AI-HINT: Admin Projects page. Theme-aware, accessible, animated list with filters and row actions.
'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import common from './AdminProjects.common.module.css';
import light from './AdminProjects.light.module.css';
import dark from './AdminProjects.dark.module.css';

interface ProjectRow {
  id: string;
  name: string;
  client: string;
  budget: string;
  status: 'Planned' | 'In Progress' | 'Blocked' | 'Completed';
  updated: string;
}

const PROJECTS: ProjectRow[] = [
  { id: 'p1', name: 'Mobile App Redesign', client: 'NovaTech', budget: '$45,000', status: 'In Progress', updated: '2025-08-03' },
  { id: 'p2', name: 'AI Matching Engine', client: 'MegiLance', budget: '$120,000', status: 'Planned', updated: '2025-07-28' },
  { id: 'p3', name: 'Website Revamp', client: 'BluePeak', budget: '$32,000', status: 'Blocked', updated: '2025-07-30' },
  { id: 'p4', name: 'Payments Integration', client: 'Finora', budget: '$60,000', status: 'Completed', updated: '2025-07-12' },
];

const STATUSES = ['All', 'Planned', 'In Progress', 'Blocked', 'Completed'] as const;

const statusDotColor = (status: ProjectRow['status']) => {
  switch (status) {
    case 'Planned': return 'var(--warning)';
    case 'In Progress': return 'var(--primary)';
    case 'Blocked': return 'var(--error)';
    case 'Completed': return 'var(--success)';
  }
};

const AdminProjects: React.FC = () => {
  const { theme } = useTheme();
  const themed = theme === 'dark' ? dark : light;

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('All');

  const headerRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const tableVisible = useIntersectionObserver(tableRef, { threshold: 0.1 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROJECTS.filter(p =>
      (status === 'All' || p.status === status) &&
      (!q || p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q))
    );
  }, [query, status]);

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <div ref={headerRef} className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}>
          <div>
            <h1 className={common.title}>Projects</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Platform-wide projects overview. Filter by status and search by name/client.</p>
          </div>
          <div className={common.controls} aria-label="Project filters">
            <label className={common.srOnly} htmlFor="q">Search</label>
            <input id="q" className={cn(common.input, themed.input)} type="search" placeholder="Search projects…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <label className={common.srOnly} htmlFor="status">Status</label>
            <select id="status" className={cn(common.select, themed.select)} value={status} onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="button" className={cn(common.button, themed.button)}>Create Project</button>
            <button type="button" className={cn(common.button, themed.button, 'secondary')}>Export CSV</button>
          </div>
        </div>

        <div ref={tableRef} className={cn(common.tableWrap, tableVisible ? common.isVisible : common.isNotVisible)}>
          <table className={cn(common.table, themed.table)}>
            <thead>
              <tr>
                <th scope="col" className={themed.th + ' ' + common.th}>Name</th>
                <th scope="col" className={themed.th + ' ' + common.th}>Client</th>
                <th scope="col" className={themed.th + ' ' + common.th}>Budget</th>
                <th scope="col" className={themed.th + ' ' + common.th}>Status</th>
                <th scope="col" className={themed.th + ' ' + common.th}>Updated</th>
                <th scope="col" className={themed.th + ' ' + common.th} aria-label="Actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className={common.row}>
                  <td className={themed.td + ' ' + common.td}>{p.name}</td>
                  <td className={themed.td + ' ' + common.td}>{p.client}</td>
                  <td className={themed.td + ' ' + common.td}>{p.budget}</td>
                  <td className={themed.td + ' ' + common.td}>
                    <span className={cn(common.badge, themed.badge)}>
                      <span className={common.badgeDot} style={{ background: statusDotColor(p.status) }} aria-hidden="true" />
                      {p.status}
                    </span>
                  </td>
                  <td className={themed.td + ' ' + common.td}>{p.updated}</td>
                  <td className={themed.td + ' ' + common.td}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className={cn(common.button, themed.button, 'secondary')}>Open</button>
                      <button type="button" className={cn(common.button, themed.button)}>Assign</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className={cn(common.empty)} role="status" aria-live="polite">No projects match your filters.</div>
          )}
        </div>
      </div>
    </main>
  );
};

export default AdminProjects;
