// @AI-HINT: Admin Support page. Theme-aware, accessible, animated tickets list with filters and a details panel.
'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import { useAdminData } from '@/hooks/useAdmin';
import common from './AdminSupport.common.module.css';
import light from './AdminSupport.light.module.css';
import dark from './AdminSupport.dark.module.css';

interface Ticket {
  id: string;
  subject: string;
  requester: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved';
  created: string; // ISO
  assignee?: string;
  body: string;
}

const STATUSES = ['All', 'Open', 'In Progress', 'Resolved'] as const;
const PRIORITIES = ['All', 'Low', 'Medium', 'High'] as const;

const AdminSupport: React.FC = () => {
  const { theme } = useTheme();
  const themed = theme === 'dark' ? dark : light;
  const { tickets, loading, error } = useAdminData();

  const rows: Ticket[] = useMemo(() => {
    if (!Array.isArray(tickets)) return [];
    return (tickets as any[]).map((t, idx) => ({
      id: String(t.id ?? idx),
      subject: t.subject ?? '—',
      requester: t.requester ?? '—',
      priority: (t.priority as Ticket['priority']) ?? 'Low',
      status: (t.status as Ticket['status']) ?? 'Open',
      created: t.createdAt ?? t.created ?? '',
      assignee: t.assignee ?? undefined,
      body: t.body ?? t.message ?? '',
    }));
  }, [tickets]);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('All');
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('All');
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);

  const headerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const detailsRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const listVisible = useIntersectionObserver(listRef, { threshold: 0.1 });
  const detailsVisible = useIntersectionObserver(detailsRef, { threshold: 0.1 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(t =>
      (status === 'All' || t.status === status) &&
      (priority === 'All' || t.priority === priority) &&
      (!q || t.subject.toLowerCase().includes(q) || t.requester.toLowerCase().includes(q) || (t.assignee?.toLowerCase().includes(q) ?? false))
    );
  }, [rows, query, status, priority]);

  const selectedTicket = filtered.find(t => t.id === selectedId) || rows.find(t => t.id === selectedId) || null;

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <div ref={headerRef} className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}>
          <div>
            <h1 className={common.title}>Support</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Triage and resolve support tickets. Filter by status and priority; select a ticket to view details.</p>
          </div>
          <div className={common.controls} aria-label="Support filters">
            <label className={common.srOnly} htmlFor="q">Search</label>
            <input id="q" className={cn(common.input, themed.input)} type="search" placeholder="Search subject, requester, assignee…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <label className={common.srOnly} htmlFor="status">Status</label>
            <select id="status" className={cn(common.select, themed.select)} value={status} onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className={common.srOnly} htmlFor="priority">Priority</label>
            <select id="priority" className={cn(common.select, themed.select)} value={priority} onChange={(e) => setPriority(e.target.value as (typeof PRIORITIES)[number])}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button type="button" className={cn(common.button, themed.button)}>New Ticket</button>
          </div>
        </div>

        <section className={cn(common.layout)}>
          <div ref={listRef} className={cn(common.listCard, themed.listCard, listVisible ? common.isVisible : common.isNotVisible)} aria-label="Tickets list">
            <div className={cn(common.cardTitle)}>Tickets</div>
            {loading && <div className={common.skeletonRow} aria-busy={loading || undefined} />}
            {error && <div className={common.error}>Failed to load tickets.</div>}
            <div className={common.list} role="listbox" aria-label="Tickets">
              {filtered.map(t => {
                const isSelected = selectedId === t.id;
                return (
                  <div
                    key={t.id}
                    role="option"
                    aria-selected={isSelected ? 'true' : 'false'}
                    tabIndex={0}
                    className={cn(common.item)}
                    onClick={() => setSelectedId(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId(t.id);
                      }
                    }}
                  >
                    <div className={common.itemHeader}>
                      <span>{t.subject}</span>
                      <span className={cn(common.badge, themed.badge)}>{t.priority}</span>
                    </div>
                    <div className={common.meta}>
                      <span>{t.requester}</span>
                      <span>•</span>
                      <span>{t.status}</span>
                      <span>•</span>
                      <span>{t.created}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {filtered.length === 0 && !loading && (
              <div role="status" aria-live="polite">No tickets match your filters.</div>
            )}
          </div>

          <div ref={detailsRef} className={cn(common.detailsCard, themed.detailsCard, detailsVisible ? common.isVisible : common.isNotVisible)} aria-label="Ticket details">
            <div className={cn(common.cardTitle)}>Details</div>
            {selectedTicket ? (
              <div className={common.detailsGrid}>
                <div className={common.kv}><div>Subject</div><div>{selectedTicket.subject}</div></div>
                <div className={common.kv}><div>Requester</div><div>{selectedTicket.requester}</div></div>
                <div className={common.kv}><div>Status</div><div>{selectedTicket.status}</div></div>
                <div className={common.kv}><div>Priority</div><div>{selectedTicket.priority}</div></div>
                <div className={common.kv}><div>Assignee</div><div>{selectedTicket.assignee ?? 'Unassigned'}</div></div>
                <div className={common.kv}><div>Created</div><div>{selectedTicket.created}</div></div>
                <div className={common.kv}><div>Message</div><div>{selectedTicket.body}</div></div>
                <div className={common.actions}>
                  <button type="button" className={cn(common.button, themed.button)}>Assign</button>
                  <button type="button" className={cn(common.button, themed.button, 'secondary')}>Resolve</button>
                </div>
              </div>
            ) : (
              <div role="status" aria-live="polite">Select a ticket to view details.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminSupport;
