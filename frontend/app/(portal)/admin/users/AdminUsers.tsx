// @AI-HINT: Admin Users page. Theme-aware, accessible, animated user management with filters, selection, bulk actions, and modal.
'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import common from './AdminUsers.common.module.css';
import light from './AdminUsers.light.module.css';
import dark from './AdminUsers.dark.module.css';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Client' | 'Freelancer';
  status: 'Active' | 'Suspended';
  joined: string;
}

const USERS: UserRow[] = [
  { id: 'u1', name: 'Alex Carter', email: 'alex@megilance.com', role: 'Admin', status: 'Active', joined: '2024-11-01' },
  { id: 'u2', name: 'Hannah Lee', email: 'hannah@client.io', role: 'Client', status: 'Active', joined: '2025-02-18' },
  { id: 'u3', name: 'Sofia Gomez', email: 'sofia@freelance.dev', role: 'Freelancer', status: 'Suspended', joined: '2025-05-03' },
  { id: 'u4', name: 'Priya Patel', email: 'priya@client.io', role: 'Client', status: 'Active', joined: '2025-06-22' },
  { id: 'u5', name: 'Diego Ramos', email: 'diego@freelance.dev', role: 'Freelancer', status: 'Active', joined: '2025-07-14' },
];

const ROLES = ['All', 'Admin', 'Client', 'Freelancer'] as const;
const STATUSES = ['All', 'Active', 'Suspended'] as const;

const AdminUsers: React.FC = () => {
  const { theme } = useTheme();
  const themed = theme === 'dark' ? dark : light;

  const [query, setQuery] = useState('');
  const [role, setRole] = useState<(typeof ROLES)[number]>('All');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('All');
  const [rows, setRows] = useState<UserRow[]>(USERS);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<{ kind: 'suspend' | 'restore'; count: number } | null>(null);

  const headerRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);

  const headerVisible = useIntersectionObserver(headerRef, { threshold: 0.1 });
  const tableVisible = useIntersectionObserver(tableRef, { threshold: 0.1 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(r =>
      (role === 'All' || r.role === role) &&
      (status === 'All' || r.status === status) &&
      (!q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))
    );
  }, [rows, query, role, status]);

  const allSelected = filtered.length > 0 && filtered.every(r => selected[r.id]);
  const selectedIds = Object.keys(selected).filter(id => selected[id]);

  const toggleAll = () => {
    if (allSelected) {
      const copy = { ...selected };
      filtered.forEach(r => { copy[r.id] = false; });
      setSelected(copy);
    } else {
      const copy = { ...selected };
      filtered.forEach(r => { copy[r.id] = true; });
      setSelected(copy);
    }
  };

  const openModal = (kind: 'suspend' | 'restore') => {
    const count = selectedIds.length;
    if (count === 0) return;
    setModal({ kind, count });
  };

  const applyBulk = () => {
    if (!modal) return;
    const kind = modal.kind;
    setRows(prev => prev.map(r => selected[r.id] ? { ...r, status: kind === 'suspend' ? 'Suspended' : 'Active' } : r));
    setSelected({});
    setModal(null);
  };

  return (
    <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <div ref={headerRef} className={cn(common.header, headerVisible ? common.isVisible : common.isNotVisible)}>
          <div>
            <h1 className={common.title}>Users</h1>
            <p className={cn(common.subtitle, themed.subtitle)}>Manage all platform users. Filter by role and status, select multiple, and apply bulk actions.</p>
          </div>
          <div className={common.controls} aria-label="User filters">
            <label className={common.srOnly} htmlFor="q">Search</label>
            <input id="q" className={cn(common.input, themed.input)} type="search" placeholder="Search users…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <label className={common.srOnly} htmlFor="role">Role</label>
            <select id="role" className={cn(common.select, themed.select)} value={role} onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <label className={common.srOnly} htmlFor="status">Status</label>
            <select id="status" className={cn(common.select, themed.select)} value={status} onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="button" className={cn(common.button, themed.button)} onClick={() => openModal('suspend')} disabled={selectedIds.length === 0}>Suspend</button>
            <button type="button" className={cn(common.button, themed.button, 'secondary')} onClick={() => openModal('restore')} disabled={selectedIds.length === 0}>Restore</button>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className={cn(common.bulkBar, themed.bulkBar)} role="status" aria-live="polite">
            {selectedIds.length} selected
          </div>
        )}

        <div ref={tableRef} className={cn(common.tableWrap, tableVisible ? common.isVisible : common.isNotVisible)}>
          <table className={cn(common.table, themed.table)}>
            <thead>
              <tr>
                <th scope="col" className={themed.th + ' ' + common.th}>
                  <input type="checkbox" aria-label="Select all" checked={allSelected} onChange={toggleAll} />
                </th>
                <th scope="col" className={themed.th + ' ' + common.th}>Name</th>
                <th scope="col" className={themed.th + ' ' + common.th}>Email</th>
                <th scope="col" className={themed.th + ' ' + common.th}>Role</th>
                <th scope="col" className={themed.th + ' ' + common.th}>Status</th>
                <th scope="col" className={themed.th + ' ' + common.th}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className={common.row}>
                  <td className={themed.td + ' ' + common.td}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${u.name}`}
                      checked={!!selected[u.id]}
                      onChange={(e) => setSelected(prev => ({ ...prev, [u.id]: e.target.checked }))}
                    />
                  </td>
                  <td className={themed.td + ' ' + common.td}>{u.name}</td>
                  <td className={themed.td + ' ' + common.td}>{u.email}</td>
                  <td className={themed.td + ' ' + common.td}>{u.role}</td>
                  <td className={themed.td + ' ' + common.td}>{u.status}</td>
                  <td className={themed.td + ' ' + common.td}>{u.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div role="status" aria-live="polite" className={cn(common.bulkBar, themed.bulkBar)}>
              No users match your filters.
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className={common.modalOverlay} role="presentation" onClick={() => setModal(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className={cn(common.modal, themed.modal)}
            onClick={(e) => e.stopPropagation()}
          >
            <div id="modal-title" className={cn(common.modalTitle)}>
              {modal.kind === 'suspend' ? 'Suspend users' : 'Restore users'}
            </div>
            <p>{modal.count} selected user(s). Are you sure?</p>
            <div className={common.modalActions}>
              <button type="button" className={cn(common.button, themed.button)} onClick={applyBulk}>
                Confirm
              </button>
              <button type="button" className={cn(common.button, themed.button, 'secondary')} onClick={() => setModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default AdminUsers;
