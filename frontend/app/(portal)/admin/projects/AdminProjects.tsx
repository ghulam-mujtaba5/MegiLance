// @AI-HINT: Admin Projects page. Theme-aware, accessible, animated list with filters and row actions.
'use client';

import React, { useMemo, useRef, useState } from 'react';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import { useAdminData } from '@/hooks/useAdmin';
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

const STATUSES = ['All', 'Planned', 'In Progress', 'Blocked', 'Completed'] as const;

const statusDotClass = (status: ProjectRow['status']) => {
  switch (status) {
    case 'Planned': return common.badgeDotPlanned;
    case 'In Progress': return common.badgeDotInProgress;
    case 'Blocked': return common.badgeDotBlocked;
    case 'Completed': return common.badgeDotCompleted;
  }
  return undefined;
};

const AdminProjects: React.FC = () => {
  const { theme } = useTheme();
  const themed = theme === 'dark' ? dark : light;
  const { projects, loading, error } = useAdminData();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('All');

  const headerRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const tableVisible = useIntersectionObserver(tableRef, { threshold: 0.1 });

  const rows: ProjectRow[] = useMemo(() => {
    if (!Array.isArray(projects)) return [];
    return (projects as any[]).map((p, idx) => ({
      id: String(p.id ?? idx),
      name: p.title ?? p.name,
      client: p.client ?? '—',
      budget: p.budget ?? '—',
      status: (p.status as ProjectRow['status']) ?? 'In Progress',
      updated: p.updatedAt ?? p.updated ?? '',
    }));
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(p =>
      (status === 'All' || p.status === status) &&
      (!q || p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q))
    );
  }, [rows, query, status]);

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

        <div ref={tableRef} className={cn(common.tableWrap, tableVisible ? common.isVisible : common.isNotVisible)} aria-busy={loading || undefined}>
          {error && <div className={common.error}>Failed to load projects.</div>}
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
            {loading ? (
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className={common.row}>
                    <td className={themed.td + ' ' + common.td} colSpan={6}>
                      <div className={common.skeletonRow}>
                        <Skeleton height={14} width={'40%'} />
                        <Skeleton height={12} width={'70%'} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className={common.row}>
                    <td className={themed.td + ' ' + common.td}>{p.name}</td>
                    <td className={themed.td + ' ' + common.td}>{p.client}</td>
                    <td className={themed.td + ' ' + common.td}>{p.budget}</td>
                    <td className={themed.td + ' ' + common.td}>
                      <span className={cn(common.badge, themed.badge)}>
                        <span className={cn(common.badgeDot, statusDotClass(p.status))} aria-hidden="true" />
                        {p.status}
                      </span>
                    </td>
                    <td className={themed.td + ' ' + common.td}>{p.updated}</td>
                    <td className={themed.td + ' ' + common.td}>
                      <div className={common.rowActions}>
                        <button type="button" className={cn(common.button, themed.button, 'secondary')}>Open</button>
                        <button type="button" className={cn(common.button, themed.button)}>Assign</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
          {filtered.length === 0 && !loading && (
            <div className={cn(common.empty)} role="status" aria-live="polite">No projects match your filters.</div>
          )}
        </div>
      </div>
    </main>
  );
};

export default AdminProjects;
